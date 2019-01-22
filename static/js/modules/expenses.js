const config = require('../../../config.json');
const Session = require('./session.js');

const Expenses = {
  addNewExpense: async (data) => {
    try {
      const out = await Session.api(config.api.addExpense.name, data);
      return out;
    } catch (err) {
      throw err;
    }
  },

  searchExpenses: async (address, offset, limit) => {
    try {
      const out = await Session.api(config.api.searchExpenses.name, {
        address: address,
        offset: offset,
        limit: limit,
      });
      return out;
    } catch (err) {
      throw err;
    }
  }
};

module.exports = Expenses;
