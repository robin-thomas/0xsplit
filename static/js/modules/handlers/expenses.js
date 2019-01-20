const ContactsHandler = require('./contacts.js');
const Expenses = require('../expenses.js');
const Infura = require('../infura.js');
const Wallet = require('../metamask.js');

const config = require('../../../../config.json');

const addExpenseDialog    = $('#add-expense-dialog'),
      expenseNotesDialog  = $('#add-expense-notes-dialog'),
      expenseSplitDialog  = $('#expense-split-dialog');

const expenseAmount       = $('#expense-amount'),
      expenseContacts     = $('#expense-contacts'),
      expenseCurrencies   = $('#expense-supported-currencies'),
      expenseDescription  = $('#expense-description'),
      expenseNotes        = $('#expense-notes'),
      expensePicture      = $('#expense-picture');

const amountContactOwe    = $('#amount-contact-owe'),
      amountYouOwe        = $('#amount-you-owe');

const ExpensesHandlers = {
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
};

module.exports = ExpensesHandlers;
