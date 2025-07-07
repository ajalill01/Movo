const mongoose = require('mongoose');
const { uploadToCloudinary, destroyFromCloudinary } = require('../helpers/cloudinary-helpers');
const { updateExpenses } = require('../helpers/finance-helpers');
const fs = require('fs');
const Product = require('../model/Product');


const Finance = require('../model/Finance');

const createProduct = async (req, res) => {
  let cloudinaryImage = null;
  
  try {
    const { name, description, price, quantity, category } = req.body;


    if (!name || !description || !price || !category) {
      return res.status(400).json({
        success: false,
        error: 'Name, description, price, and category are required'
      });
    }

    const trimmedCategory = category.trim();
    if (!mongoose.Types.ObjectId.isValid(trimmedCategory)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category ID format'
      });
    }


    const existingProduct = await Product.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      category: trimmedCategory
    });

    if (existingProduct) {
      return res.status(409).json({
        success: false,
        error: 'Product with this name already exists in the same category'
      });
    }


    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Product image is required'
      });
    }


    cloudinaryImage = await uploadToCloudinary([req.file.path]);
    fs.unlinkSync(req.file.path);


    const parsedPrice = parseFloat(price);
    const parsedQuantity = quantity ? parseInt(quantity) : 1;
    const totalExpense = parsedPrice * parsedQuantity;


    const product = new Product({
      name: name.trim(),
      description,
      price: parsedPrice,
      quantity: parsedQuantity,
      category: trimmedCategory,
      image: {
        url: cloudinaryImage[0].url,
        publicId: cloudinaryImage[0].publicId
      }
    });


    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      await product.save({ session });

      await Finance.findOneAndUpdate(
        {},
        { 
          $inc: { expenses: totalExpense },
          $set: { updatedAt: new Date() }
        },
        { 
          upsert: true,
          new: true,
          session 
        }
      );

      await session.commitTransaction();
      session.endSession();

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        product,
        expenseAdded: totalExpense
      });

    } catch (transactionErr) {

      if (cloudinaryImage?.[0]?.publicId) {
        await destroyFromCloudinary(cloudinaryImage[0].publicId);
      }
      
      await session.abortTransaction();
      session.endSession();
      throw transactionErr;
    }

  } catch (err) {

    if (req.file?.path && !cloudinaryImage) {
      fs.unlinkSync(req.file.path);
    }
    
    console.error('Product creation error:', err);
    
    if (err instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: err.errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error during product creation',
      message: err.message
    });
  }
};

const getAllProducts = async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { category, search, minPrice, maxPrice, inStock } = req.query;
    let filter = {};

    if (category) filter.category = category;
    if (search) filter.$text = { $search: search };
    
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    if (inStock === 'true') filter.quantity = { $gt: 0 };
    if (inStock === 'false') filter.quantity = 0;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Product.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          total,
          totalPages,
          currentPage: page,
          limit,
          hasNextPage,
          hasPreviousPage,
          nextPage: hasNextPage ? page + 1 : null,
          previousPage: hasPreviousPage ? page - 1 : null
        }
      }
    });

  } catch (err) {
    console.error('Get products error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products',
      message: err.message
    });
  }
};


const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name');

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      product
    });

  } catch (err) {
    console.error('Get product error:', err);
    
    if (err instanceof mongoose.Error.CastError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID format'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error while fetching product',
      message: err.message
    });
  }
};

