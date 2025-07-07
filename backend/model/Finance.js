const mongoose = require('mongoose');

const financeSchema = new mongoose.Schema({
  expenses: {
    type: Number,
    default: 0,
    min: 0
  },
  incomes: {
    type: Number,
    default: 0,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Finance', financeSchema);