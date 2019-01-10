const Metamask = require('./modules/metamask.js');

window.$ = require('jquery');

const walletButton = $('#wallet-login-button');

walletButton.on('click', Metamask.WalletButtonClick);
