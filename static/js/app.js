const Wallet = require('./modules/metamask.js');
const Session = require('./modules/session.js');

let token = null;

$(document).ready(() => {
  const walletLoginButton    = $('#wallet-login-button'),
        walletLogoutButton   = $('#wallet-logout-button'),
        walletAddressDisplay = walletLogoutButton.find('.wallet-label-bottom'),
        confirmAddrButton    = $('#confirm-eth-addr'),
        walletLeftConnect    = $('#wallet-left-connect');

  const walletBeforeConnect = $('#wallet-before-connect'),
        walletConnect       = $('#wallet-connect'),
        walletAfterConnect  = $('#wallet-after-connect');

  const walletAddreses = $('#eth-addresses');

  const walletConnectDialog = $('#wallet-connect-dialog');

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
  const walletConnectConfirmHandler = async (e) => {
    const address = walletAddreses.val();
    const message = 'Signing this message proves to us you are in control of your account while never storing any sensitive account information.';

    try {
      if (await Session.login(address, message)) {
        const addressDisplay = address.substr(0, 5) + '...' + address.substr(37);
        walletAddressDisplay.text(addressDisplay);
        walletConnectDialog.modal('hide');
        walletBeforeConnect.fadeOut();
        walletConnect.fadeOut();
        walletAfterConnect.fadeIn();

        walletLoginButton.fadeOut();
        walletLogoutButton.css('display', 'flex').hide().fadeIn();
      }
    } catch (err) {
      alert(err);
    }
  };

  walletLoginButton.on('click', async (e) => walletConnectHandler(e));
  walletLeftConnect.on('click', async (e) => walletConnectHandler(e));
  confirmAddrButton.on('click', async (e) => walletConnectConfirmHandler(e));
});
