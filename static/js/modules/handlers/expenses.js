const ContactsHandler = require('./contacts.js');
const Expenses = require('../expenses.js');
const Infura = require('../infura.js');
const Wallet = require('../metamask.js');

const config = require('../../../../config.json');

const addExpenseDialog    = $('#add-expense-dialog'),
      expenseNotesDialog  = $('#add-expense-notes-dialog'),
      expenseSplitDialog  = $('#expense-split-dialog'),
      expenseEditDialog   = $('#edit-expense-dialog');

const expenseAmount       = $('#expense-amount'),
      expenseContacts     = $('#expense-contacts'),
      expenseCurrencies   = $('#expense-supported-currencies'),
      expenseDescription  = $('#expense-description'),
      expenseNotes        = $('#expense-notes'),
      expensePicture      = $('#expense-picture'),
      expenseDisplay      = $('#display-expenses').find('.container-fluid');

const amountContactOwe    = $('#amount-contact-owe'),
      amountYouOwe        = $('#amount-you-owe');

const displayCurrentExpense = (expense, dialogEle) => {
  if (typeof expense.img !== 'undefined') {
    dialogEle.find('#expense-pic').html('<i class="fas fa-circle-notch fa-spin"></i>');

    const img = new Image();
    img.onload = () => {
      const imgHtml = '<img src="' + expense.img + '" style="width:100%;"/>\
                      <input type="file" id="expense-picture" hidden />\
                      <div id="expense-pic-change">\
                        <div class="input-group-text">\
                          <label style="margin-bottom:0 !important;">\
                            <i class="fas fa-camera" title="Add a picture"></i>\
                          </label>\
                        </div>\
                      </div>';
      dialogEle.find('#expense-pic').html(imgHtml);
    };
    img.src = expense.img;
  } else {
    // reset.
    const imgHtml = '<input type="file" id="expense-picture" hidden />\
                    <div id="expense-no-pic-change">\
                      <div class="input-group-text">\
                        <label style="margin-bottom:0 !important;">\
                          <i class="fas fa-camera" title="Add a picture"></i>\
                        </label>\
                      </div>\
                    </div>';
    dialogEle.find('#expense-pic').html(imgHtml);
  }

  console.log(expense);

  const names = ContactsHandler.contactsList.filter(e => e.hasOwnProperty('nickname')).map(e => e.nickname);
  try {
    dialogEle.find('#expense-contacts').autocomplete({
      source: names
    });
  } catch (err) {}
  dialogEle.find('#expense-contacts').val(expense.contactName);

  dialogEle.find('#datetimepicker2').datetimepicker({
    icons: {
      time: 'far fa-clock',
      date: 'far fa-calendar',
      today: 'far fa-calendar-check-o',
      clear: 'far fa-trash',
      close: 'far fa-times'
    },
    format: 'YYYY-MM-DD hh:mm:ss',
    defaultDate: expense.timestamp,
  });

  dialogEle.find('#expense-description').val(expense.description);

  let options = '';
  for (let i in ExpensesHandler.tokensList) {
    const token = ExpensesHandler.tokensList[i].token;
    options += '<option value="' + token + '">' + token + '</option>';
  }
  dialogEle.find('#expense-supported-currencies').html(options);
  dialogEle.find('#expense-supported-currencies').val(expense.token);

  dialogEle.find('#expense-amount').val(expense.amount.total);
  dialogEle.find('#expense-notes').val(expense.notes);

  dialogEle.modal('show');
};

