const ContactsHandler = require('./modules/handlers/contacts.js');
const ExpensesHandler = require('./modules/handlers/expenses.js');
const WalletHandler = require('./modules/handlers/wallet.js');

$(document).ready(() => {
  const confirmAddrButton       = $('#confirm-eth-addr'),
        confirmNewContactButton = $('#confirm-add-contact');

  const expenseContacts = $('#expense-contacts'),
        expenseDisplay  = $('#display-expenses');

  const expenseAddDialog    = $('#add-expense-dialog'),
        expenseSplitDialog  = $('#expense-split-dialog'),
        expenseEditDialog   = $('#edit-expense-dialog');

  $('#wallet-login-button').on('click', async (e) => WalletHandler.walletConnectHandler(e));
  $('#wallet-left-connect').on('click', async (e) => WalletHandler.walletConnectHandler(e));
  $('#contacts-right-connect').on('click', async (e) => WalletHandler.walletConnectHandler(e));
  confirmAddrButton.on('click', () => WalletHandler.walletConnectConfirmHandler(confirmAddrButton));
  $('#wallet-logout-button').on('click', WalletHandler.walletLogoutHandler);

  confirmNewContactButton.on('click', () => ContactsHandler.addNewContactHandler(confirmNewContactButton));
  $('#add-new-contact').on('click', ContactsHandler.addNewContactDisplayHandler);
  $('#add-new-expense').on('click', ExpensesHandler.addNewExpenseHandler);
  $('#contacts-after-connect').on('click', '.fa-times-circle', (e) => ContactsHandler.deleteContactHandler(e.target));

  expenseAddDialog.find('#expense-bill-split').on('click', () => {
    expenseSplitDialog.find('#split-option').val('add');

    const expenseAmount = expenseEditDialog.find('#expense-amount');
    const amount = expenseAmount.val();
    if (amount != '') {
      if (isNaN(amount) || !/^([1-9]\d*|0)?(\.\d+)?$/.test(amount)) {
        expenseAmount.focus();
        return;
      }
    }

    ExpensesHandler.expenseSplitEquallyHandler(expenseAddDialog);

    expenseSplitDialog.modal('show');
  });
  expenseEditDialog.find('#expense-bill-split').on('click', () => {
    expenseSplitDialog.find('#split-option').val('edit');

    const expenseAmount = expenseEditDialog.find('#expense-amount');
    const amount = expenseAmount.val();
    if (amount != '') {
      if (isNaN(amount) || !/^([1-9]\d*|0)?(\.\d+)?$/.test(amount)) {
        expenseAmount.focus();
        return;
      }
    }

    let expense = expenseEditDialog.find('.expense-json').val();
    expense = decodeURIComponent(expense);
    expense = JSON.parse(expense);

    switch (expense.split.option) {
      case '1':
        ExpensesHandler.expenseSplitEquallyHandler(expenseEditDialog, expense);
        break;
      case '2':
        ExpensesHandler.expenseSplitUnequallyHandler(expenseEditDialog, expense);
        break;
      case '3':
        ExpensesHandler.expenseSplitPercentageHandler(expenseEditDialog, expense);
        break;
    }

    expenseSplitDialog.modal('show');
  });
  $('#confirm-expense-split').on('click', ExpensesHandler.expenseSplitConfirmHandler);
  $('#confirm-add-expense').on('click', ExpensesHandler.confirmNewExpenseHandler);

  $('#datetimepicker1').datetimepicker({
    icons: {
      time: 'far fa-clock',
      date: 'far fa-calendar',
      today: 'far fa-calendar-check-o',
      clear: 'far fa-trash',
      close: 'far fa-times'
    },
    format: 'YYYY-MM-DD hh:mm:ss',
  });

  $('.modal').on('show.bs.modal', function() {
    const idx = $('.modal:visible').length;
    $(this).css('z-index', 1040 + (10 * idx));
  });
  $('.modal').on('shown.bs.modal', function() {
    const idx = ($('.modal:visible').length) -1; // raise backdrop after animation.
    $('.modal-backdrop').not('.stacked').css('z-index', 1039 + (10 * idx));
    $('.modal-backdrop').not('.stacked').addClass('stacked');
  });

  expenseAddDialog.on('shown.bs.modal', () => {
    expenseContacts.focus();
    expenseAddDialog.find('input[type="text"]').val('');
    expenseAddDialog.find('input[type="file"]').val('');
    expenseAddDialog.find('textarea').val('');
  });
  // expenseSplitDialog.on('shown.bs.modal', ExpensesHandler.expenseSplitEquallyHandler);
  expenseDisplay.on('click', '.row-actual-expense', (e) => ExpensesHandler.editExpenseDisplayHandler(e.currentTarget));
  expenseAddDialog.on('change', 'input#expense-picture', function() {
    expenseAddDialog.find('#expense-pic').html('<i class="fas fa-circle-notch fa-spin"></i>');

    const reader = new FileReader();
    reader.onload = (e) => {
      const imgHtml = '<img src="' + e.target.result + '" style="width:100%;"/>\
                      <div id="expense-pic-change">\
                        <div class="input-group-text">\
                          <label style="margin-bottom:0 !important;">\
                            <i class="fas fa-camera" title="Add a picture"></i>\
                          </label>\
                        </div>\
                      </div>';
      expenseAddDialog.find('#expense-pic').html(imgHtml);
    };
    reader.readAsDataURL($(this)[0].files[0]);
  });
  expenseAddDialog.on('click', '#expense-pic-change', () => {
    expenseAddDialog.find('#expense-picture').click();
  });
  expenseAddDialog.on('click', '#expense-no-pic-change', () => {
    expenseAddDialog.find('#expense-picture').click();
  });
  expenseEditDialog.on('change', 'input#expense-picture', function() {
    expenseEditDialog.find('#expense-pic').html('<i class="fas fa-circle-notch fa-spin"></i>');

    const reader = new FileReader();
    reader.onload = (e) => {
      const imgHtml = '<img src="' + e.target.result + '" style="width:100%;"/>\
                      <input type="file" id="expense-picture" hidden />\
                      <div id="expense-pic-change">\
                        <div class="input-group-text">\
                          <label style="margin-bottom:0 !important;">\
                            <i class="fas fa-camera" title="Add a picture"></i>\
                          </label>\
                        </div>\
                      </div>';
      expenseEditDialog.find('#expense-pic').html(imgHtml);
    };
    reader.readAsDataURL($(this)[0].files[0]);
  });
  expenseEditDialog.on('click', '#expense-pic-change', () => {
    expenseEditDialog.find('#expense-picture').click();
  });
  expenseEditDialog.on('click', '#expense-no-pic-change', () => {
    expenseEditDialog.find('#expense-picture').click();
  });
  expenseEditDialog.on('click', '#delete-expense', ExpensesHandler.deleteExpenseHandler);
  expenseEditDialog.on('click', '#confirm-update-expense', ExpensesHandler.confirmUpdateExpenseHandler);

  expenseContacts.on('input', () => expenseContacts.css('border-color', '#000'));
  expenseSplitDialog.find('select').on('change', function() {
    let dialog = null;
    let expense = null;
    const split = expenseSplitDialog.find('#split-option').val();
    if (typeof split === 'undefined' || split === 'add') {
      dialog = expenseAddDialog;
    } else {
      dialog = expenseEditDialog;

      expense = expenseEditDialog.find('.expense-json').val();
      expense = decodeURIComponent(expense);
      expense = JSON.parse(expense);
    }

    const val = $(this).val();
    switch (val) {
      case '1':
        ExpensesHandler.expenseSplitEquallyHandler(dialog, expense);
        break;
      case '2':
        ExpensesHandler.expenseSplitUnequallyHandler(dialog, expense);
        break;
      case '3':
        ExpensesHandler.expenseSplitPercentageHandler(dialog, expense);
        break;
    }
  });
  expenseSplitDialog.find('#contact-owe-textbox').on('input', ExpensesHandler.expenseSplitUnequallyChangeHandler);
  expenseSplitDialog.find('#you-owe-textbox').on('input', ExpensesHandler.expenseSplitUnequallyChangeHandler);
  expenseSplitDialog.find('#contact-owe-percentage-textbox').on('input', ExpensesHandler.expenseSplitPercentageChangeHandler);
  expenseSplitDialog.find('#you-owe-percentage-textbox').on('input', ExpensesHandler.expenseSplitPercentageChangeHandler);
  expenseSplitDialog.on('change', 'input[type="checkbox"]', () => {
    let dialog = null;
    let expense = null;
    const split = expenseSplitDialog.find('#split-option').val();
    if (typeof split === 'undefined' || split === 'add') {
      dialog = expenseAddDialog;
    } else {
      dialog = expenseEditDialog;

      expense = expenseEditDialog.find('.expense-json').val();
      expense = decodeURIComponent(expense);
      expense = JSON.parse(expense);

      // reset.
      expense.amount.youOwe = '';
      expense.amount.contactOwe = '';
      expense.split.contact = '';
      expense.split.you = '';
    }

    ExpensesHandler.expenseSplitEquallyHandler(dialog, expense);
  });
  expenseSplitDialog.find('#cancel-expense').on('click', () => {
    expenseSplitDialog.find('#amount-contact-owe').html('');
    expenseSplitDialog.find('#amount-you-owe').html('');
  });

  $('#search-expenses').on('input', async function() {
    const keyword = $(this).val();
    await ExpensesHandler.searchExpenseHandler(keyword);
  });

  const el = new SimpleBar(expenseDisplay.find('.container-fluid')[0]);
  el.getScrollElement().addEventListener('scroll', async function() {
    if (Math.abs($(this)[0].scrollHeight - $(this)[0].scrollTop - $(this)[0].clientHeight) <= 3.0) {
      const ele = expenseDisplay.find('.simplebar-content');
      if (ele.find('.row-expense-loading').length > 0) {
        return;
      }
      ele.append('<div class="row row-expense-loading"><i class="fas fa-spinner fa-spin"></i></div>');
      el.recalculate();

      await ExpensesHandler.loadNextBatch();
      ele.find('.row-expense-loading').remove();
    }
  });

  // Check if already logged in.
  WalletHandler.walletConnectConfirmHandler();
});
