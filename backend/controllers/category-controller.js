const Category = require('../model/Category');

const createCategory = async (req, res) => {
  try {
        const { name } = req.body;

    if (!name) {
      return res.status(400).json({ 
        success: false,
        error: 'Category name is required' 
      });
    }

    const existingCategory = await Category.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
    });

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        error: 'Category with this name already exists'
      });
    }

    const category = new Category({ name: name.trim() });
    await category.save();

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category
    });
  } catch (err) {
    console.error('Category creation error:', err);
    

    if (err instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: err.errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error during category creation',
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }
};


const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: categories.length,
      categories
    });

  } catch (err) {
    console.error('Get categories error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories',
      message: err.message
    });
  }
};


const getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      category
    });

  } catch (err) {
    console.error('Get category error:', err);
    
    if (err instanceof mongoose.Error.CastError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category ID format'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error while fetching category',
      message: err.message
    });
  }
};


const updateCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const { id } = req.params;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Category name is required for update'
      });
    }

    const trimmedName = name.trim();


    const currentCategory = await Category.findById(id);
    if (!currentCategory) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    if (currentCategory.name.toLowerCase() === trimmedName.toLowerCase()) {
      return res.status(400).json({
        success: false,
        error: 'New category name is identical to the current name'
      });
    }


    const existingCategory = await Category.findOne({
      _id: { $ne: id },
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') }
    });

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        error: 'Category with this name already exists'
      });
    }


    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { name: trimmedName },
      { 
        new: true, 
        runValidators: true 
      }
    );

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      category: updatedCategory
    });

  } catch (err) {
    console.error('Update category error:', err);
    
    if (err instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: err.errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error during category update',
      message: err.message
    });
  }
};


const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });

  } catch (err) {
    console.error('Delete category error:', err);
    
    if (err instanceof mongoose.Error.CastError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category ID format'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error during category deletion',
      message: err.message
    });
  }
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategory,
  updateCategory,
  deleteCategory
};