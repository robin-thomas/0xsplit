const Cookies = require('../cookies.js');
const Contacts = require('../contacts.js');
const ContactsHandler = require('./contacts.js');
const Expenses = require('../expenses.js');
const Session = require('../session.js');
const Wallet = require('../metamask.js');

const contactsBeforeConnect = $('#contacts-before-connect'),
      contactsConnect       = $('#contacts-connect'),
      contactsAfterConnect  = $('#contacts-after-connect'),
      expensesAfterConnect  = $('#expenses-after-connect'),
      expenseCurrencies     = $('#expense-supported-currencies'),
      walletAddreses        = $('#eth-addresses'),
      walletAfterConnect    = $('#wallet-after-connect'),
      walletBeforeConnect   = $('#wallet-before-connect'),
      walletConnect         = $('#wallet-connect'),
      walletLoginButton     = $('#wallet-login-button'),
      walletLogoutButton    = $('#wallet-logout-button'),
      walletAddressDisplay  = walletLogoutButton.find('.wallet-label-bottom');

const expenseNotesDialog  = $('#add-expense-notes-dialog'),
      walletConnectDialog = $('#wallet-connect-dialog');

const WalletHandler = {
  walletDisplayHandler: (tokens) => {
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

    const addressDisplay = Wallet.address.substr(0, 5) + '...' + Wallet.address.substr(37);
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
    el.recalculate();

    expenseCurrencies.html(options);
  },
  walletConnectHandler: async (e) => {
    try {
      const addrs = await Wallet.walletButtonClick(e);
      let select = '';
      for (const addr of addrs) {
        select += '<option value="' + addr + '">' + addr + '</option>';
      }
      walletAddreses.html(select);

      walletConnectDialog.modal('show');
    } catch (err) {
      alert(err.message);
    }
  },
  walletConnectConfirmHandler: async (btn) => {
    const isLoggedIn = Cookies.isLoggedIn();
    if (!isLoggedIn && !btn) {
      $('#header').fadeIn();
      $('#content').fadeIn();
      $('#footer').fadeIn();
      return;
    }

    if (!isLoggedIn) {
      const loadingText = '<i class="fas fa-spinner fa-spin"></i>&nbsp;Confirming...';
      btn.data('original-text', btn.html());
      btn.html(loadingText);
    } else {
      await Wallet.loadWeb3();
    }

    Wallet.address = isLoggedIn ? Cookies.address : walletAddreses.val();
    const network = Wallet.getNetwork();
    const message = 'Signing this message proves to us you are in control of your account while never storing any sensitive account information.';

    try {
      if (isLoggedIn || await Session.login(Wallet.address, message)) {
        if (isLoggedIn) {
          $('#cookie-login-loading').fadeIn();
        }

        const tokens = Wallet.getWalletBalance(Wallet.address, await network);
        WalletHandler.walletDisplayHandler(await tokens);

        ContactsHandler.contactsList = await Contacts.loadContacts(Wallet.address);
        ContactsHandler.contactsDisplayHandler();

        console.log(await Expenses.searchExpenses(Wallet.address));

        const addressDisplay = Wallet.address.substr(0, 5) + '...' + Wallet.address.substr(37);
        walletAddressDisplay.text(addressDisplay);
        walletConnectDialog.modal('hide');
        walletBeforeConnect.fadeOut();
        walletConnect.fadeOut();
        walletAfterConnect.fadeIn();

        walletLoginButton.fadeOut();
        walletLogoutButton.css('display', 'flex').hide().fadeIn(500, () => {
          if (!isLoggedIn) {
            btn.html(btn.data('original-text'));
          }
        });

        contactsBeforeConnect.fadeOut();
        contactsConnect.fadeOut();
        contactsAfterConnect.fadeIn();
        expensesAfterConnect.fadeIn();

        if (!isLoggedIn) {
          Cookies.login(Wallet.address, Session.token);
        } else {
          $('#cookie-login-loading').fadeOut();
          $('#header').fadeIn();
          $('#content').fadeIn();
          $('#footer').fadeIn();
        }
      } else if (!isLoggedIn) {
        btn.html(btn.data('original-text'));
      }
    } catch (err) {
      btn.html(btn.data('original-text'));
      alert(err);
    }
  },
  walletLogoutHandler: () => {
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

      Cookies.logout();
    }
  },
  addNotesDisplayHandler: () => {
    expenseNotesDialog.modal('show')
  },
};

module.exports = WalletHandler;
