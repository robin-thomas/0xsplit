const moment = require('moment');

const Contacts = require('../contacts.js');
const ContactsHandler = require('./contacts.js');
const Expenses = require('../expenses.js');
const ExpensesUtils = require('../utils/expenses.js');
const Infura = require('../infura.js');
const Wallet = require('../metamask.js');

const config = require('../../../../config.json');

const expenseAddDialog    = $('#add-expense-dialog'),
      expenseSplitDialog  = $('#expense-split-dialog'),
      expenseEditDialog   = $('#edit-expense-dialog'),
      expenseSettleDialog = $('#settle-expenses-dialog');

const expenseContacts     = $('#expense-contacts'),
      expenseCurrencies   = $('#expense-supported-currencies'),
      expenseDisplay      = $('#display-expenses').find('.container-fluid');

const amountContactOwe    = $('#amount-contact-owe'),
      amountYouOwe        = $('#amount-you-owe');

const resetExpensePic = (dialogEle) => {
  const imgHtml = '<div id="expense-no-pic-change">\
                    <div class="input-group-text">\
                      <label style="margin-bottom:0 !important;">\
                        <i class="fas fa-camera" title="Add a picture"></i>\
                      </label>\
                    </div>\
                  </div>';
  dialogEle.find('#expense-pic').html(imgHtml);
}

const displayCurrentExpense = async (expense, dialogEle, expenseJsonStr) => {
  // Check if this contact exists in your contacts list.
  const addresses = ContactsHandler.contactsList.filter(e => e.hasOwnProperty('address')).map(e => e.address);
  if (expense.address !== Wallet.address &&
      !addresses.includes(expense.address)) {
    alert('This contact doesnt exist in your contacts list!');

    // Add this contact to the contacts list after validation.
    while (true) {
      try {
        const contactName = prompt('Enter desired contact name to add to your contacts list', '');
        if (contactName === null || contactName.trim().length === 0) {
          throw new Error('Nickname cannot be empty!');
        }
        const nameValid = /^[a-zA-Z ]+$/.test(contactName);
        if (!nameValid) {
          throw new Error('Nickname not in valid format[a-zA-Z]!');
        }

        const out = await Contacts.searchContacts({
          address: Wallet.address,
          contactAddress: expense.address,
          contactName: contactName,
        });

        if (out === null || out === undefined || out.length === 0) {
          // Add this contact to contactsList.
          await ContactsHandler.addNewContactHandler(null, {
            nickname: contactName,
            address: expense.address,
          });
          break;
        } else {
          throw new Error('This contact name had been used before!');
        }
      } catch (err) {
        alert(err.message);
      }
    }
  }

  if (expense.img !== undefined) {
    const expensePicDiv = dialogEle.find('#expense-pic');
    expensePicDiv.html('<i class="fas fa-circle-notch fa-spin"></i>');

    const img = new Image();
    img.onload = () => {
      const imgHtml = '<img src="' + expense.img + '" style="width:100%;"/>\
                      <div id="expense-pic-change">\
                        <div class="input-group-text">\
                          <label style="margin-bottom:0 !important;">\
                            <i class="fas fa-camera" title="Add a picture"></i>\
                          </label>\
                        </div>\
                      </div>';
      expensePicDiv.html(imgHtml);

      // some weird jquery bug which returns `expensePicDiv` as
      // a 0 x 0 element unless we wait for some time.
      window.setTimeout(function() {
        const picHover = expensePicDiv.find('#expense-pic-change');
        picHover.width(expensePicDiv.width() + 'px');
        picHover.height(expensePicDiv.height() + 'px');
      }, 500 /* 0.5s */);
    };
    img.src = expense.img;
  } else {
    // reset.
    resetExpensePic(dialogEle);
  }

  const names = ContactsHandler.contactsList.filter(e => e.hasOwnProperty('nickname')).map(e => e.nickname);
  try {
    dialogEle.find('#expense-contacts').autocomplete({
      source: names
    });
  } catch (err) {}

  if (expense.address === Wallet.address) {
    dialogEle.find('#expense-contacts').val(expense.contactName);
  } else {
    const name = ContactsHandler.contactsList.filter(e => e.address === expense.address).map(e => e.nickname);
    dialogEle.find('#expense-contacts').val(name);

    // Replace [Unknown] with `contactName`.
    const str = ExpensesHandler.currentExpenseRow.find('.row-paid').html();
    ExpensesHandler.currentExpenseRow.find('.row-paid').html(str.replace('[Unknown]', name));
  }

  dialogEle.find('#datetimepicker2').find('input').val('');
  dialogEle.find('#datetimepicker2').datetimepicker('destroy');
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

  // Hide the delete button if expense is already deleted.
  if (expense.deleted === 1 ||
      expense.address !== Wallet.address ||
      expense.is_settlement === 1) {
    if (expense.deleted === 1) {
      dialogEle.find('#delete-expense').fadeOut();
      dialogEle.find('.expense-has-deleted-caption').html('This expense has been deleted').show();
    } else {
      dialogEle.find('#delete-expense').fadeIn();
      dialogEle.find('.expense-has-deleted-caption').html('This expense cannot be edited').show();
    }
    dialogEle.find('#confirm-update-expense').fadeOut();

    dialogEle.find('input, select, textarea').prop('disabled', true);
    expenseSplitDialog.find('#confirm-expense-split').fadeOut();
  } else {
    dialogEle.find('#delete-expense').fadeIn();
    dialogEle.find('#confirm-update-expense').fadeIn();

    dialogEle.find('.expense-has-deleted-caption').hide();

    dialogEle.find('input, select, textarea').prop('disabled', false);
    expenseSplitDialog.find('#confirm-expense-split').fadeIn();

    // Disable changing contact name.
    dialogEle.find('#expense-contacts').prop('disabled', true);
  }

  dialogEle.find('.expense-json').val(expenseJsonStr);
  dialogEle.modal('show');
};

