const Contacts = require('../contacts.js');
const ContactsHandler = require('./contacts.js');
const ExpensesHandler = require('./expenses.js');
const OrdersHandler = require('./orders.js');
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
  walletDisplayHandler: () => {
    let options = '';
    for (const token of ExpensesHandler.tokensList) {
      options += '<option value="' + token.token + '">' + token.token + '</option>';
    }
    expenseCurrencies.html(options);
    $('.token-swap-select').html(options);
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
    const isLoggedIn = Session.isLoggedIn();
    if (!isLoggedIn && !btn) {
      $('#cookie-login-loading').fadeOut();
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

    Wallet.address = isLoggedIn ? Session.address : walletAddreses.val();
    const network = Wallet.getNetwork();
    const message = 'Signing this message proves to us you are in control of your account while never storing any sensitive account information.';

    try {
      if (isLoggedIn || await Session.login(Wallet.address, message)) {
        if (isLoggedIn) {
          $('#cookie-login-loading').fadeIn();
        }

        ExpensesHandler.tokensList = await Wallet.getWalletBalance(Wallet.address, await network);
        WalletHandler.walletDisplayHandler();

        await OrdersHandler.orderDisplayHandler();

        Wallet.getTokensExchangeRate();

        ContactsHandler.contactsList = await Contacts.loadContacts(Wallet.address);
        ContactsHandler.contactsDisplayHandler();

        await ExpensesHandler.loadNextBatch();

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

        if (isLoggedIn) {
          $('#cookie-login-loading').fadeOut();
          $('#header').fadeIn();
          $('#content').fadeIn();
          $('#footer').fadeIn();
        }
      } else if (!isLoggedIn) {
        btn.html(btn.data('original-text'));
      }
    } catch (err) {
      if (!isLoggedIn) {
        btn.html(btn.data('original-text'));
      }

      if (err.message === 'unable to verify the refresh token') {
        WalletHandler.logout();
        return;
      }

      console.log(err);
      alert(err.message);
    }
  },
  walletLogoutHandler: () => {
    if (confirm("Are you sure you want to logout?")) {
      WalletHandler.logout();
    }
  },
  addNotesDisplayHandler: () => {
    expenseNotesDialog.modal('show')
  },
  logout: () => {
    walletAfterConnect.fadeOut();
    walletBeforeConnect.fadeIn();
    walletConnect.fadeIn();
    walletLogoutButton.fadeOut();
    walletLoginButton.css('display', 'flex').hide().fadeIn();

    contactsAfterConnect.fadeOut();
    contactsConnect.fadeIn();
    contactsBeforeConnect.fadeIn();

    expensesAfterConnect.fadeOut();

    Session.logout();
  }
};

module.exports = WalletHandler;
