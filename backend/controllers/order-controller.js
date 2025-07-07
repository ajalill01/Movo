const mongoose = require('mongoose');
const Order = require('../model/Order');
const Product = require('../model/Product');
const Finance = require('../model/Finance');


const createOrder = async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber, address, cartItems, paymentMethod } = req.body;


    let totalPrice = 0;
    const products = await Product.find({ 
      _id: { $in: cartItems.map(i => i.productId) } 
    });


    cartItems.forEach(item => {
      const product = products.find(p => p._id.equals(item.productId));
      if (!product) throw new Error(`Product ${item.productId} not found`);
      if (product.stock < item.quantity) {
        throw new Error(`Only ${product.stock} items left for ${product.name}`);
      }
      totalPrice += product.price * item.quantity;
    });


    await Promise.all(
      cartItems.map(item => 
        Product.findByIdAndUpdate(item.productId, { 
          $inc: { stock: -item.quantity } 
        })
    ));

    const order = new Order({
      firstName,
      lastName,
      phoneNumber,
      address,
      cartItems: cartItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: products.find(p => p._id.equals(item.productId)).price
      })),
      totalPrice,
      paymentMethod
    });

    await order.save();
    res.status(201).json({ success: true, order });

  } catch (err) {
    res.status(400).json({ 
      success: false,
      message: err.message 
    });
  }
};


const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }


    if (status === 'confirmed' && order.status !== 'confirmed') {
      await Finance.findOneAndUpdate(
        {},
        { $inc: { incomes: order.totalPrice } },
        { upsert: true }
      );
    }


    order.status = status;
    await order.save();

    res.status(200).json({ 
      success: true, 
      order 
    });

  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
};


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
      orders
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
};


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

    res.status(200).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
};



const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Order deleted' 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
};


const deleteAllOrders = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { confirm } = req.body;
    if (confirm !== "CONFIRM_DELETE_ALL") {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false, 
        message: 'Confirmation required' 
      });
    }

    await Order.deleteMany({}).session(session);
    await session.commitTransaction();

    res.status(200).json({ 
      success: true, 
      message: 'All orders deleted' 
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
  deleteOrder,
  deleteAllOrders
};