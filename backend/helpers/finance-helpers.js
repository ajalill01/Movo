const Finance = require('../model/Finance');

const updateExpenses = async (cost, quantityDifference) => {
  try {
    const amountToAdd = cost * quantityDifference;
    

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let financeRecord = await Finance.findOne({
      createdAt: { $gte: today, $lt: tomorrow }
    });

    if (!financeRecord) {
      financeRecord = new Finance({ expenses: 0 });
    }

    financeRecord.expenses += amountToAdd;
    financeRecord.updatedAt = new Date();
    await financeRecord.save();

    return financeRecord;
  } catch (error) {
    console.error('Error updating expenses:', error);
    throw error;
  }
};

module.exports = { updateExpenses };