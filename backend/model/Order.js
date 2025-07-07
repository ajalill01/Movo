const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  phoneNumber: { 
    type: String, 
    required: true,
    match: [/^0[5-7]\d{8}$/, 'Invalid Algerian phone number'] 
  },
  address: { type: String, required: true, trim: true },
  cartItems: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true }
  }],
  totalPrice: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'canceled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['edahabia', 'cash'],
    required: true
  }
}, { 
  versionKey: false,
  timestamps: true 
});

module.exports = mongoose.model('Order', orderSchema);