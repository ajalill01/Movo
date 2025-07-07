const Finance = require('../model/Finance');
const mongoose = require('mongoose');


const initializeFinanceRecord = async () => {
  try {
    const existingFinance = await Finance.findOne();
    if (!existingFinance) {
      const newFinance = new Finance({
        expenses: 0,
        incomes: 0
      });
      await newFinance.save();
      console.log('Initial finance record created');
    }
  } catch (err) {
    console.error('Error initializing finance record:', err);
  }
};

const getFinancialStats = async (req, res) => {
  try {
    await initializeFinanceRecord();
    
    const finance = await Finance.findOne();
    
    res.status(200).json({
      success: true,
      finances: finance || { expenses: 0, incomes: 0 }
    });

  } catch (err) {
    console.error('Error fetching financial stats:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch financial statistics',
      message: err.message
    });
  }
};


const addExpense = async (amount) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const updatedFinance = await Finance.findOneAndUpdate(
      {},
      { $inc: { expenses: amount } },
      { new: true, upsert: true, session }
    );
    
    await session.commitTransaction();
    session.endSession();
    return updatedFinance;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error adding expense:', err);
    throw err;
  }
};


const addIncome = async (amount) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const updatedFinance = await Finance.findOneAndUpdate(
      {},
      { $inc: { incomes: amount } },
      { new: true, upsert: true, session }
    );
    
    await session.commitTransaction();
    session.endSession();
    return updatedFinance;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error adding income:', err);
    throw err;
  }
};

module.exports = {
  initializeFinanceRecord,
  getFinancialStats,
  addExpense,
  addIncome
};