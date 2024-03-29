const Wallet = require('../metamask.js');

let expenseDisplay = null;
const getExpense = (which, expenses) => {
  if (expenses === undefined || expenses === null) {
    let expense = null;

    switch (which) {
      case 'first':
        expense = expenseDisplay.find('.row-actual-expense:first .expense-json').val();
        break;
      case 'last':
        expense = expenseDisplay.find('.row-actual-expense:last .expense-json').val();
        break;
    }

    if (expense !== undefined) {
      expense = JSON.parse(decodeURIComponent(expense));
    }

    return expense;
  } else {
    switch (which) {
      case 'first':
        return expenses[0];
      case 'last':
        return expenses[expenses.length - 1];
    }
  }
};

const ExpenseUtils = {
  expenseOffset: 0,
  expenseLimit: 10,

  displayNewExpense: (expense, contactsList, testing, expenses) => {
    testing = testing === undefined ? false : true;

    expenseDisplay = testing || $('#display-expenses').find('.container-fluid');
    let el = testing || new SimpleBar(expenseDisplay[0]);

    const timestamp = new Date(expense.timestamp);

    let displayRow = false;
    let displayMonth = false;

    const lastExpense = getExpense('last', expenses);
    if (lastExpense) {
      const lastExpenseTimestamp = new Date(lastExpense.timestamp);

      // Check if we need to display the expense.
      // As it will be loaded when user scroll down.
      if (lastExpenseTimestamp > timestamp && ExpenseUtils.expenseOffset >= ExpenseUtils.expenseLimit) {
        return {
          row: displayRow,
          rowMonth: displayMonth
        };
      } else {
        // Check if this expense has to be added to the first.
        const firstExpense = getExpense('first', expenses);
        const firstExpenseTimestamp = new Date(firstExpense.timestamp);
        if (firstExpenseTimestamp < timestamp) {
          const row = testing || ExpenseUtils.constructExpenseRow(expense, contactsList);
          displayRow = true;

          if (firstExpenseTimestamp.getMonth() !== timestamp.getMonth()) {
            if (!testing) {
              expenseDisplay.find('.simplebar-content').prepend(row);

              const rowMonthStr = window.moment(timestamp).format('MMMM YYYY').toUpperCase();
              const rowMonth = '<div class="row row-month">' + rowMonthStr + '</div>';
              expenseDisplay.find('.simplebar-content').prepend(rowMonth);
            }

            displayMonth = true;
          } else if (!testing) {
            expenseDisplay.find('.row-month:first').after(row);
          }

          testing || el.recalculate();

          return {
            row: displayRow,
            rowMonth: displayMonth
          };
        }
      }
    } else {
      // Nothing in expense display.
      // Display this expense.
      if (!testing) {
        const rowMonthStr = window.moment(expense.timestamp).format('MMMM YYYY').toUpperCase();
        const rowMonth = '<div class="row row-month">' + rowMonthStr + '</div>';
        expenseDisplay.find('.simplebar-wrapper .simplebar-content').append(rowMonth);

        const row = ExpenseUtils.constructExpenseRow(expense, contactsList);
        expenseDisplay.find('.simplebar-wrapper .simplebar-content').append(row);
      }

      return {
        row: true,
        rowMonth: true,
      };
    }

    // Figure out if we need to insert the expense into the UI.
    // The expense display is sorted in descending order of timestamp.
    if (!testing) {
      expenses = [];
      expenseDisplay.find('.row-actual-expense').each(function() {
        expenses.push($(this));
      });
    }

    for (let index = 0; index < expenses.length; ++index) {
      let condition = false;
      const currExpense = expenses[index];

      let prevTimestamp = null;
      if (!testing) {
        let json = currExpense.find('.expense-json').val();
        json = JSON.parse(decodeURIComponent(json));
        prevTimestamp = new Date(json.timestamp);
      } else {
        prevTimestamp = new Date(currExpense.timestamp);
      }

      if ((index + 1) >= expenses.length) { /* this is last displayed expense */
        condition = true;

        if (prevTimestamp.getMonth() !== timestamp.getMonth()) {
          if (!testing) {
            const rowMonthStr = window.moment(timestamp).format('MMMM YYYY').toUpperCase();
            const rowMonth = '<div class="row row-month">' + rowMonthStr + '</div>';
            currExpense.after(rowMonth);
          }

          displayMonth = true;
        }
      } else {
        // this is the correct position if it lies within expenses.
        let nextTimestamp = null;
        if (!testing) {
          let jsonNext = expenses[index + 1].find('.expense-json').val();
          jsonNext = JSON.parse(decodeURIComponent(jsonNext));
          nextTimestamp = new Date(jsonNext.timestamp);
        } else {
          nextTimestamp = new Date(expenses[index + 1].timestamp);
        }

        // timestamp sorted with latest coming first.
        if (prevTimestamp >= timestamp && timestamp >= nextTimestamp) {
          condition = true;

          if (prevTimestamp.getMonth() !== timestamp.getMonth() &&
              nextTimestamp.getMonth() !== timestamp.getMonth()) {
            if (!testing) {
              const rowMonthStr = window.moment(timestamp).format('MMMM YYYY').toUpperCase();
              const rowMonth = '<div class="row row-month">' + rowMonthStr + '</div>';
              currExpense.after(rowMonth);
            }

            displayMonth = true;
          }
        }
      }

      if (condition) {
        if (!testing) {
          const expenseRow = ExpenseUtils.constructExpenseRow(expense, contactsList);
          if (displayMonth) {
            currExpense.parent().find('.row-month:last').after(expenseRow);
          } else {
            currExpense.after(expenseRow);
          }

          el.recalculate();
        }

        return {
          row: true,
          rowMonth: displayMonth
        };
      }
    }
  },
  constructExpenseRow: (expense, contactsList) => {
    let paid = '';
    if (expense.address === Wallet.address) {
      paid = 'You paid ' + expense.token + ' ' + expense.amount.total;
    } else {
      // Get the contactname from your contactslist.
      const name = contactsList.filter(e => e.address === expense.address).map(e => e.nickname);
      if (name === null || name === undefined || name.length === 0) {
        paid = '[Unknown] paid ' + expense.token + ' ' + expense.amount.total;
      } else {
        paid = name[0] + ' paid ' + expense.token + ' ' + expense.amount.total;
      }
    }

    let owe = '';
    let owedAmount = '';
    if (expense.address === Wallet.address) {
      owe = '<div class="row" style="color:#28a745;">You lent</div>';
      owedAmount = '<div class="row" style="color:#28a745;">' + expense.token + ' ' + expense.amount.contactOwe + '</div>';
    } else {
      owe = '<div class="row" style="color:#dc3545;">You owe</div>';
      owedAmount = '<div class="row" style="color:#dc3545;">' + expense.token + ' ' + expense.amount.contactOwe + '</div>';
    }

    const escapedJsonStr = encodeURIComponent(JSON.stringify(expense));
    const deletedClass = expense.deleted !== undefined && expense.deleted === 1
                          ? ' row-expense-deleted' : '';

    const row = '<div class="row row-actual-expense' + deletedClass + '">\
                  <div class="col-md-2">\
                    <i class="fas fa-receipt"></i>\
                    <input type="hidden" class="expense-json" value=\'' + escapedJsonStr + '\' />\
                  </div>\
                  <div class="col-md-8">\
                    <div class="row row-desc">'
                      + expense.description +
                    '</div>\
                    <div class="row row-paid">'
                      + paid +
                    '</div>\
                  </div>\
                  <div class="col-md-2">'
                    + owe
                    + owedAmount +
                  '</div>\
                </div>';

    return row;
  },
}

module.exports = ExpenseUtils;