const constructExpenseObject = (dialogEle, type) => {
  let contactSplit = '';
  let youSplit = '';
  let splitOption = expenseSplitDialog.find('select').val();

  type = type === null || type === undefined ? 'add' : 'edit';

  switch (splitOption) {
    case '1':
      contactSplit = expenseSplitDialog.find('#contact-owe-checkbox input[type="checkbox"]').is(':checked');
      youSplit = expenseSplitDialog.find('#you-owe-checkbox input[type="checkbox"]').is(':checked');
      break;
    case '2':
      contactSplit = expenseSplitDialog.find('#contact-owe-textbox').val();
      youSplit = expenseSplitDialog.find('#you-owe-textbox').val();
      break;
    case '3':
      contactSplit = expenseSplitDialog.find('#contact-owe-percentage-textbox').val();
      youSplit = expenseSplitDialog.find('#you-owe-percentage-textbox').val();
      break;
  }

  // Construct the expense object.
  const contactName = dialogEle.find('#expense-contacts').val();
  const contactAddress = ContactsHandler.contactsList.filter(e => e.nickname === contactName).map(e => e.address)[0];

  // expense.
  return {
    address: Wallet.address,
    contactAddress: contactAddress,
    contactName: contactName,
    description: dialogEle.find('#expense-description').val(),
    token: dialogEle.find('#expense-supported-currencies').val(),
    amount: {
      total: dialogEle.find('#expense-amount').val(),
      contactOwe: expenseSplitDialog.find('#amount-contact-owe').html(),
      youOwe: expenseSplitDialog.find('#amount-you-owe').html(),
    },
    timestamp: dialogEle.find(type === 'add' ? '#datetimepicker1' : '#datetimepicker2').find('input[type="text"]').val(),
    notes: dialogEle.find('#expense-notes').val(),
    split: {
      option: splitOption,
      contact: contactSplit,
      you: youSplit,
    },
  };
};

