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
      const totalOwe = parseFloat(contactOwe + youOwe);

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
    try {
      validateExpense(JSON.parse(expense));
    } catch (err) {
      throw err;
    }

    const isSettlement = expense.is_settlement === undefined ? 0 : 1;

    // Add the expense.
    const query = {
      sql: 'INSERT INTO expenses(address, contact_address, expense, expense_timestamp, is_settlement) \
            VALUES(?, ?, ?, ?, ?)',
      timeout: 6 * 1000, // 6s
      values: [ address, contactAddress, expense, JSON.parse(expense).timestamp, isSettlement ],
    };
    try {
      const out = await DB.query(query);
      return out.insertId;
    } catch (err) {
      throw err;
    }
  },

  searchExpenses: async (address, offset, limit) => {
    offset = parseInt(offset);
    limit = parseInt(limit);

    const query = {
      sql: 'SELECT id,expense,deleted FROM expenses \
            WHERE address = ? OR contact_address = ? \
            ORDER BY expense_timestamp DESC \
            LIMIT ? OFFSET ?',
      timeout: 6 * 1000, // 6s
      values: [address, address, limit, offset],
    };

    try {
      const out = await DB.query(query);
      return out;
    } catch (err) {
      throw err;
    }
  },

  deleteExpense: async (expenseId) => {
    const query = {
      sql: 'UPDATE expenses SET deleted = true WHERE id = ?',
      timeout: 6 * 1000, // 6s
      values: [expenseId],
    };

    try {
      await DB.query(query);
    } catch (err) {
      throw err;
    }
  },

  updateExpense: async (expenseId, expense) => {
    // Perform the validation.
    // NEVER EVER TRUST THE USER.
    try {
      validateExpense(JSON.parse(expense));
    } catch (err) {
      throw err;
    }

    const query = {
      sql: 'UPDATE expenses SET expense = ?, expense_timestamp = ? WHERE id = ?',
      timeout: 6 * 1000, // 6s
      values: [ expense, JSON.parse(expense).timestamp, expenseId ],
    };

    try {
      await DB.query(query);
    } catch (err) {
      throw err;
    }
  },

  searchExpensesWithKeyword: async (address, keyword, includeDeleted) => {
    let sql = '';
    if (includeDeleted === 'true') {
      sql = 'SELECT id,expense,deleted,is_settlement FROM expenses \
            WHERE contact_address IN \
            (SELECT contact_address FROM contacts WHERE address = ? AND contact_nickname LIKE ?) \
            ORDER BY expense_timestamp DESC';
    } else {
      sql = 'SELECT id,expense,deleted,is_settlement FROM expenses \
            WHERE contact_address IN \
            (SELECT contact_address FROM contacts WHERE address = ? AND contact_nickname LIKE ?) \
            AND deleted = false \
            ORDER BY expense_timestamp DESC';
    }

    const query = {
      sql: sql,
      timeout: 6 * 1000, // 6s
      values: [address, keyword + '%'],
    };

    try {
      const out = await DB.query(query);
      return out;
    } catch (err) {
      throw err;
    }
  },

  getOweAmount: async (address, contactAddress) => {
    let results = {};

    let youAreOwed = null;
    let youOwe = null;

    // Get all expenses for which you are owed.
    let query = {
      sql: 'SELECT expense FROM expenses WHERE \
            address = ? AND contact_address = ? AND deleted = false',
      timeout: 6 * 1000, // 6s
      values: [ address, contactAddress ],
    };
    try {
      youAreOwed = await DB.query(query);

      if (youAreOwed.length > 0) {
        for (let expense of youAreOwed) {
          expense = expense.expense;
          expense = JSON.parse(expense);

          const token = expense.token;
          const contactOwe = expense.amount.contactOwe;

          if (token in results) {
            results[token] -= parseFloat(contactOwe);
          } else {
            results[token] = -parseFloat(contactOwe);
          }
        }
      }
    } catch (err) {
      throw err;
    }

    // Get all expenses for which you owe.
    query = {
      sql: 'SELECT expense FROM expenses WHERE \
            address = ? AND contact_address = ? AND deleted = false',
      timeout: 6 * 1000, // 6s
      values: [ contactAddress, address ],
    };
    try {
      youOwe = await DB.query(query);

      if (youOwe.length > 0) {
        for (let expense of youOwe) {
          expense = expense.expense;
          expense = JSON.parse(expense);

          const token = expense.token;
          const youOwe = expense.amount.contactOwe;

          if (token in results) {
            results[token] += parseFloat(youOwe);
          } else {
            results[token] = parseFloat(youOwe);
          }
        }
      }
    } catch (err) {
      throw err;
    }

    // Remove the zero owe tokens.
    for (const token of Object.keys(results)) {
      if (results[token] === 0) {
        delete results[token];
      }
    }

    return results;
  },
}

module.exports = Expenses;
