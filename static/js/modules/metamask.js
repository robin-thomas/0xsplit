const Web3New = require('web3');
const contracts = require('./contracts.json');
const contractABI = require('./abi.json');
const logos = require('./tokens.json');

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

  walletButtonClick: async (e) => {
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
  },

  personalSign: (address, message) => {
    return new Promise((resolve, reject) => {
      const opts = {
        id: 1,
        method: 'personal_sign',
        params: [address, message]
      };

      window.web3.currentProvider.sendAsync(opts, (err, result) => {
        if (!err) {
          resolve(result.result);
        } else {
          reject(err);
        }
      });
    });
  },

  getWalletBalance: async (address, network) => {
    let tokens = [];
    let balance = await window.web3.eth.getBalance(address);
    tokens.push({token: "ETH", balance: (balance / Math.pow(10, 18)), logo: logos["ETH"]});

    // Loop through all supported ERC20 tokens.
    const contractAddresses = contracts[network];
    for (const token of Object.keys(contractAddresses)) {
      const tokenContract = new window.web3.eth.Contract(contractABI, contractAddresses[token]);

      try {
        const balance = await tokenContract.methods.balanceOf(address).call();
        const decimals = await tokenContract.methods.decimals().call();

        const adjustedBalance = balance / Math.pow(10, decimals);
        if (typeof logos[token] !== 'undefined') {
          tokens.push({token: token, balance: adjustedBalance, logo: logos[token]});
        } else {
          tokens.push({token: token, balance: adjustedBalance, logo: ""});
        }

      } catch (err) {
        throw err;
      }
    }

    return tokens;
  },

  getNetwork: async () => {
    try {
      const network = await window.web3.eth.net.getNetworkType();
      return network;
    } catch (err) {
      throw new Error('Unable to determine the network!');
    }
  }
};

module.exports = Metamask;