const updateProduct = async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    await session.startTransaction();
    const { id } = req.params;
    const updateData = {};
    let hasChanges = false;
    let targetCategory;
    let expenseToAdd = 0;
    let quantityIncrease = 0;
    let unitCost = 0;


    const currentProduct = await Product.findById(id).session(session);
    if (!currentProduct) {
      await session.abortTransaction();
      await session.endSession();
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    targetCategory = req.body.category 
      ? req.body.category.trim() 
      : currentProduct.category;

    if (req.body.category !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(targetCategory)) {
        await session.abortTransaction();
        await session.endSession();
        return res.status(400).json({
          success: false,
          error: 'Invalid category ID format'
        });
      }
    }

    if (req.body.name !== undefined || req.body.category !== undefined) {
      const newName = req.body.name !== undefined 
        ? req.body.name.trim() 
        : currentProduct.name;

      const existingProduct = await Product.findOne({
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${newName}$`, 'i') },
        category: targetCategory
      }).session(session);

      if (existingProduct) {
        await session.abortTransaction();
        await session.endSession();
        return res.status(409).json({
          success: false,
          error: 'Product with this name already exists in the target category'
        });
      }
    }

    if (req.body.name !== undefined) {
      const newName = req.body.name.trim();
      if (newName !== currentProduct.name) {
        updateData.name = newName;
        hasChanges = true;
      }
    }

    if (req.body.description !== undefined && 
        req.body.description !== currentProduct.description) {
      updateData.description = req.body.description;
      hasChanges = true;
    }
    
    if (req.body.price !== undefined) {
      const parsedPrice = parseFloat(req.body.price);
      if (isNaN(parsedPrice)) {
        await session.abortTransaction();
        await session.endSession();
        return res.status(400).json({
          success: false,
          error: 'Price must be a valid number'
        });
      }
      if (parsedPrice !== currentProduct.price) {
        updateData.price = parsedPrice;
        hasChanges = true;
      }
    }

    if (req.body.quantity !== undefined) {
      const parsedQuantity = parseInt(req.body.quantity);
      if (isNaN(parsedQuantity)) {
        await session.abortTransaction();
        await session.endSession();
        return res.status(400).json({
          success: false,
          error: 'Quantity must be a valid integer'
        });
      }

      if (parsedQuantity !== currentProduct.quantity) {
        updateData.quantity = parsedQuantity;
        hasChanges = true;

        if (parsedQuantity > currentProduct.quantity) {
          quantityIncrease = parsedQuantity - currentProduct.quantity;
          unitCost = req.body.cost !== undefined 
            ? parseFloat(req.body.cost) 
            : currentProduct.price;
          
          if (isNaN(unitCost)) {
            await session.abortTransaction();
            await session.endSession();
            return res.status(400).json({
              success: false,
              error: 'Cost must be a valid number'
            });
          }

          expenseToAdd = unitCost * quantityIncrease;
        }
      }
    }

    if (req.body.category !== undefined && 
        targetCategory !== currentProduct.category.toString()) {
      updateData.category = targetCategory;
      hasChanges = true;
    }

    if (req.file) {
      const uploadedImage = await uploadToCloudinary([req.file.path]);
      fs.unlinkSync(req.file.path);
      updateData.image = {
        url: uploadedImage[0].url,
        publicId: uploadedImage[0].publicId
      };
      hasChanges = true;
    }

    if (!hasChanges) {
      await session.abortTransaction();
      await session.endSession();
      return res.status(400).json({
        success: false,
        error: 'No changes detected - all values are the same as current'
      });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true, session }
    ).populate('category', 'name');

    if (expenseToAdd > 0) {
      await Finance.findOneAndUpdate(
        {},
        { $inc: { expenses: expenseToAdd } },
        { upsert: true, session }
      );
    }

    await session.commitTransaction();
    await session.endSession();

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct,
      ...(expenseToAdd > 0 && { 
        expenseAdded: expenseToAdd,
        calculation: `${quantityIncrease} units × ${unitCost} = ${expenseToAdd}`
      })
    });

  } catch (err) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();
    
    console.error('Update product error:', err);
    
    if (err instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: err.errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error during product update',
      message: err.message
    });
  }
};

const deleteProduct = async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    await session.startTransaction();

    const product = await Product.findById(req.params.id).session(session);
    
    if (!product) {
      await session.abortTransaction();
      await session.endSession();
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    if (product.image?.publicId) {
      try {
        await destroyFromCloudinary(product.image.publicId);
      } catch (cloudinaryErr) {
        console.error('Cloudinary deletion error:', cloudinaryErr);
      }
    }

    await Product.findByIdAndDelete(req.params.id).session(session);

    await session.commitTransaction();
    await session.endSession();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (err) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();
    
    console.error('Delete product error:', err);
    
    if (err instanceof mongoose.Error.CastError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID format'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error during product deletion',
      message: err.message
    });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  getProduct
};