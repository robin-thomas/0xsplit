const Wallet = require('./modules/metamask.js');
const Session = require('./modules/session.js');

let token = null;

$(document).ready(() => {
  const walletLoginButton = $('#wallet-login-button'),
        confirmAddrButton = $('#confirm-eth-addr'),
        walletLeftConnect = $('#wallet-left-connect');

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

  walletLoginButton.on('click', async (e) => walletConnectHandler(e));
  walletLeftConnect.on('click', async (e) => walletConnectHandler(e));

  confirmAddrButton.on('click', async (e) => {
    const address = walletAddreses.val();
    const message = 'Signing this message proves to us you are in control of your account while never storing any sensitive account information.';

    try {
      if (await Session.login(address, message)) {
        walletConnectDialog.modal('hide');
      }
    } catch (err) {
      alert(err);
    }
  });
});
