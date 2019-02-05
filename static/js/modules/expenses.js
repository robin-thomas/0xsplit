const config = require('../../../config.json');
const Session = require('./session.js');

const Expenses = {
  addNewExpense: async (address, contactAddress, expenseJsonStr) => {
    try {
      const data = {
        address: address,
        contactAddress: contactAddress,
        expense: expenseJsonStr,
      };

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
  },

  searchExpensesWithKeyword: async (address, keyword, includeDeleted) => {
    try {
      const out = await Session.api(config.api.searchExpensesWithKeyword.name, {
        address: address,
        keyword: keyword,
        includeDeleted: includeDeleted,
      });
      return out;
    } catch (err) {
      throw err;
    }
  },

  deleteExpense: async (address, id) => {
    try {
      const out = await Session.api(config.api.deleteExpense.name, {
        address: address,
        id: id,
      });
      return out;
    } catch (err) {
      throw err;
    }
  },

  updateExpense: async (data) => {
    try {
      const out = await Session.api(config.api.deleteExpense.name, data);
      return out;
    } catch (err) {
      throw err;
    }
  }
};

module.exports = Expenses;
