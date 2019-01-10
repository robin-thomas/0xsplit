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
        console.log('already connected');

        return await Metamask.getAddress();
      } catch (err) {
        throw new Error('User has denied access to eth account!');
      }
    } else if (window.web3) {
      throw new Error('Update Metamask!');
    } else {
      throw new Error('Non-Ethereum browser detected. Use MetaMask!');
    }
  },

  WalletButtonClick: async (e) => {
    e.preventDefault();

    if (Metamask.hasMetamask()) {
      try {
        return await Metamask.loadWeb3();
      } catch (err) {
        throw err;
      }
    }
  },

  getAddress: async () => {
    try {
      return await window.web3.eth.getAccounts();
    } catch (err) {
      throw err;
    }
  }
};

module.exports = Metamask;
