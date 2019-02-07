const assert = require('assert');
const moment = require('moment');

const ExpensesUtils = require('../../static/js/modules/utils/expenses.js');
const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';

const constructDummyExpenseObject = (timestamp) => {
  return {
    address: NULL_ADDRESS,
    contactAddress: NULL_ADDRESS,
    contactName: Math.random().toString(36),
    description: Math.random().toString(36),
    token: Math.random().toString(36),
    split: {
      option: '1',
      contact: true,
      you: true,
    },
    amount: {
      total: '100',
      contactOwe: '50',
      youOwe: '50',
    },
    timestamp: timestamp,
    notes: Math.random().toString(36),
  };
}

const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
const expense = constructDummyExpenseObject(timestamp);

describe('ExpensesUtils', () => {
  describe('displayNewExpense()', () => {
    it('new expense when no expense displayed', () => {
      const {row, rowMonth} = ExpensesUtils.displayNewExpense(expense, [], true, []);

      assert.equal(row, true);
      assert.equal(rowMonth, true);
    });

    it('new expense later than first expense (same month)', () => {
      const firstExpense = constructDummyExpenseObject(moment().subtract(1, 'days').format('YYYY-MM-DD HH:mm:ss'));
      const {row, rowMonth} = ExpensesUtils.displayNewExpense(expense, [], true, [firstExpense]);

      assert.equal(row, true);
      assert.equal(rowMonth, false);
    });

    it('new expense later than first expense (different month)', () => {
      const firstExpense = constructDummyExpenseObject('2019-01-01 00:00:00');
      const {row, rowMonth} = ExpensesUtils.displayNewExpense(expense, [], true, [firstExpense]);

      assert.equal(row, true);
      assert.equal(rowMonth, true);
    });

    it('new expense earlier than last expense (same month)', () => {
      const lastExpense = constructDummyExpenseObject(moment().add(1, 'days').format('YYYY-MM-DD HH:mm:ss'));
      const {row, rowMonth} = ExpensesUtils.displayNewExpense(expense, [], true, [lastExpense]);

      assert.equal(row, false);
      assert.equal(rowMonth, false);
    });

    it('new expense earlier than last expense (different month)', () => {
      const lastExpense = constructDummyExpenseObject(moment().add(1, 'M').format('YYYY-MM-DD HH:mm:ss'));
      const {row, rowMonth} = ExpensesUtils.displayNewExpense(expense, [], true, [lastExpense]);

      assert.equal(row, false);
      assert.equal(rowMonth, false);
    });

    it('new expense between displayed expenses (month already displayed)', () => {
      const firstExpense = constructDummyExpenseObject(moment().add(1, 'days').format('YYYY-MM-DD HH:mm:ss'));
      const lastExpense = constructDummyExpenseObject(moment().subtract(1, 'days').format('YYYY-MM-DD HH:mm:ss'));
      const {row, rowMonth} = ExpensesUtils.displayNewExpense(expense, [], true, [firstExpense, lastExpense]);

      assert.equal(row, true);
      assert.equal(rowMonth, false);
    });

    it('new expense between displayed expenses (month not displayed)', () => {
      const firstExpense = constructDummyExpenseObject(moment().add(2, 'M').format('YYYY-MM-DD HH:mm:ss'));
      const lastExpense = constructDummyExpenseObject(moment().subtract(2, 'M').format('YYYY-MM-DD HH:mm:ss'));
      const {row, rowMonth} = ExpensesUtils.displayNewExpense(expense, [], true, [firstExpense, lastExpense]);

      assert.equal(row, true);
      assert.equal(rowMonth, true);
    });
  });
});
