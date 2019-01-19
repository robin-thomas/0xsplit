const Wallet = require('./modules/metamask.js');
const Session = require('./modules/session.js');
const Contacts = require('./modules/contacts.js');
const config = require('../../config.json');

let token = null;
let address = null;

$(document).ready(() => {
  const walletLoginButton       = $('#wallet-login-button'),
        walletLogoutButton      = $('#wallet-logout-button'),
        walletAddressDisplay    = walletLogoutButton.find('.wallet-label-bottom'),
        confirmAddrButton       = $('#confirm-eth-addr'),
        walletLeftConnect       = $('#wallet-left-connect'),
        contactsRightConnect     = $('#contacts-right-connect'),
        newContactAddress       = $('#new-contact-address'),
        newContactNickname      = $('#new-contact-nickname'),
        confirmNewContactButton = $('#confirm-add-contact'),
        addNewContactButton     = $('#add-new-contact'),
        addNewExpenseButton     = $('#add-new-expense'),
        expenseAddNoteButton    = $('#expense-add-notes'),
        expenseSplitButton  = $('#expense-bill-split');

  const walletBeforeConnect      = $('#wallet-before-connect'),
        walletConnect            = $('#wallet-connect'),
        walletAfterConnect       = $('#wallet-after-connect'),
        contactsBeforeConnect    = $('#contacts-before-connect'),
        contactsConnect           = $('#contacts-connect'),
        contactsAfterConnect     = $('#contacts-after-connect'),
        expensesAfterConnect     = $('#expenses-after-connect');

  const walletAddreses    = $('#eth-addresses'),
        expenseCurrencies = $('#expense-supported-currencies'),
        expenseContacts   = $('#expense-contacts'),
        expenseCalendar   = $('#expense-calendar'),
        expenseDatepicker = $('#expense-datepicker'),
        expenseNotes      = $('#expense-notes'),
        amountContactOwe  = $('#amount-contact-owe'),
        amountYouOwe      = $('#amount-you-owe');

  const walletConnectDialog = $('#wallet-connect-dialog'),
        addContactDialog    = $('#add-contact-dialog'),
        addExpenseDialog    = $('#add-expense-dialog'),
        expenseNotesDialog  = $('#add-expense-notes-dialog'),
        expenseSplitDialog  = $('#expense-split-dialog');

  const contactsDisplayHandler = (contacts) => {
    let names = [];
    for (const i in contacts) {
      names.push(contacts[i].nickname);
    }

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

      // const option = '<option value="' + contactAddress + '">' + contactName + '</option>';
      // options += option;
    }

    contactsAfterConnect.find('.container-fluid').html(rows);
    // expenseContacts.html(options);
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
                      <div style="width:60px;height:14px;font-size:11px;">'
                        + tokenName +
                      '</div>\
                      <div style="width:30px;height:28px;font-weight:bold;">'
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
                      <div class="col-md-7">'
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
  };
  const expenseSplitUnequallyChangeHandler = () => {
    const doesYouOwe = $('#you-owe-textbox').val() != $('#you-owe-textbox').attr('placeholder');
    const doesContactOwe = $('#contact-owe-textbox').val() != $('#you-owe-textbox').attr('placeholder');

    let amountYou = 0.00;
    if (doesYouOwe) {
      amountYou = parseFloat($('#you-owe-textbox').val());
    }
    let amountContact = 0.00;
    if (doesContactOwe) {
      amountContact = parseFloat($('#contact-owe-textbox').val());
    }
    const amountNow = (amountContact + amountYou);

    amountContactOwe.html(amountContact);
    amountYouOwe.html(amountYou);
    expenseSplitDialog.find('#amount-now').html(amountNow);
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
  expenseSplitButton.on('click', () => expenseSplitDialog.modal('show'));

  $('#datetimepicker1').datetimepicker({
    icons: {
        time: "fa fa-clock-o",
        date: "fa fa-calendar",
        up: "fa fa-arrow-up",
        down: "fa fa-arrow-down"
    }
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
  });
  expenseNotesDialog.on('shown.bs.modal', () => {
    expenseNotes.focus();
  });
  expenseSplitDialog.on('shown.bs.modal', expenseSplitEquallyHandler);

  expenseSplitDialog.find('select').on('change', function() {
    const val = $(this).val();
    switch (val) {
      case '1':
        expenseSplitEquallyHandler();
        break;
      case '2':
        expenseSplitUnequallyHandler();
        break;
    }
  });
  expenseSplitDialog.find('#contact-owe-textbox').on('input', expenseSplitUnequallyChangeHandler);
  expenseSplitDialog.find('#you-owe-textbox').on('input', expenseSplitUnequallyChangeHandler);

  expenseSplitDialog.on('change', 'input[type=checkbox]', expenseSplitEquallyHandler);

  // addExpenseDialog.modal('show');
});