const ExpensesHandler = {
  tokensList: [],
  expenseOffset: 0,
  expenseLimit: 5,
  expenseSplitEquallyHandler: () => {
    // Reset the form.
    expenseSplitDialog.find('.split-third-col').hide();
    expenseSplitDialog.find('.split-equally-third-col').show();
    expenseSplitDialog.find('select').find('option').get(0).remove();
    expenseSplitDialog.find('select').val('1');

    const currency = addExpenseDialog.find('#expense-supported-currencies').val();
    let amount = addExpenseDialog.find('#expense-amount').val();
    amount = amount == '' ? '0.00' : amount;

    expenseSplitDialog.find('.symbol').html(currency);
    expenseSplitDialog.find('#amount-full').html(amount);

    const doesYouOwe = $('#you-owe-checkbox').find('input[type=checkbox]').is(':checked');
    const doesContactOwe = $('#contact-owe-checkbox').find('input[type=checkbox]').is(':checked');

    let amountYou = 0.00;
    if (doesYouOwe) {
      if (amount == '0.00') {
        amountYou = 0.00;
      } else if (doesContactOwe) {
        amountYou = parseFloat(amount) / 2.0;
      } else {
        amountYou = parseFloat(amount);
      }
    }

    let amountContact = 0.00;
    if (doesContactOwe) {
      if (amount == '0.00') {
        amountContact = 0.00;
      } else if (doesYouOwe) {
        amountContact = parseFloat(amount) / 2.0;
      } else {
        amountContact = parseFloat(amount);
      }
    }
    const amountNow = (amountContact + amountYou);

    amountContactOwe.html(amountContact);
    amountYouOwe.html(amountYou);
    expenseSplitDialog.find('#amount-now').html(amountNow);
  },
  expenseSplitUnequallyHandler: () => {
    // Reset the form.
    expenseSplitDialog.find('input[type="text"]').val('');
    expenseSplitDialog.find('.split-third-col').hide();
    expenseSplitDialog.find('.split-unequally-third-col').show();
    expenseSplitDialog.find('select').val('2');
    amountContactOwe.html('0.00');
    amountYouOwe.html('0.00');
    expenseSplitDialog.find('#amount-now').html('0.00');
  },
  expenseSplitUnequallyChangeHandler: () => {
    const doesYouOwe = $('#you-owe-textbox').val() != '';
    const doesContactOwe = $('#contact-owe-textbox').val() != '';

    let amountYou = 0.00;
    if (doesYouOwe) {
      amountYou = parseFloat($('#you-owe-textbox').val());
    }
    let amountContact = 0.00;
    if (doesContactOwe) {
      amountContact = parseFloat($('#contact-owe-textbox').val());
    }
    const amountNow = (amountYou == '0.00' && amountContact == '0.00' ? '0.00' : (amountContact + amountYou));

    amountContactOwe.html(amountContact);
    amountYouOwe.html(amountYou);
    expenseSplitDialog.find('#amount-now').html(amountNow);
  },
  expenseSplitPercentageHandler: () => {
    // Reset the form.
    expenseSplitDialog.find('input[type="text"]').val('');
    expenseSplitDialog.find('.split-third-col').hide();
    expenseSplitDialog.find('.split-percentage-third-col').show();
    expenseSplitDialog.find('select').val('3');
    amountContactOwe.html('0');
    amountYouOwe.html('0');
    expenseSplitDialog.find('#amount-now').html('0');
  },
  expenseSplitPercentageChangeHandler: () => {
    let amount = addExpenseDialog.find('#expense-amount').val();
    amount = amount == '' ? 0.00 : parseFloat(amount);

    const doesYouOwe = $('#you-owe-percentage-textbox').val() != '';
    const doesContactOwe = $('#contact-owe-percentage-textbox').val() != '';

    let amountYou = 0.00;
    if (doesYouOwe) {
      amountYou = (parseFloat(amount) * $('#you-owe-percentage-textbox').val()) / 100.0;
    }
    let amountContact = 0.00;
    if (doesContactOwe) {
      amountContact = (parseFloat(amount) * $('#contact-owe-percentage-textbox').val()) / 100.0;
    }
    const amountNow = (amountContact + amountYou);

    amountContactOwe.html(amountContact);
    amountYouOwe.html(amountYou);
    expenseSplitDialog.find('#amount-now').html(amountNow);
  },
  expenseSplitConfirmHandler: () => {
    const amountGot = parseFloat(expenseSplitDialog.find('#amount-now').html()).toFixed(2);
    const amountExpected = parseFloat(expenseSplitDialog.find('#amount-full').html()).toFixed(2);

    if (amountGot !== amountExpected) {
      alert('Expected amount = ' + amountGot + ' do not match ' + amountExpected);
      return;
    }

    expenseSplitDialog.modal('hide');
  },
  addNewExpenseHandler: () => {
    expenseContacts.val('');
    addExpenseDialog.modal('show');
  },
  confirmNewExpenseHandler: async (btn) => {
    if (expenseContacts.val().trim().length === 0) {
      expenseContacts.css('border-color', 'red').focus();
      return;
    }
    const contactsCheck = ContactsHandler.contactsList.filter(e => e.hasOwnProperty('nickname')).map(e => e.nickname);
    if (!contactsCheck.includes(expenseContacts.val())) {
      expenseContacts.val('').css('border-color', 'red').focus();
      return;
    }
    const contactAddress = ContactsHandler.contactsList.filter(e => e.nickname === expenseContacts.val()).map(e => e.address)[0];
    const contactName = expenseContacts.val();

    if (expenseDescription.val().trim().length === 0) {
      expenseDescription.focus();
      return;
    }

    if (expenseAmount.val().trim().length === 0) {
      expenseAmount.focus();
      return;
    }
    if (isNaN(expenseAmount.val()) || !/^([1-9]\d*|0)?(\.\d+)?$/.test(expenseAmount.val())) {
      expenseAmount.val('').focus();
      return;
    }
    if (/^0*$/.test(expenseAmount.val())) {
      expenseAmount.val('').focus();
      return;
    }

    if ($('#datetimepicker1').find('input[type="text"]').val().trim().length === 0) {
      $('#datetimepicker1').find('i').click();
      return;
    }

    if (expenseSplitDialog.find('#amount-full').html() == '0.00') {
      expenseSplitDialog.modal('show');
      return;
    }
    if (expenseSplitDialog.find('select').val() == '0') {
      expenseSplitDialog.modal('show');
      return;
    }

    if (typeof expensePicture.prop('files')[0] !== 'undefined') {
      const fileSize = expensePicture.prop('files')[0].size;
      if (fileSize > (2 * 1024 * 1024)) {
        alert('File size greater than 2 MB!');
        return;
      }
    }

    if (confirm('Are you sure you want to add this expense?')) {
      // Create the JSON object of the expense.
      let expense = {
        address: Wallet.address,
        contactAddress: contactAddress,
        contactName: contactName,
        description: expenseDescription.val(),
        token: expenseCurrencies.val(),
        amount: {
          total: expenseSplitDialog.find('#amount-full').html(),
          contactOwe: amountContactOwe.html(),
          youOwe: amountYouOwe.html(),
        },
        timestamp: $('#datetimepicker1').find('input[type="text"]').val(),
        notes: expenseNotes.val(),
      };

      // Change the button to loading.
      const loadingText = '<i class="fas fa-spinner fa-spin"></i>&nbsp;Adding...';
      btn.data('original-text', btn.html());
      btn.html(loadingText);

      if (typeof expensePicture.prop('files')[0] !== 'undefined') {
        try {
          const hash = await Infura.uploadFileToIPFS(expensePicture.prop('files')[0]);
          expense.img = config.infura.ipfs.gateway + hash;
        } catch (err) {
          console.log(err);
          btn.html(btn.data('original-text'));
          alert('Unable to upload the file!');
          return;
        }
      }
      console.log(expense);

      try {
        await Expenses.addNewExpense({
          address: expense.address,
          contactAddress: expense.contactAddress,
          expense: JSON.stringify(expense),
        });

        ExpensesHandler.displayExpenses([{expense: JSON.stringify(expense)}]);

        btn.html(btn.data('original-text'));
        addExpenseDialog.modal('hide');
      } catch (err) {
        console.log(err.message);
        btn.html(btn.data('original-text'));
        alert('Some error has occured!');
      }
    }
  },
  addNotesDisplayHandler: () => {
    expenseNotesDialog.modal('show');
  },
  cancelAddNotesHandler: () => {
    expenseNotes.val('');
  },
  confirmAddNotesHandler: () => {
    expenseNotesDialog.modal('hide')
  },
  displayExpenses: (expenses) => {
    let el = new SimpleBar(expenseDisplay[0]);

    for (const currentExpense of expenses) {
      const expense = JSON.parse(currentExpense.expense);

      let lastExpense = expenseDisplay.find('.row-actual-expense:last .expense-json').val();
      if (typeof lastExpense !== 'undefined') {
        lastExpense = decodeURIComponent(lastExpense);
      } else {
        lastExpense = null;
      }

      if (lastExpense) {
        const lastExpenseTimestamp = new Date(JSON.parse(lastExpense).timestamp);

        const currentExpenseTimestamp = new Date(expense.timestamp);
        if (lastExpenseTimestamp.getMonth() !== currentExpenseTimestamp.getMonth()) {
          const rowMonthStr = window.moment(lastExpenseTimestamp).format('MMMM YYYY').toUpperCase();
          const rowMonth = '<div class="row row-month">' + rowMonthStr + '</div>';

          expenseDisplay.find('.simplebar-wrapper .simplebar-content').append(rowMonth);
        }
      } else {
        const rowMonthStr = window.moment(expense.timestamp).format('MMMM YYYY').toUpperCase();
        const rowMonth = '<div class="row row-month">' + rowMonthStr + '</div>';

        expenseDisplay.find('.simplebar-wrapper .simplebar-content').append(rowMonth);
      }

      let paid = '';
      if (expense.address === Wallet.address) {
        paid = 'You paid ' + expense.token + ' ' + expense.amount.total;
      } else {
        paid = expense.contactName + ' paid ' + expense.token + ' ' + expense.amount.total;
      }

      let owe = '';
      let owedAmount = '';
      if (expense.address === Wallet.address) {
        owe = '<div class="row" style="color:#28a745;">You lent</div>';
        owedAmount = '<div class="row" style="color:#28a745;">' + expense.token + ' ' + expense.amount.contactOwe + '</div>';
      } else {
        owe = '<div class="row" style="color:#dc3545;">You borrowed</div>';
        owedAmount = '<div class="row" style="color:#dc3545;">' + expense.token + ' ' + expense.amount.youOwe + '</div>';
      }

      const escapedJsonStr = encodeURIComponent(currentExpense.expense);

      const row = '<div class="row row-actual-expense">\
                    <div class="col-md-1">\
                      <i class="fas fa-receipt"></i>\
                      <input type="hidden" class="expense-json" value=\'' + escapedJsonStr + '\' />\
                    </div>\
                    <div class="col-md-9">\
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

      expenseDisplay.find('.simplebar-wrapper .simplebar-content').append(row);

      el.recalculate();
    }
    ExpensesHandler.expenseOffset += expenses.length;
  },
  loadNextBatch: async () => {
    try {
      const expenses = await Expenses.searchExpenses(Wallet.address, ExpensesHandler.expenseOffset, ExpensesHandler.expenseLimit);
      ExpensesHandler.displayExpenses(expenses);
    } catch (err) {
      throw err;
    }
  },
  editExpenseDisplayHandler: (ele) => {
    let expense = $(ele).find('.expense-json').val();
    expense = decodeURIComponent(expense);
    expense = JSON.parse(expense);

    displayCurrentExpense(expense, expenseEditDialog);
  },
};

module.exports = ExpensesHandler;
