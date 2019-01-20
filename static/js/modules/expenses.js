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
  }
};

module.exports = Expenses;
