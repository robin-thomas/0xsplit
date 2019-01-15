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
        newContactAddress       = $('#new-contact-address'),
        newContactNickname      = $('#new-contact-nickname'),
        confirmNewContactButton = $('#confirm-add-contact'),
        addNewContactButton     = $('#add-new-contact');

  const walletBeforeConnect      = $('#wallet-before-connect'),
        walletConnect            = $('#wallet-connect'),
        walletAfterConnect       = $('#wallet-after-connect'),
        contactsBeforeConnect    = $('#contacts-before-connect'),
        contactsAfterConnect     = $('#contacts-after-connect');

  const walletAddreses = $('#eth-addresses');

  const walletConnectDialog = $('#wallet-connect-dialog'),
        addContactDialog    = $('#add-contact-dialog');

  const contactsDisplayHandler = (contacts) => {
    let rows = '';
    for (let i in contacts) {
      const contactName = contacts[i].nickname;
      const contactAddress = contacts[i].address;
      const row = '<div class="row">\
                    <div class="col-md-2">\
                      <svg width="28" height="28">\
                        <circle cx="14" cy="14" r="14" fill="#12131f"></circle>\
                      </svg>\
                    </div>\
                    <div class="col-md-7">'
                     + contactName +
                    '</div>\
                    <div class="col-md-3"></div>\
                  </div>';

      rows += row;
    }

    contactsAfterConnect.find('.container-fluid').html(rows);
  }
  const walletDisplayHandler = (tokens) => {
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
                      <svg width="60" height="28">\
                        <rect width="50" height="14" fill="#12131f"></rect>\
                      </svg>\
                    </div>\
                  </div>';

      rows += row;
    }
    rows += '<div class="row"></div>';

    const walletLogo = '<svg width="28" height="28">\
      <circle cx="14" cy="14" r="14" fill="#12131f"></circle>\
    </svg>';

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
    const loadingText = '<i class="fa fa-circle-o-notch fa-spin"></i>&nbsp;Confirming...';
    btn.data('original-text', btn.html());
    btn.html(loadingText);

    address = walletAddreses.val();
    network = Wallet.getNetwork();
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

        contactsBeforeConnect.fadeOut(600, () => contactsAfterConnect.fadeIn());
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

    const loadingText = '<i class="fa fa-circle-o-notch fa-spin"></i>&nbsp;Adding...';
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

  walletLoginButton.on('click', async (e) => walletConnectHandler(e));
  walletLeftConnect.on('click', async (e) => walletConnectHandler(e));
  confirmAddrButton.on('click', () => walletConnectConfirmHandler(confirmAddrButton));
  walletLogoutButton.on('click', walletLogoutHandler);

  confirmNewContactButton.on('click', () => addNewContactHandler(confirmNewContactButton));
  addNewContactButton.on('click', () => addContactDialog.modal('show'));
});