const validateExpenseObject = (expense, dialogEle) => {
  if (typeof expense.contactName === 'undefined' ||
      expense.contactName.trim().length === 0) {
    dialogEle.find('#expense-contacts').css('border-bottom-color', 'red').focus();
    return false;
  }
  const contactsCheck = ContactsHandler.contactsList.filter(e => e.hasOwnProperty('nickname')).map(e => e.nickname);
  if (!contactsCheck.includes(expense.contactName)) {
    dialogEle.find('#expense-contacts').val('').css('border-bottom-color', 'red').focus();
    return false;
  }

  if (expense.description.trim().length === 0) {
    dialogEle.find('#expense-description').focus();
    return false;
  }

  if (typeof expense.amount.total === 'undefined' ||
      expense.amount.total.trim().length === 0) {
    dialogEle.find('#expense-amount').focus();
    return false;
  }
  if (isNaN(expense.amount.total) || !/^([1-9]\d*|0)?(\.\d+)?$/.test(expense.amount.total)) {
    dialogEle.find('#expense-amount').val('').focus();
    return;
  }
  if (/^0*$/.test(expense.amount.total)) {
    dialogEle.find('#expense-amount').val('').focus();
    return false;
  }

  if (expense.timestamp.trim().length === 0) {
    dialogEle.find('#datetimepicker1').find('i').click();
    return false;
  }

  if (expense.amount.contactOwe.trim().length === 0 &&
      expense.amount.youOwe.trim().length === 0) {
    ExpensesHandler.expenseSplitEquallyHandler(dialogEle, expense);
    expenseSplitDialog.modal('show');
    return false;
  }

  if (dialogEle.find('#expense-amount').val() != expense.amount.total) {
    switch (expense.split.option) {
      case '1':
        ExpensesHandler.expenseSplitEquallyHandler(dialogEle, expense);
        break;
      case '2':
        ExpensesHandler.expenseSplitUnequallyHandler(dialogEle, expense);
        break;
      case '3':
        ExpensesHandler.expenseSplitPercentageHandler(dialogEle, expense);
        break;
    }
    expenseSplitDialog.modal('show');
    return false;
  }

  const pic = dialogEle.find('#expense-picture').prop('files')[0];
  if (typeof pic !== 'undefined') {
    if (pic.size > (2 * 1024 * 1024)) {
      alert('File size greater than 2 MB!');
      return false;
    }
  }

  return true;
};

const constructExpenseForSettle = (contact, token, amount, etherscanLink) => {
  return {
    address: Wallet.address,
    contactAddress: contact.address,
    contactName: contact.name,
    description: 'Settle all bills for ' + token,
    token: token,
    amount: {
      total: amount.toString(),
      contactOwe: amount.toString(),
      youOwe: '0',
    },
    timestamp: moment().format('YYYY-MM-DD hh:mm:ss'),
    notes: etherscanLink,
    split: {
      option: '1',
      contact: true,
      you: false,
    },
  };
};

const expenseSettle = async (contact, token, amount, etherscanLink) => {
  const expense = constructExpenseForSettle(
    contact,
    token,
    amount,
    etherscanLink
  );
  expense.is_settlement = 1;

  try {
    await Expenses.addNewExpense(Wallet.address, contact.address, JSON.stringify(expense));
  } catch (err) {
  }

  // Add the expense row to UI.
  ExpensesUtils.displayNewExpense(expense, ContactsHandler.contactsList);
}

