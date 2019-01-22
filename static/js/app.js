const ContactsHandler = require('./modules/handlers/contacts.js');
const ExpensesHandler = require('./modules/handlers/expenses.js');
const WalletHandler = require('./modules/handlers/wallet.js');

$(document).ready(() => {
  const confirmAddrButton       = $('#confirm-eth-addr'),
        confirmNewContactButton = $('#confirm-add-contact'),
        confirmNewExpenseButton = $('#confirm-add-expense');

  const expenseContacts = $('#expense-contacts'),
        expenseNotes    = $('#expense-notes'),
        expenseAmount   = $('#expense-amount');

  const addExpenseDialog    = $('#add-expense-dialog'),
        expenseNotesDialog  = $('#add-expense-notes-dialog'),
        expenseSplitDialog  = $('#expense-split-dialog');

  $('#wallet-login-button').on('click', async (e) => WalletHandler.walletConnectHandler(e));
  $('#wallet-left-connect').on('click', async (e) => WalletHandler.walletConnectHandler(e));
  $('#contacts-right-connect').on('click', async (e) => WalletHandler.walletConnectHandler(e));
  confirmAddrButton.on('click', () => WalletHandler.walletConnectConfirmHandler(confirmAddrButton));
  $('#wallet-logout-button').on('click', WalletHandler.walletLogoutHandler);

  confirmNewContactButton.on('click', () => ContactsHandler.addNewContactHandler(confirmNewContactButton));
  $('#add-new-contact').on('click', ContactsHandler.addNewContactDisplayHandler);
  $('#add-new-expense').on('click', ExpensesHandler.addNewExpenseHandler);
  $('#contacts-after-connect').on('click', '.fa-times-circle', (e) => ContactsHandler.deleteContactHandler(e.target));

  $('#expense-add-notes').on('click', ExpensesHandler.addNotesDisplayHandler);
  $('#expense-bill-split').on('click', () => {
    const amount = expenseAmount.val();
    if (amount != '') {
      if (isNaN(amount) || !/^([1-9]\d*|0)?(\.\d+)?$/.test(amount)) {
        expenseAmount.focus();
        return;
      }
    }
    expenseSplitDialog.modal('show');
  });
  $('#confirm-expense-split').on('click', ExpensesHandler.expenseSplitConfirmHandler);
  confirmNewExpenseButton.on('click', () => ExpensesHandler.confirmNewExpenseHandler(confirmNewExpenseButton));

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

  addExpenseDialog.on('shown.bs.modal', () => {
    expenseContacts.focus();
    addExpenseDialog.find('input[type="text"]').val('');
    addExpenseDialog.find('input[type="file"]').val('');
    expenseNotesDialog.find('input[type="text"]').val('');
    expenseSplitDialog.find('select').prepend('<option value="0" selected></option>');
  });
  expenseNotesDialog.on('shown.bs.modal', () => {
    expenseNotes.focus();
  });
  expenseSplitDialog.on('shown.bs.modal', ExpensesHandler.expenseSplitEquallyHandler);

  expenseContacts.on('input', () => expenseContacts.css('border-color', '#000'));
  expenseSplitDialog.find('select').on('change', function() {
    const val = $(this).val();
    switch (val) {
      case '1':
        ExpensesHandler.expenseSplitEquallyHandler();
        break;
      case '2':
        ExpensesHandler.expenseSplitUnequallyHandler();
        break;
      case '3':
        ExpensesHandler.expenseSplitPercentageHandler();
        break;
    }
  });
  expenseSplitDialog.find('#contact-owe-textbox').on('input', ExpensesHandler.expenseSplitUnequallyChangeHandler);
  expenseSplitDialog.find('#you-owe-textbox').on('input', ExpensesHandler.expenseSplitUnequallyChangeHandler);
  expenseSplitDialog.find('#contact-owe-percentage-textbox').on('input', ExpensesHandler.expenseSplitPercentageChangeHandler);
  expenseSplitDialog.find('#you-owe-percentage-textbox').on('input', ExpensesHandler.expenseSplitPercentageChangeHandler);
  expenseSplitDialog.on('change', 'input[type=checkbox]', ExpensesHandler.expenseSplitEquallyHandler);
  $('#cancel-add-notes').on('click', ExpensesHandler.cancelAddNotesHandler);
  $('#confirm-add-notes').on('click', ExpensesHandler.confirmAddNotesHandler);

  const el = new SimpleBar($('#display-expenses .container-fluid')[0]);
  el.getScrollElement().addEventListener('scroll', async function() {
    if ($(this).scrollTop() + $(this).innerHeight() + 25 >= $(this)[0].scrollHeight) {
      const ele = $('#display-expenses').find('.simplebar-content');
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
