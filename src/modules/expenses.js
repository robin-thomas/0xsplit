const ethUtil = require('ethereumjs-util');

const DB = require('./db.js');

const config = require('../../config.json');

const validateAmount = (amount) => {
  if (amount.trim().length === 0) {
    throw new Error('Expense amount cant be empty!');
  }
  if (isNaN(amount) || !/^([1-9]\d*|0)?(\.\d+)?$/.test(amount)) {
    throw new Error('Invalid expense amount!');
  }
  if (/^0*$/.test(amount)) {
    throw new Error('Expense amount cannot be 0!');
  }
};
const validateExpense = (expense) => {
  if (expense.contactAddress.trim().length === 0) {
    throw new Error('Contact address cannot be empty!');
  }
  if (!ethUtil.isValidAddress(expense.contactAddress)) {
    throw new Error('Contact ETH Address is invalid!');
  }

  if (expense.description.trim().length === 0) {
    throw new Error('Expense description cannot be empty!');
  }

  validateAmount(expense.amount.total);
  try {
    validateAmount(expense.amount.contactOwe);
    validateAmount(expense.amount.youOwe);
  } catch (err) {
    if (err.message === 'Expense amount cannot be 0!') {
      const contactOwe = parseFloat(expense.amount.contactOwe);
      const youOwe = parseFloat(expense.amount.youOwe);
      const totalOwe = contactOwe + youOwe;

      if (totalOwe !== parseFloat(expense.amount.total)) {
        throw err;
      }
    }
  }

  if (expense.timestamp.trim().length === 0) {
    throw new Error('Expense timestamp cant be empty!');
  }
  if (!/^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1]) (2[0-3]|[01][0-9]):[0-5][0-9]:[0-5][0-9]$/.test(expense.timestamp)) {
    throw new Error('Invalid expense timestamp!');
  }

  if (typeof expense.img !== 'undefined' &&
      !expense.img.startsWith(config.infura.ipfs.gateway)) {
    throw new Error('Invalid expense picture!');
  }
};

const Expenses = {
  addExpense: async (address, contactAddress, expense) => {
    // Perform the validation.
    // NEVER EVER TRUST THE USER.
    const jsonExpense = JSON.parse(expense);
    try {
      validateExpense(jsonExpense);
    } catch (err) {
      throw err;
    }

    // Add the expense.
    const query = {
      sql: 'INSERT INTO expenses(address, contact_address, expense, expense_timestamp) \
            VALUES(?, ?, ?, ?)',
      timeout: 6 * 1000, // 6s
      values: [ address, contactAddress, expense, jsonExpense.timestamp ],
    };
    try {
      await DB.insert(query);
    } catch (err) {
      throw err;
    }
  },

  searchExpenses: async (address, offset, limit) => {
    offset = parseInt(offset);
    limit = parseInt(limit);

    const query = {
      sql: 'SELECT expense FROM expenses \
            WHERE address = ? OR contact_address = ? \
            ORDER BY expense_timestamp DESC \
            LIMIT ? OFFSET ?',
      timeout: 6 * 1000, // 6s
      values: [address, address, limit, offset],
    };

    try {
      const out = await DB.select(query);
      return out;
    } catch (err) {
      throw err;
    }
  },
}

module.exports = Expenses;
