const moment = require('moment');

const ContactsHandler = require('./contacts.js');
const Expenses = require('../expenses.js');
const Infura = require('../infura.js');
const Wallet = require('../metamask.js');

const config = require('../../../../config.json');

const expenseAddDialog    = $('#add-expense-dialog'),
      expenseSplitDialog  = $('#expense-split-dialog'),
      expenseEditDialog   = $('#edit-expense-dialog');

const expenseContacts     = $('#expense-contacts'),
      expenseDisplay      = $('#display-expenses').find('.container-fluid');

const amountContactOwe    = $('#amount-contact-owe'),
      amountYouOwe        = $('#amount-you-owe');

const displayCurrentExpense = (expense, dialogEle, expenseJsonStr) => {
  if (typeof expense.img !== 'undefined') {
    dialogEle.find('#expense-pic').html('<i class="fas fa-circle-notch fa-spin"></i>');

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
      dialogEle.find('#expense-pic').html(imgHtml);
    };
    img.src = expense.img;
  } else {
    // reset.
    const imgHtml = '<div id="expense-no-pic-change">\
                      <div class="input-group-text">\
                        <label style="margin-bottom:0 !important;">\
                          <i class="fas fa-camera" title="Add a picture"></i>\
                        </label>\
                      </div>\
                    </div>';
    dialogEle.find('#expense-pic').html(imgHtml);
  }

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

  // Hide the delete button if expense is already deleted.
  if (expense.deleted) {
    dialogEle.find('#delete-expense').fadeOut();
    dialogEle.find('#confirm-update-expense').fadeOut();

    dialogEle.find('.expense-has-deleted-caption').show();

    dialogEle.find('input').prop('readonly', true);
    dialogEle.find('select').attr('disabled', true);
    dialogEle.find('textarea').attr('disabled', true);
  } else {
    dialogEle.find('#delete-expense').fadeIn();
    dialogEle.find('#confirm-update-expense').fadeIn();

    dialogEle.find('.expense-has-deleted-caption').hide();

    dialogEle.find('input').prop('readonly', false);
    dialogEle.find('select').attr('disabled', false);
    dialogEle.find('textarea').attr('disabled', false);
  }

  dialogEle.find('.expense-json').val(expenseJsonStr);
  dialogEle.modal('show');
};

const constructExpenseObject = (dialogEle) => {
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
    timestamp: dialogEle.find('#datetimepicker1').find('input[type="text"]').val(),
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
    dialogEle.find('#expense-contacts').css('border-color', 'red').focus();
    return false;
  }
  const contactsCheck = ContactsHandler.contactsList.filter(e => e.hasOwnProperty('nickname')).map(e => e.nickname);
  if (!contactsCheck.includes(expense.contactName)) {
    dialogEle.find('#expense-contacts').val('').css('border-color', 'red').focus();
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

  console.log(dialogEle.find('#expense-amount').val(), expense.amount.total);
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
    description: 'Settle all billd',
    token: token,
    amount: {
      total: amount,
      contactOwe: amount,
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

const expenseSettle = async (expenses, contact) => {
  for (const expense of expenses) {
    const expenseJson = JSON.stringify(constructExpenseForSettle(
      contact,
      expense.token,
      expense.amount,
      expense.etherscanLink
    ));

    try {
      await Expenses.addNewExpense(Wallet.address, contact.address, expenseJson);
    } catch (err) {
    }
  }
}

const ExpensesHandler = {
  tokensList: [],
  expenseOffset: 0,
  expenseLimit: 5,
  expenseSearching: false,
  expenseSplitEquallyHandler: (dialogEle, expense) => {
    expense = expense || null;
    console.log(expense);

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
    if (expense && expense.split.option === '1') {
      if (expense.split.contact !== '') {
        contactOweCheckbox.prop('checked', expense.split.contact);
      }
      if (expense.split.you !== '') {
        youOweCheckbox.prop('checked', expense.split.you);
      }
    } else {
      // reset.
      contactOweCheckbox.prop('checked', true);
      youOweCheckbox.prop('checked', true);
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
    expenseContacts.val('');
    expenseAddDialog.modal('show');
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

        console.log(expense);

        try {
          await Expenses.addNewExpense(
            expense.address,
            expense.contactAddress,
            JSON.stringify(expense)
          );

          ExpensesHandler.displayExpenses([{expense: JSON.stringify(expense)}]);

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

      if (expense.deleted && $('#search-expense-deleted').is(':checked')) {
        continue;
      }

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

      const escapedJsonStr = encodeURIComponent(JSON.stringify(expense));

      const deletedClass = expense.deleted ? 'row-expense-deleted' : '';

      const row = '<div class="row row-actual-expense ' + deletedClass + '">\
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

    displayCurrentExpense(expense, expenseEditDialog, $(ele).find('.expense-json').val());
  },
  deleteExpenseHandler: async () => {
    if (confirm("Are you sure you want to delete this expense?")) {
      let expense = expenseEditDialog.find('.expense-json').val();
      expense = JSON.parse(decodeURIComponent(expense));

      try {
        await Expenses.deleteExpense(Wallet.address, expense.id);
        expenseEditDialog.modal('hide');

        // Set it back to the row.
        expense.deleted = true;
      } catch (err) {
        alert('Unable to delete this expense');
      }
    }
  },
  confirmUpdateExpenseHandler: async () => {
    let expense = expenseEditDialog.find('.expense-json').val();
    expense = decodeURIComponent(expense);
    expense = JSON.parse(expense);

    if (validateExpenseObject(expense, expenseEditDialog)) {
      if (confirm('Are you sure you want to update this expense?')) {
        // Change the button to loading.
        const btn = expenseEditDialog.find('#confirm-update-expense');
        const loadingText = '<i class="fas fa-spinner fa-spin"></i>&nbsp;Updating...';
        btn.data('original-text', btn.html());
        btn.html(loadingText);

        const pic = expenseEditDialog.find('#expense-picture').prop('files')[0];
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
          await Expenses.updateExpense({
            address: expense.address,
            id: expense.id,
            expense: JSON.stringify(expense),
          });

          btn.html(btn.data('original-text'));
          expenseEditDialog.modal('hide');
        } catch (err) {
          console.log(err.message);
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
          ExpensesHandler.expenseOffset = 0;
          await ExpensesHandler.loadNextBatch();
        } else {
          expenses = await Expenses.searchExpensesWithKeyword(Wallet.address, keyword, includeDeleted);
          ExpensesHandler.displayExpenses(expenses);
        }

      } catch (err) {
        console.log(err);
        ExpensesHandler.expenseSearching = false;
      }

      ExpensesHandler.expenseSearching = false;
    }
  },
};

module.exports = ExpensesHandler;
