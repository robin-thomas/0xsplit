const Wallet = require('./modules/metamask.js');
const Session = require('./modules/session.js');

let token = null;
let address = null;

$(document).ready(() => {
  const walletLoginButton    = $('#wallet-login-button'),
        walletLogoutButton   = $('#wallet-logout-button'),
        walletAddressDisplay = walletLogoutButton.find('.wallet-label-bottom'),
        confirmAddrButton    = $('#confirm-eth-addr'),
        walletLeftConnect    = $('#wallet-left-connect');

  const walletBeforeConnect      = $('#wallet-before-connect'),
        walletConnect            = $('#wallet-connect'),
        walletAfterConnect       = $('#wallet-after-connect');

  const walletAddreses = $('#eth-addresses');

  const walletConnectDialog = $('#wallet-connect-dialog');

  const displayWallet = (tokens) => {
    let rows = '';
    for (let i in tokens) {
      const logo = '';
      const tokenName = tokens[i].token;
      const tokenBalance = tokens[i].balance;
      const row = '<div class="row">\
                    <div class="col-md-2">\
                      <svg width="28" height="28">\
                        <circle cx="14" cy="14" r="14" fill="#12131f"></circle>\
                      </svg>\
                    </div>\
                    <div class="col-md-7">\
                      <div style="width:60px;height:14px">'
                        + tokenName +
                      '</div>\
                      <br />\
                      <div style="width:30px;height:28px">'
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

    const html = '<div class="container-fluid">\
                    <div class="row row-header"></div>'
                    + rows +
                  '</div>';

    walletAfterConnect.html(html);
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
        displayWallet(await tokens);

        const addressDisplay = address.substr(0, 5) + '...' + address.substr(37);
        walletAddressDisplay.text(addressDisplay);
        walletConnectDialog.modal('hide');
        walletBeforeConnect.fadeOut();
        walletConnect.fadeOut();
        walletAfterConnect.fadeIn();

        walletLoginButton.fadeOut();
        walletLogoutButton.css('display', 'flex').hide().fadeIn(500, () => btn.html(btn.data('original-text')));
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

  walletLoginButton.on('click', async (e) => walletConnectHandler(e));
  walletLeftConnect.on('click', async (e) => walletConnectHandler(e));
  confirmAddrButton.on('click', () => walletConnectConfirmHandler(confirmAddrButton));
  walletLogoutButton.on('click', walletLogoutHandler);
});