const ExpensesHandler = {
  tokensList: [],
  expenseSearching: false,
  currentExpenseRow: null,
  expenseSplitEquallyHandler: (dialogEle, expense) => {
    expense = expense || null;

    // Reset the form.
    expenseSplitDialog.find('.split-third-col').hide();
    expenseSplitDialog.find('.split-equally-third-col').show();
    expenseSplitDialog.find('select').val('1');

    const currency = dialogEle.find('#expense-supported-currencies').val();
    let amount = dialogEle.find('#expense-amount').val();
    amount = amount == '' ? '0.00' : amount;

    expenseSplitDialog.find('.symbol').html(currency);
    expenseSplitDialog.find('#amount-full').html(amount);

    const contactOweCheckbox = expenseSplitDialog.find('#contact-owe-checkbox input[type="checkbox"]');
    const youOweCheckbox = expenseSplitDialog.find('#you-owe-checkbox input[type="checkbox"]');

    // Loading saved expense.
    // The one who adds the expense is the one who paid the bill.
    if (expense && expense.address === Wallet.address) {
      contactOweCheckbox.prop('checked', true);

      if (expense.split.option === '1' && expense.split.you !== '') {
        youOweCheckbox.prop('checked', expense.split.you);
      }
    } else if (expense) {
      youOweCheckbox.prop('checked', true);

      if (expense.split.option === '1' && expense.split.you !== '') {
        contactOweCheckbox.prop('checked', false);
        // contactOweCheckbox.prop('checked', expense.split.you);
      }
    }

    const doesYouOwe = youOweCheckbox.is(':checked');
    const doesContactOwe = contactOweCheckbox.is(':checked');

    let amountYou = 0.00;
    if (expense && expense.split.option === '1' &&
        expense.amount.youOwe !== '' && expense.amount.total == amount) {
      amountYou = parseFloat(expense.amount.youOwe);
    } else if (doesYouOwe) {
      if (amount == '0.00') {
        amountYou = 0.00;
      } else if (doesContactOwe) {
        amountYou = parseFloat(amount) / 2.0;
      } else {
        amountYou = parseFloat(amount);
      }
    }

    let amountContact = 0.00;
    if (expense && expense.split.option === '1' &&
        expense.amount.contactOwe !== '' && expense.amount.total == amount) {
      amountContact = parseFloat(expense.amount.contactOwe);
    } else if (doesContactOwe) {
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

    // Deleted expense.
    if (expense && expense.deleted) {
      expenseSplitDialog.find('input').prop('disabled', true);
      expenseSplitDialog.find('select').attr('disabled', true);
      expenseSplitDialog.find('textarea').attr('disabled', true);
      expenseSplitDialog.find('#confirm-expense-split').hide();
    } else {
      expenseSplitDialog.find('input').prop('disabled', false);
      expenseSplitDialog.find('select').attr('disabled', false);
      expenseSplitDialog.find('textarea').attr('disabled', false);
      expenseSplitDialog.find('#confirm-expense-split').show();
    }
  },
  expenseSplitUnequallyHandler: (dialog, expense) => {
    expense = expense || null;

    // Reset the form.
    expenseSplitDialog.find('input[type="text"]').val('');
    expenseSplitDialog.find('.split-third-col').hide();
    expenseSplitDialog.find('.split-unequally-third-col').show();
    expenseSplitDialog.find('select').val('2');

    if (expense && expense.split.option === '2') {
      let amount = dialog.find('#expense-amount').val();
      amount = amount == '' ? '0.00' : amount;

      expenseSplitDialog.find('#contact-owe-textbox').val(expense.split.contact);
      expenseSplitDialog.find('#you-owe-textbox').val(expense.split.you);

      amountContactOwe.html(expense.amount.contactOwe);
      amountYouOwe.html(expense.amount.youOwe);
      expenseSplitDialog.find('#amount-now').html(expense.amount.total);

      if (expense.amount.total != amount) {
        expenseSplitDialog.find('#amount-full').html(amount);
      }
    } else {
      amountContactOwe.html('0.00');
      amountYouOwe.html('0.00');
      expenseSplitDialog.find('#amount-now').html('0.00');
    }

    // Deleted expense.
    if (expense && expense.deleted) {
      expenseSplitDialog.find('input').prop('readonly', true);
      expenseSplitDialog.find('select').attr('disabled', true);
      expenseSplitDialog.find('textarea').attr('disabled', true);
      expenseSplitDialog.find('#confirm-expense-split').hide();
    } else {
      expenseSplitDialog.find('input').prop('readonly', false);
      expenseSplitDialog.find('select').attr('disabled', false);
      expenseSplitDialog.find('textarea').attr('disabled', false);
      expenseSplitDialog.find('#confirm-expense-split').show();
    }
  },
  expenseSplitUnequallyChangeHandler: () => {
    const contactOweTextbox = expenseSplitDialog.find('#contact-owe-textbox');
    const youOweTextBox = expenseSplitDialog.find('#you-owe-textbox');

    const doesYouOwe = youOweTextBox.val() != '';
    const doesContactOwe = contactOweTextbox.val() != '';

    let amountYou = 0.00;
    if (doesYouOwe) {
      amountYou = parseFloat(youOweTextBox.val());
    }
    let amountContact = 0.00;
    if (doesContactOwe) {
      amountContact = parseFloat(contactOweTextbox.val());
    }
    const amountNow = (amountYou == '0.00' && amountContact == '0.00' ? '0.00' : (amountContact + amountYou));

    amountContactOwe.html(amountContact);
    amountYouOwe.html(amountYou);
    expenseSplitDialog.find('#amount-now').html(amountNow);
  },
  expenseSplitPercentageHandler: (dialog, expense) => {
    expense = expense || null;

    // Reset the form.
    expenseSplitDialog.find('input[type="text"]').val('');
    expenseSplitDialog.find('.split-third-col').hide();
    expenseSplitDialog.find('.split-percentage-third-col').show();
    expenseSplitDialog.find('select').val('3');

    if (expense && expense.split.option === '3') {
      let amount = dialog.find('#expense-amount').val();
      amount = amount == '' ? '0.00' : amount;

      expenseSplitDialog.find('#contact-owe-percentage-textbox').val(expense.split.contact);
      expenseSplitDialog.find('#you-owe-percentage-textbox').val(expense.split.you);

      if (expense.amount.total == amount) {
        amountContactOwe.html(expense.amount.contactOwe);
        amountYouOwe.html(expense.amount.youOwe);
        expenseSplitDialog.find('#amount-now').html(expense.amount.total);
      } else {
        const amountYou = (parseFloat(amount) * expense.split.you) / 100.0;
        const amountContact = (parseFloat(amount) * expense.split.contact) / 100.0;

        amountContactOwe.html(amountYou);
        amountYouOwe.html(amountContact);
        expenseSplitDialog.find('#amount-now').html(amount);
        expenseSplitDialog.find('#amount-full').html(amount);
      }
    } else {
      amountContactOwe.html('0');
      amountYouOwe.html('0');
      expenseSplitDialog.find('#amount-now').html('0');
    }

    // Deleted expense.
    if (expense && expense.deleted) {
      expenseSplitDialog.find('input').prop('disabled', true);
      expenseSplitDialog.find('select').attr('disabled', true);
      expenseSplitDialog.find('textarea').attr('disabled', true);
      expenseSplitDialog.find('#confirm-expense-split').hide();
    } else {
      expenseSplitDialog.find('input').prop('disabled', false);
      expenseSplitDialog.find('select').attr('disabled', false);
      expenseSplitDialog.find('textarea').attr('disabled', false);
      expenseSplitDialog.find('#confirm-expense-split').show();
    }
  },
  expenseSplitPercentageChangeHandler: () => {
    let amount = expenseSplitDialog.find('#amount-full').html();
    amount = amount == '' ? 0.00 : parseFloat(amount);

    const youOweTextbox = expenseSplitDialog.find('#you-owe-percentage-textbox');
    const contactOweTextbox = expenseSplitDialog.find('#contact-owe-percentage-textbox');

    const doesYouOwe = youOweTextbox.val() != '';
    const doesContactOwe = contactOweTextbox.val() != '';

    let amountYou = 0.00;
    if (doesYouOwe) {
      amountYou = (parseFloat(amount) * youOweTextbox.val()) / 100.0;
    }
    let amountContact = 0.00;
    if (doesContactOwe) {
      amountContact = (parseFloat(amount) * contactOweTextbox.val()) / 100.0;
    }
    const amountNow = (amountContact + amountYou);

    amountContactOwe.html(amountContact);
    amountYouOwe.html(amountYou);
    expenseSplitDialog.find('#amount-now').html(amountNow);
  },
  expenseSplitConfirmHandler: () => {
    let dialog = null;
    const split = expenseSplitDialog.find('#split-option').val();
    if (typeof split !== 'undefined' && split === 'edit') {
      dialog = expenseEditDialog;
    }

    const amountGot = parseFloat(expenseSplitDialog.find('#amount-now').html()).toFixed(2);
    const amountExpected = parseFloat(expenseSplitDialog.find('#amount-full').html()).toFixed(2);

    if (amountGot !== amountExpected) {
      alert('Expected amount = ' + amountGot + ' do not match ' + amountExpected);
      return;
    }

    // Update the expense object (if expense update).
    if (dialog) {
      let expense = dialog.find('.expense-json').val();
      expense = decodeURIComponent(expense);
      expense = JSON.parse(expense);

      let contactSplit = '';
      let youSplit = '';
      let splitOption = expenseSplitDialog.find('select').val();
      switch (splitOption) {
        case '1':
          contactSplit = expenseSplitDialog.find('#contact-owe-checkbox input[type="checkbox"]').is(':checked');
          youSplit = expenseSplitDialog.find('#you-owe-checkbox input[type="checkbox"]').is(':checked');
          break;
        case '2':
          contactSplit = expenseSplitDialog.find('#contact-owe-textbox').val();
          youSplit = expenseSplitDialog.find('#you-owe-textbox').val();
          break;
        case '3':
          contactSplit = expenseSplitDialog.find('#contact-owe-percentage-textbox').val();
          youSplit = expenseSplitDialog.find('#you-owe-percentage-textbox').val();
          break;
      }

      expense.amount.total = expenseSplitDialog.find('#amount-full').html();
      expense.amount.contactOwe = expenseSplitDialog.find('#amount-contact-owe').html();
      expense.amount.youOwe = expenseSplitDialog.find('#amount-you-owe').html();
      expense.split.option = splitOption;
      expense.split.contact = contactSplit;
      expense.split.you = youSplit;

      expense = JSON.stringify(expense);
      expense = encodeURIComponent(expense);
      dialog.find('.expense-json').val(expense);
    }

    expenseSplitDialog.modal('hide');
  },
  addNewExpenseHandler: () => {
    // Reset everything.
    expenseAddDialog.find('input, textarea').val('');
    expenseCurrencies.val(expenseCurrencies.find('option:first').val());
    resetExpensePic(expenseAddDialog);

    expenseSplitDialog.find('input[type="checkbox"]').prop('checked', true);

    expenseAddDialog.modal('show');
    ExpensesHandler.expenseSplitEquallyHandler(expenseSplitDialog);
  },
  confirmNewExpenseHandler: async () => {
    let expense = constructExpenseObject(expenseAddDialog);

    if (validateExpenseObject(expense, expenseAddDialog)) {
      if (confirm('Are you sure you want to add this expense?')) {
        // Change the button to loading.
        const btn = expenseAddDialog.find('#confirm-add-expense');
        const loadingText = '<i class="fas fa-spinner fa-spin"></i>&nbsp;Adding...';
        btn.data('original-text', btn.html());
        btn.html(loadingText);

        const pic = expenseAddDialog.find('#expense-picture').prop('files')[0];
        if (typeof pic !== 'undefined') {
          try {
            const hash = await Infura.uploadFileToIPFS(pic);
            expense.img = config.infura.ipfs.gateway + hash;
          } catch (err) {
            btn.html(btn.data('original-text'));
            alert('Unable to upload the file!');
            return;
          }
        }

        try {
          expense.deleted = 0;
          expense.id = await Expenses.addNewExpense(
            expense.address,
            expense.contactAddress,
            JSON.stringify(expense)
          );

          const {row, rowMonth} = ExpensesUtils.displayNewExpense(expense, ContactsHandler.contactsList);
          if (row) {
            ExpensesUtils.expenseOffset++;
          }

          btn.html(btn.data('original-text'));
          expenseAddDialog.modal('hide');
        } catch (err) {
          console.log(err.message);
          btn.html(btn.data('original-text'));
          alert('Some error has occured!');
        }
      }
    }
  },
  displayExpenses: (expenses) => {
    let el = new SimpleBar(expenseDisplay[0]);

    for (const currentExpense of expenses) {
      let expense = JSON.parse(currentExpense.expense);
      expense.id = currentExpense.id;
      expense.deleted = currentExpense.deleted;
      expense.is_settlement = currentExpense.is_settlement;
      console.log(expense);

      if (expense.deleted && $('#search-expense-deleted').is(':checked')) {
        continue;
      }

      let lastExpense = expenseDisplay.find('.row-actual-expense:last .expense-json').val();
      if (lastExpense !== undefined) {
        lastExpense = decodeURIComponent(lastExpense);
      } else {
        lastExpense = null;
      }

      if (lastExpense) {
        const lastExpenseTimestamp = new Date(JSON.parse(lastExpense).timestamp);
        const currentExpenseTimestamp = new Date(expense.timestamp);
        if (lastExpenseTimestamp.getMonth() !== currentExpenseTimestamp.getMonth()) {
          const rowMonthStr = window.moment(currentExpenseTimestamp).format('MMMM YYYY').toUpperCase();
          const rowMonth = '<div class="row row-month">' + rowMonthStr + '</div>';
          expenseDisplay.find('.simplebar-content').append(rowMonth);
        }
      } else {
        const rowMonthStr = window.moment(expense.timestamp).format('MMMM YYYY').toUpperCase();
        const rowMonth = '<div class="row row-month">' + rowMonthStr + '</div>';
        expenseDisplay.find('.simplebar-content').append(rowMonth);
      }

      const row = ExpensesUtils.constructExpenseRow(expense, ContactsHandler.contactsList);
      expenseDisplay.find('.simplebar-content').append(row);
      el.recalculate();
    }
    ExpensesUtils.expenseOffset += expenses.length;
  },
  loadNextBatch: async () => {
    try {
      const expenses = await Expenses.searchExpenses(Wallet.address, ExpensesUtils.expenseOffset, ExpensesUtils.expenseLimit);
      ExpensesHandler.displayExpenses(expenses);
    } catch (err) {
      throw err;
    }
  },
  editExpenseDisplayHandler: async (ele) => {
    ExpensesHandler.currentExpenseRow = $(ele);
    let expense = $(ele).find('.expense-json').val();
    expense = JSON.parse(decodeURIComponent(expense));

    await displayCurrentExpense(expense, expenseEditDialog, $(ele).find('.expense-json').val());
  },
  deleteExpenseHandler: async () => {
    if (confirm("Are you sure you want to delete this expense?")) {
      const expenseJsonEle = expenseEditDialog.find('.expense-json');
      let expense = JSON.parse(decodeURIComponent(expenseJsonEle.val()));

      try {
        await Expenses.deleteExpense(Wallet.address, expense.id);
        expenseEditDialog.modal('hide');

        // Set it back to the row.
        expense.deleted = 1;
        const updatedExpenseJsonStr = encodeURIComponent(JSON.stringify(expense));
        ExpensesHandler.currentExpenseRow.find('.expense-json').val(updatedExpenseJsonStr);
        ExpensesHandler.currentExpenseRow.addClass('row-expense-deleted');
      } catch (err) {
        alert('Unable to delete this expense');
      }
    }
  },
  confirmUpdateExpenseHandler: async () => {
    const expenseJsonEle = expenseEditDialog.find('.expense-json');
    let id = JSON.parse(decodeURIComponent(expenseJsonEle.val())).id;
    let expense = constructExpenseObject(expenseEditDialog, 'edit');
    expense.id = id;

    if (validateExpenseObject(expense, expenseEditDialog)) {
      if (confirm('Are you sure you want to update this expense?')) {
        // Change the button to loading.
        const btn = expenseEditDialog.find('#confirm-update-expense');
        const loadingText = '<i class="fas fa-spinner fa-spin"></i>&nbsp;Updating...';
        btn.data('original-text', btn.html());
        btn.html(loadingText);

        const pic = expenseEditDialog.find('#expense-picture').prop('files')[0];
        if (pic !== undefined) {
          try {
            const hash = await Infura.uploadFileToIPFS(pic);
            expense.img = config.infura.ipfs.gateway + hash;
          } catch (err) {
            btn.html(btn.data('original-text'));
            alert('Unable to upload the file!');
            return;
          }
        }

        try {
          await Expenses.updateExpense({
            address: Wallet.address,
            id: expense.id,
            expense: JSON.stringify(expense),
          });

          // Update the UI.
          if (ExpensesHandler.currentExpenseRow.next().length === 0) {
            // This is the last element.
            // If its the last element for that month, delete the month too.
            if (ExpensesHandler.currentExpenseRow.prev().hasClass('row-month')) {
              ExpensesHandler.currentExpenseRow.prev().remove();
            }
          } else {
            // if its the only element for this month.
            if (ExpensesHandler.currentExpenseRow.next().hasClass('row-month') &&
                ExpensesHandler.currentExpenseRow.prev().hasClass('row-month')) {
              ExpensesHandler.currentExpenseRow.prev().remove();
            }
          }
          ExpensesHandler.currentExpenseRow.remove();
          ExpensesUtils.displayNewExpense(expense, ContactsHandler.contactsList);

          btn.html(btn.data('original-text'));
          expenseEditDialog.modal('hide');
        } catch (err) {
          console.log(err);
          btn.html(btn.data('original-text'));
          alert('Some error has occured!');
        }
      }
    }
  },
  searchExpenseHandler: async (keyword, includeDeleted) => {
    if (!ExpensesHandler.expenseSearching) {
      ExpensesHandler.expenseSearching = true;

      $('#display-expenses .simplebar-content').html('');

      // Search for expenses.
      try {
        let expenses = [];
        if (keyword.trim().length === 0) {
          ExpensesUtils.expenseOffset = 0;
          await ExpensesHandler.loadNextBatch();
        } else {
          expenses = await Expenses.searchExpensesWithKeyword(Wallet.address, keyword, includeDeleted);
          ExpensesHandler.displayExpenses(expenses);
        }

      } catch (err) {
        ExpensesHandler.expenseSearching = false;
      }

      ExpensesHandler.expenseSearching = false;
    }
  },
  settleExpenseConfirmHandler: async (btn) => {
    try {
      const loadingText = '<i class="fas fa-spinner fa-spin"></i>&nbsp;Settling...';
      btn.data('original-text', btn.html());
      btn.html(loadingText);

      const contactAddress = expenseSettleDialog.find('.settle-expense-contact-address').val();
      const contactName = expenseSettleDialog.find('.settle-expense-contact-name').val();

      const token = $('#settle-expense-currency').val();
      const {balance, logo} = await Wallet.getTokenBalanceAndLogo(token, Wallet.address);

      let json = expenseSettleDialog.find('.settle-expense-currency-json').val();
      json = JSON.parse(decodeURIComponent(json));

      // Validate that user has enough funds to settle this token.
      if (json[token] === undefined || balance < parseFloat(json[token])) {
        throw new Error('You dont have enough balance to settle!');
      }

      // Make the txn.
      const data = await Wallet.makeERC20Txn({
        from: Wallet.address,
        to: contactAddress,
        token: token,
        amount: parseFloat(json[token])
      });
      const etherscanLink = config.app.etherscan + data.transactionHash;

      // Construct and add the expense.
      await expenseSettle({
        name: contactName,
        address: contactAddress,
      }, token, json[token], etherscanLink);

      btn.html(btn.data('original-text'));
      expenseSettleDialog.modal('hide');
    } catch (err) {
      console.log(err);
      btn.html(btn.data('original-text'));

      alert(err.message);
    }
  },
};

module.exports = ExpensesHandler;
