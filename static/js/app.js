const Wallet = require('./modules/metamask.js');

$(document).ready(() => {
  const walletLoginButton = $('#wallet-login-button'),
        confirmAddrButton = $('#confirm-eth-addr');

  const walletAddreses = $('#eth-addresses');

  const walletConnectDialog = $('#wallet-connect-dialog');

  walletLoginButton.on('click', async (e) => {
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
  });

  confirmAddrButton.on('click', async (e) => {
    // Get the wallet address;
    const address = walletAddreses.val();
    const message = 'Signing this message proves to us you are in control of your account while never storing any sensitive account information.';

    // Sign using wallet
    try {
      const msg = await Wallet.personalSign(address, message);
      if (typeof msg !== 'undefined') {
        walletConnectDialog.modal('hide');
      }
    } catch (err) {
      alert(err);
    }
  });
});
