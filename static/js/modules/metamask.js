const Metamask = require('./modules/metamask.js');

$(document).ready(() => {
  const walletLoginButton = $('#wallet-login-button'),
        confirmAddrButton = $('#confirm-eth-addr');

  const walletAddreses = $('#eth-addresses');

  const walletConnectDialog = $('#wallet-connect-dialog');

  walletLoginButton.on('click', async (e) => {
    try {
      const addrs = await Metamask.walletButtonClick(e);
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

  confirmAddrButton.on('click', (e) => {
    console.log('click');
    walletConnectDialog.modal('hide');
  });
});
