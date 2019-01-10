const Web3New = require('web3');

const Metamask = {
  hasMetamask: () => {
    return window.web3 && window.web3.currentProvider.isMetaMask;
  },

  loadWeb3: async () => {
    if (window.ethereum) {
      window.web3 = new Web3New(ethereum);

      try {
        await window.ethereum.enable();
      } catch (err) {
        throw new Error('User has denied access to eth account!');
      }
    } else if (window.web3) {
      window.web3 = new Web3New(window.web3.currentProvider);
    } else {
      throw new Error('Non-Ethereum browser detected. Use MetaMask!');
    }
  },

  WalletButtonClick: async (e) => {
    e.preventDefault();

    if (Metamask.hasMetamask()) {
      try {
        await Metamask.loadWeb3();
      } catch (err) {
        alert(err.message);
      }
    }
  }
};

module.exports = Metamask;
