const Metamask = require('./modules/metamask.js');

$(document).ready(() => {
  const walletButton   = $('#wallet-login-button'),
        walletAddreses = $('#eth-addresses');

  walletButton.on('click', async (e) => {
    // Trigger the metamask popup.
    try {
      console.log('hello');

      const addrs = await Metamask.WalletButtonClick(e);
      console.log(addrs);
      let select = '';
      for (addr of addrs) {
        select += '<option value="' + addr + '">' + addr + '</option>';
      }
      walletAddreses.html(select);

      $('#wallet-connect-dialog').modal('show');
    } catch (err) {
      console.log(err.message);
    }
  });
});
