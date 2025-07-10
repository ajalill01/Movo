const Order = require('../model/Order');
const Product = require('../model/Product');
const Finance = require('../model/Finance');
const mongoose = require('mongoose');

// Create new order
const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { firstName, lastName, phoneNumber, address, cartItems, paymentMethod } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !phoneNumber || !address || !cartItems || !paymentMethod) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Process cart items
    let totalPrice = 0;
    const processedItems = [];
    
    for (const item of cartItems) {
      const product = await Product.findById(item.productId).session(session);
      
      if (!product) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: `Product not found with ID: ${item.productId}`
        });
      }

      if (product.stock < item.quantity) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} items available for ${product.name}`
        });
      }

      processedItems.push({
        productId: product._id,
        quantity: item.quantity,
        price: product.price
      });

      totalPrice += product.price * item.quantity;
      
      // Reserve stock
      product.stock -= item.quantity;
      await product.save({ session });
    }

    // Create order
    const order = new Order({
      firstName,
      lastName,
      phoneNumber,
      address,
      cartItems: processedItems,
      totalPrice,
      paymentMethod
    });

    await order.save({ session });
    await session.commitTransaction();

    res.status(201).json({
      success: true,
      data: order
    });

  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({
      success: false,
      message: err.message
    });
  } finally {
    session.endSession();
  }
};

// Get all orders
const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = status ? { status } : {};

    const orders = await Order.find(query)
      .populate('cartItems.productId', 'name price')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: orders
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
};

// Get order details
const getOrderDetails = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('cartItems.productId', 'name price image');

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    res.status(200).json({ 
      success: true, 
      data: order 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id)
      .populate('cartItems.productId')
      .session(session);

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    // Handle status transitions
    if (status === 'confirmed' && order.status !== 'confirmed') {
      // Update finance
      await Finance.findOneAndUpdate(
        {},
        { $inc: { incomes: order.totalPrice } },
        { upsert: true, session }
      );
    } 
    else if (status === 'canceled' && order.status === 'confirmed') {
      // Restock items if canceling confirmed order
      for (const item of order.cartItems) {
        await Product.findByIdAndUpdate(
          item.productId._id,
          { $inc: { stock: item.quantity } },
          { session }
        );
      }
    }

    order.status = status;
    await order.save({ session });
    await session.commitTransaction();

    res.status(200).json({ 
      success: true, 
      data: order 
    });

  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  } finally {
    session.endSession();
  }
};

// Delete order
const deleteOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(req.params.id)
      .populate('cartItems.productId')
      .session(session);

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    // Restock items if order was confirmed
    if (order.status === 'confirmed') {
      for (const item of order.cartItems) {
        await Product.findByIdAndUpdate(
          item.productId._id,
          { $inc: { stock: item.quantity } },
          { session }
        );
      }
    }

    await Order.findByIdAndDelete(req.params.id).session(session);
    await session.commitTransaction();

    res.status(200).json({ 
      success: true, 
      message: 'Order deleted successfully' 
    });

  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  } finally {
    session.endSession();
  }
};

module.exports = {
  createOrder,
  getAllOrders,
  getOrderDetails,
  updateOrderStatus,
  deleteOrder
};