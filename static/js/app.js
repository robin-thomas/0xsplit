const ContactsHandler = require('./modules/handlers/contacts.js');
const ExpensesHandler = require('./modules/handlers/expenses.js');
const OrdersHandler = require('./modules/handlers/orders.js');
const WalletHandler = require('./modules/handlers/wallet.js');
const Wallet = require('./modules/metamask.js');
const Orders = require('./modules/orders.js');

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

    let prevExpense = expenseEditDialog.find('.expense-json').val();
    prevExpense = JSON.parse(decodeURIComponent(prevExpense));

    const expense = ExpensesHandler.constructExpenseForYouOweExpense(prevExpense);

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

  expenseAddDialog.on('shown.bs.modal', () => expenseContacts.focus());
  // expenseSplitDialog.on('shown.bs.modal', ExpensesHandler.expenseSplitEquallyHandler);
  expenseDisplay.on('click', '.row-actual-expense', (e) => ExpensesHandler.editExpenseDisplayHandler(e.currentTarget));
  expenseAddDialog.on('change', 'input#expense-picture', function() {
    const expensePicDiv = expenseAddDialog.find('#expense-pic');
    expensePicDiv.html('<i class="fas fa-circle-notch fa-spin"></i>');

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
      expensePicDiv.html(imgHtml);

      const picHover = expensePicDiv.find('#expense-pic-change');
      picHover.width(expensePicDiv.width() + 'px');
      picHover.height(expensePicDiv.height() + 'px');
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

  expenseContacts.on('input', () => expenseContacts.css('border-bottom-color', 'rgba(181,187,202,.1)'));
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
    if (split === undefined || split === 'add') {
      dialog = expenseAddDialog;
    } else {
      dialog = expenseEditDialog;

      expense = expenseEditDialog.find('.expense-json').val();
      expense = JSON.parse(decodeURIComponent(expense));

      // reset.
      expense.amount.youOwe = '';
      expense.amount.contactOwe = '';
      // TODO: why was the below used (wasnt commented)?
      // expense.split.contact = '';
      // expense.split.you = '';
    }

    ExpensesHandler.expenseSplitEquallyHandler(dialog, expense);
  });
  expenseSplitDialog.find('#cancel-expense').on('click', () => {
    expenseSplitDialog.find('#amount-contact-owe').html('');
    expenseSplitDialog.find('#amount-you-owe').html('');
  });

  $('#search-expenses').on('input', async function() {
    const keyword = $(this).val();
    const includeDeleted = $('#search-expense-deleted').is(':checked') ? false : true;
    await ExpensesHandler.searchExpenseHandler(keyword, includeDeleted);
  });

  $('#search-expense-deleted').on('change', async function() {
    const keyword = $('#search-expenses').val();
    const includeDeleted = $('#search-expense-deleted').is(':checked') ? false : true;
    await ExpensesHandler.searchExpenseHandler(keyword, includeDeleted);
  });

  const expenseScrollHandler = async (div) => {
    if ((div.scrollTop() + div.outerHeight() + 3) >= div[0].scrollHeight) {
      // Disable scroll.
      div.off('scroll');

      const ele = expenseDisplay.find('.simplebar-content');
      ele.append('<div class="row row-expense-loading"><i class="fas fa-spinner fa-spin"></i></div>');
      el.recalculate();

      try {
        await ExpensesHandler.loadNextBatch();
      } catch (err) {}
      ele.find('.row-expense-loading').remove();

      // Enable scroll.
      div.on('scroll', () => expenseScrollHandler(div));
    }
  }
  const el = new SimpleBar(expenseDisplay.find('.container-fluid')[0]);
  $(el.getScrollElement()).on('scroll', () => expenseScrollHandler($(el.getScrollElement())));

  $('#search-expenses-arrow').on('click', () => {
    $('#search-expenses-advanced').toggle();
  });

  $('#contacts-after-connect').on('click', '.settle-up-with-contact', function () {
    ContactsHandler.settleContactDisplayHandler($(this));
  });
  $('#confirm-settle-expenses').on('click', function () {
    ExpensesHandler.settleExpenseConfirmHandler($(this));
  });

  $('#settle-expense-currency').on('change', ContactsHandler.expenseSettleTokenChange);

  $('#wallet-after-connect').on('click', '.buy-order', async function() {
    try {
      await OrdersHandler.orderBuyHandler($(this));
    } catch (err) {
      console.log(err);
      alert('Unable to buy the order!');
    }
  });

  const setSecondTokenBasedOnRate = () => {
    const val1 = parseFloat($('#token-swap-input-1').val());
    if (val1 !== 0 && !isNaN(val1)) {
      const token1 = $('#token-swap-select-1').val();
      const token2 = $('#token-swap-select-2').val();

      let rate = Wallet.tokenExchangeRateList[token1][token2];
      rate = parseFloat(rate);

      const val2 = parseFloat(val1 * rate).toFixed(2);
      $('#token-swap-input-2').val(val2);
    }
  };
  const setFirstTokenBasedOnRate = () => {
    const val2 = parseFloat($('#token-swap-input-2').val());
    if (val2 !== 0 && !isNaN(val2)) {
      const token1 = $('#token-swap-select-1').val();
      const token2 = $('#token-swap-select-2').val();

      let rate = Wallet.tokenExchangeRateList[token2][token1];
      rate = parseFloat(rate);

      const val1 = parseFloat(val2 * rate);
      $('#token-swap-input-1').val(val1);
    }
  }

  $('#token-swap-select-1').on('input', setSecondTokenBasedOnRate);
  $('#token-swap-input-1').on('input', setSecondTokenBasedOnRate);
  $('#token-swap-input-2').on('input', setFirstTokenBasedOnRate);
  $('#token-swap-select-2').on('input', setFirstTokenBasedOnRate);

  $('#confirm-swap-tokens').on('click', async function() {
    const sellToken = $('#token-swap-select-1').val();
    const sellTokenAmount = parseFloat($('#token-swap-input-1').val());
    const buyToken = $('#token-swap-select-2').val();
    const buyTokenAmount = parseFloat($('#token-swap-input-2').val());

    if (sellToken === buyToken) {
      alert('Cannot buy and sell same token!');
      return;
    }

    // Verify that you have that much balance to sell.
    const {balance, logo} = await Wallet.getTokenBalanceAndLogo(sellToken, Wallet.address);
    if (balance < sellTokenAmount) {
      alert('You do not have ' + sellTokenAmount + ' ' + sellToken + '!');
      $(this).find('i').removeClass('fa-spin');
      $('#token-swap-div').find('input, select').prop('disabled', false);
      return;
    }

    if (confirm('Buy ' + buyTokenAmount + ' ' + buyToken + ' for ' + sellTokenAmount + ' ' + sellToken + ' ?')) {
      // Disable the inputs.
      $('#token-swap-div').find('input, select').prop('disabled', true);

      $(this).find('i').addClass('fa-spin');

      try {
        await Orders.submitOrder({
          address: Wallet.address,
          token: sellToken,
          price: sellTokenAmount,
        }, {
          token: buyToken,
          price: buyTokenAmount,
        });

        // Update the UI.
        await OrdersHandler.orderDisplayHandler();
      } catch (err) {
        console.log(err);
        alert(err.message);
      }

      $(this).find('i').removeClass('fa-spin');
      $('#token-swap-div').find('input, select').prop('disabled', false);
    }
  });

  // Check if already logged in.
  WalletHandler.walletConnectConfirmHandler();
});
