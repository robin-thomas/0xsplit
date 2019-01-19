const Wallet = require('./modules/metamask.js');
const Session = require('./modules/session.js');
const Contacts = require('./modules/contacts.js');
const config = require('../../config.json');

let token = null;
let address = null;
let contactsList = [];

$(document).ready(() => {
  const walletLoginButton         = $('#wallet-login-button'),
        walletLogoutButton        = $('#wallet-logout-button'),
        walletAddressDisplay      = walletLogoutButton.find('.wallet-label-bottom'),
        confirmAddrButton         = $('#confirm-eth-addr'),
        walletLeftConnect         = $('#wallet-left-connect'),
        contactsRightConnect      = $('#contacts-right-connect'),
        newContactAddress         = $('#new-contact-address'),
        newContactNickname        = $('#new-contact-nickname'),
        confirmNewContactButton   = $('#confirm-add-contact'),
        addNewContactButton       = $('#add-new-contact'),
        addNewExpenseButton       = $('#add-new-expense'),
        expenseAddNoteButton      = $('#expense-add-notes'),
        expenseSplitButton        = $('#expense-bill-split'),
        confirmExpenseSplitButton = $('#confirm-expense-split'),
        confirmNewExpenseButton   = $('#confirm-add-expense'),
        confirmAddNotesButton     = $('#confirm-add-notes'),
        cancelAddNotesButton      = $('#cancel-add-notes');

  const walletBeforeConnect      = $('#wallet-before-connect'),
        walletConnect            = $('#wallet-connect'),
        walletAfterConnect       = $('#wallet-after-connect'),
        contactsBeforeConnect    = $('#contacts-before-connect'),
        contactsConnect           = $('#contacts-connect'),
        contactsAfterConnect     = $('#contacts-after-connect'),
        expensesAfterConnect     = $('#expenses-after-connect');

  const walletAddreses      = $('#eth-addresses'),
        expenseCurrencies   = $('#expense-supported-currencies'),
        expenseContacts     = $('#expense-contacts'),
        expenseCalendar     = $('#expense-calendar'),
        expenseDatepicker   = $('#expense-datepicker'),
        expenseNotes        = $('#expense-notes'),
        expenseAmount       = $('#expense-amount'),
        expenseDescription  = $('#expense-description'),
        amountContactOwe    = $('#amount-contact-owe'),
        amountYouOwe        = $('#amount-you-owe');

  const walletConnectDialog = $('#wallet-connect-dialog'),
        addContactDialog    = $('#add-contact-dialog'),
        addExpenseDialog    = $('#add-expense-dialog'),
        expenseNotesDialog  = $('#add-expense-notes-dialog'),
        expenseSplitDialog  = $('#expense-split-dialog');

  const contactsDisplayHandler = (contacts) => {
    const names = contacts.filter(e => e.hasOwnProperty('nickname')).map(e => e.nickname);
    contactsList = contacts;

    try {
      expenseContacts.autocomplete({
        source: names
      });
    } catch (err) {
      console.log(err);
    }

    let options = '<option value="' + address + '">YOU</option>';
    let rows = '';
    for (let i in contacts) {
      const contactName = contacts[i].nickname;
      const contactAddress = contacts[i].address;
      const row = '<div class="row">\
                    <div class="col-md-3">\
                      <i class="fas fa-user-circle" style="font-size:3em;color:#17a2b8;"></i>\
                    </div>\
                    <div class="col-md-6" style="text-align:left;padding-left:0 !important">'
                     + contactName +
                    '</div>\
                    <div class="col-md-3">\
                      <input type="hidden" class="contact-name" value="' + contactName + '" />\
                      <input type="hidden" class="contact-address" value="' + contactAddress + '" />\
                      <i class="fas fa-times-circle" style="cursor:pointer;color:#17a2b8;" title="Delete contact"></i>\
                    </div>\
                  </div>';

      rows += row;
    }

    contactsAfterConnect.find('.container-fluid').html(rows);
  }
  const walletDisplayHandler = (tokens) => {
    let options = '';
    let rows = '';
    for (let i in tokens) {
      const tokenName = tokens[i].token;
      const tokenBalance = tokens[i].balance;
      const logo = tokens[i].logo !== "" ?
                      '<img width="28" height="28" src="' + tokens[i].logo + '" />' :
                      '<svg width="28" height="28">\
                        <circle cx="14" cy="14" r="14" fill="#12131f"></circle>\
                      </svg>';

      const row = '<div class="row">\
                    <div class="col-md-2">'
                      + logo +
                    '</div>\
                    <div class="col-md-7">\
                      <div style="font-size:11px;">'
                        + tokenName +
                      '</div>\
                      <div style="font-weight:bold;">'
                        + tokenBalance +
                      '</div>\
                    </div>\
                    <div class="col-md-3">\
                      <svg width="40" height="28">\
                        <rect width="40" height="14" fill="#12131f"></rect>\
                      </svg>\
                    </div>\
                  </div>';

      rows += row;

      const option = '<option value="' + tokenName + '">' + tokenName + '</option>';
      options += option;
    }
    rows += '<div class="row"></div>';

    const walletLogo = '<i class="fas fa-wallet" style="color:#17a2b8"></i>';

    const addressDisplay = address.substr(0, 5) + '...' + address.substr(37);
    const html = '<div class="container-fluid" \
                    style="margin:0px !important;padding:0px !important;">\
                    <div class="row row-header" \
                      style="height:50px !important;padding:0 !important;margin:0 !important;">\
                      <div class="col-md-2">'
                      + walletLogo +
                      '</div>\
                      <div class="col-md-7" style="color:#17a2b8;">'
                        + addressDisplay +
                      '</div>\
                      <div class="col-md-3">&nbsp;</div>\
                    </div>\
                    <div id="wallet-erc20-display">'
                    + rows +
                    '</div>\
                  </div>';

    walletAfterConnect.html(html);

    const el = new SimpleBar(walletAfterConnect.find('#wallet-erc20-display')[0]);

    expenseCurrencies.html(options);
  }
  const walletConnectHandler = async (e) => {
    try {
      const addrs = await Wallet.walletButtonClick(e);
      let select = '';
      for (addr of addrs) {
        select += '<option value="' + addr + '">' + addr + '</option>';
      }
      walletAddreses.html(select);

      walletConnectDialog.modal('show');
    } catch (err) {
      alert(err.message);
    }
  };
  const walletConnectConfirmHandler = async (btn) => {
    const loadingText = '<i class="fas fa-spinner fa-spin"></i>&nbsp;Confirming...';
    btn.data('original-text', btn.html());
    btn.html(loadingText);

    address = walletAddreses.val();
    network = await Wallet.getNetwork();
    const message = 'Signing this message proves to us you are in control of your account while never storing any sensitive account information.';

    try {
      if (await Session.login(address, message)) {
        const tokens = Wallet.getWalletBalance(address, await network);
        walletDisplayHandler(await tokens);

        const contacts = Contacts.loadContacts(address);
        contactsDisplayHandler(await contacts);

        const addressDisplay = address.substr(0, 5) + '...' + address.substr(37);
        walletAddressDisplay.text(addressDisplay);
        walletConnectDialog.modal('hide');
        walletBeforeConnect.fadeOut();
        walletConnect.fadeOut();
        walletAfterConnect.fadeIn();

        walletLoginButton.fadeOut();
        walletLogoutButton.css('display', 'flex').hide().fadeIn(500, () => btn.html(btn.data('original-text')));

        contactsBeforeConnect.fadeOut();
        contactsConnect.fadeOut();
        contactsAfterConnect.fadeIn();

        expensesAfterConnect.fadeIn();
      } else {
        btn.html(btn.data('original-text'));
      }
    } catch (err) {
      btn.html(btn.data('original-text'));
      alert(err);
    }
  };
  const walletLogoutHandler = () => {
    if (confirm("Are you sure you want to logout?")) {
      walletAfterConnect.fadeOut();
      walletBeforeConnect.fadeIn();
      walletConnect.fadeIn();
      walletLogoutButton.fadeOut();
      walletLoginButton.css('display', 'flex').hide().fadeIn();

      contactsAfterConnect.fadeOut();
      contactsConnect.fadeIn();
      contactsBeforeConnect.fadeIn();

      expensesAfterConnect.fadeOut();
    }
  };
  const addNewContactHandler = async (btn) => {
    // Validate the fields.
    try {
      Contacts.validateNewContactFields(newContactAddress.val(), newContactNickname.val());

      if (newContactAddress.val().trim() === address) {
        throw new Error('Contact address cannot be as same as your address!');
      }
    } catch (err) {
      alert(err.message);
      return;
    }

    const loadingText = '<i class="fas fa-spinner fa-spin"></i>&nbsp;Adding...';
    btn.data('original-text', btn.html());
    btn.html(loadingText);

    // Add the new contact.
    try {
      await Contacts.addNewContact({
        contact_address: newContactAddress.val(),
        contact_nickname: newContactNickname.val(),
        address: address
      });
    } catch (err) {
      btn.html(btn.data('original-text'))
      alert(err.message);
      return;
    }

    // Send an invite to the contact.
    if (confirm("Do you want to invite this contact through an ETH transaction (gas costs included)?")) {
      const rawTransaction = {
        "from": address,
        "to": newContactAddress.val(),
        "data": window.web3.utils.toHex(config.app.url),
        "gas": 200000
      };
      try {
        await window.web3.eth.sendTransaction(rawTransaction);
      } catch(err) {}
    }

    // Load all the contacts
    try {
      const contacts = Contacts.loadContacts(address);
      contactsDisplayHandler(await contacts);
    } catch (err) {}

    btn.html(btn.data('original-text'));
    addContactDialog.modal('hide');
  };
  const deleteContactHandler = async (ele) => {
    const contactAddress = $(ele).parent().find('.contact-address').val();
    const contactName = $(ele).parent().find('.contact-name').val();

    try {
      if (confirm('Are you sure you want to delete ' + contactName + ' from your contacts?')) {
        await Contacts.deleteContact({address: address, contactAddress: contactAddress});

        // Load the contacts.
        const contacts = Contacts.loadContacts(address);
        contactsDisplayHandler(await contacts);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const expenseSplitEquallyHandler = () => {
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
  };
  const expenseSplitUnequallyHandler = () => {
    // Reset the form.
    expenseSplitDialog.find('input[type="text"]').val('');
    expenseSplitDialog.find('.split-third-col').hide();
    expenseSplitDialog.find('.split-unequally-third-col').show();
    expenseSplitDialog.find('select').val('2');
    amountContactOwe.html('0.00');
    amountYouOwe.html('0.00');
    expenseSplitDialog.find('#amount-now').html('0.00');
  };
  const expenseSplitUnequallyChangeHandler = () => {
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
  };
  const expenseSplitPercentageHandler = () => {
    // Reset the form.
    expenseSplitDialog.find('input[type="text"]').val('');
    expenseSplitDialog.find('.split-third-col').hide();
    expenseSplitDialog.find('.split-percentage-third-col').show();
    expenseSplitDialog.find('select').val('3');
    amountContactOwe.html('0');
    amountYouOwe.html('0');
    expenseSplitDialog.find('#amount-now').html('0');
  };
  const expenseSplitPercentageChangeHandler = () => {
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
  };
  const expenseSplitConfirmHandler = () => {
    const amountGot = parseFloat(expenseSplitDialog.find('#amount-now').html()).toFixed(2);
    const amountExpected = parseFloat(expenseSplitDialog.find('#amount-full').html()).toFixed(2);

    if (amountGot !== amountExpected) {
      alert('Expected amount = ' + amountGot + ' do not match ' + amountExpected);
      return;
    }

    expenseSplitDialog.modal('hide');
  };
  const confirmNewExpenseHandler = () => {
    if (expenseContacts.val().trim().length === 0) {
      expenseContacts.css('border-color', 'red').focus();
      return;
    }
    const contactsCheck = contactsList.filter(e => e.hasOwnProperty('nickname')).map(e => e.nickname);
    if (!contactsCheck.includes(expenseContacts.val())) {
      expenseContacts.val('').css('border-color', 'red').focus();
      return;
    }
    const contactAddress = contactsList.filter(e => e.nickname === expenseContacts.val()).map(e => e.address)[0];

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

    if (confirm('Are you sure you want to add this expense?')) {
      // Create the JSON object of the expense.
      const expense = {
        address: address,
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
      console.log(expense);
      addExpenseDialog.modal('hide');
    }
  };

  walletLoginButton.on('click', async (e) => walletConnectHandler(e));
  walletLeftConnect.on('click', async (e) => walletConnectHandler(e));
  contactsRightConnect.on('click', async (e) => walletConnectHandler(e));
  confirmAddrButton.on('click', () => walletConnectConfirmHandler(confirmAddrButton));
  walletLogoutButton.on('click', walletLogoutHandler);

  confirmNewContactButton.on('click', () => addNewContactHandler(confirmNewContactButton));
  addNewContactButton.on('click', () => addContactDialog.modal('show'));
  addNewExpenseButton.on('click', () => {
    expenseContacts.val('');
    addExpenseDialog.modal('show');
  });
  contactsAfterConnect.on('click', '.fa-times-circle', (e) => deleteContactHandler(e.target));

  expenseAddNoteButton.on('click', () => expenseNotesDialog.modal('show'));
  expenseSplitButton.on('click', () => {
    const amount = expenseAmount.val();
    if (amount != '') {
      if (isNaN(amount) || !/^([1-9]\d*|0)?(\.\d+)?$/.test(amount)) {
        expenseAmount.focus();
        return;
      }
    }
    expenseSplitDialog.modal('show');
  });
  confirmExpenseSplitButton.on('click', expenseSplitConfirmHandler);
  confirmNewExpenseButton.on('click', confirmNewExpenseHandler);

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

  $('.modal').on('show.bs.modal', function(event) {
    var idx = $('.modal:visible').length;
    $(this).css('z-index', 1040 + (10 * idx));
  });
  $('.modal').on('shown.bs.modal', function(event) {
      var idx = ($('.modal:visible').length) -1; // raise backdrop after animation.
      $('.modal-backdrop').not('.stacked').css('z-index', 1039 + (10 * idx));
      $('.modal-backdrop').not('.stacked').addClass('stacked');
  });

  addExpenseDialog.on('shown.bs.modal', () => {
    expenseContacts.focus();
    addExpenseDialog.find('input[type="text"]').val('');
    expenseNotesDialog.find('input[type="text"]').val('');
    expenseSplitDialog.find('select').prepend('<option value="0" selected></option>');
  });
  expenseNotesDialog.on('shown.bs.modal', () => {
    expenseNotes.focus();
  });
  expenseSplitDialog.on('shown.bs.modal', expenseSplitEquallyHandler);

  expenseContacts.on('input', () => expenseContacts.css('border-color', '#000'));
  expenseSplitDialog.find('select').on('change', function() {
    const val = $(this).val();
    switch (val) {
      case '1':
        expenseSplitEquallyHandler();
        break;
      case '2':
        expenseSplitUnequallyHandler();
        break;
      case '3':
        expenseSplitPercentageHandler();
        break;
    }
  });
  expenseSplitDialog.find('#contact-owe-textbox').on('input', expenseSplitUnequallyChangeHandler);
  expenseSplitDialog.find('#you-owe-textbox').on('input', expenseSplitUnequallyChangeHandler);
  expenseSplitDialog.find('#contact-owe-percentage-textbox').on('input', expenseSplitPercentageChangeHandler);
  expenseSplitDialog.find('#you-owe-percentage-textbox').on('input', expenseSplitPercentageChangeHandler);
  expenseSplitDialog.on('change', 'input[type=checkbox]', expenseSplitEquallyHandler);
  cancelAddNotesButton.on('click', () => expenseNotes.val(''));
  confirmAddNotesButton.on('click', () => expenseNotesDialog.modal('hide'));
});
