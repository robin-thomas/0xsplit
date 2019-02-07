const Web3New = require('web3');
const fetch = require('node-fetch');
const Url = require('url');

const config = require('../../../config.json');
const contracts = require('./config/contracts.json');
const contractABI = require('./config/abi.json');
const logos = require('./config/tokens.json');

const sleep = (ms) => {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

const Metamask = {
  tokenExchangeRateList: null,
  address: null,

  hasMetamask: () => {
    return window.web3 && window.web3.currentProvider.isMetaMask;
  },

  loadWeb3: async () => {
    if (window.ethereum) {
      window.web3 = new Web3New(window.ethereum);

      try {
        await window.ethereum.enable();

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
    } else {
      throw new Error('No Metamask detected in the browser!');
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

    // TODO: Add ETH when supported fully.
    // let balance = await window.web3.eth.getBalance(address);
    // tokens.push({token: "ETH", balance: (balance / Math.pow(10, 18)), logo: logos["ETH"]});

    // Loop through all supported ERC20 tokens.
    const contractAddresses = contracts[network];
    for (const token of Object.keys(contractAddresses)) {
      const tokenContract = new window.web3.eth.Contract(contractABI, contractAddresses[token]);

      try {
        const balance = await tokenContract.methods.balanceOf(address).call();
        const decimals = await tokenContract.methods.decimals().call();

        const adjustedBalance = balance / Math.pow(10, decimals);
        if (logos[token] !== undefined) {
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
  },

  getTokenBalanceAndLogo: async (token, address) => {
    try {
      const contractNetwork = contracts[await Metamask.getNetwork()];
      const tokenContract = new window.web3.eth.Contract(contractABI, contractNetwork[token]);
      const balance = await tokenContract.methods.balanceOf(address).call();
      const decimals = await tokenContract.methods.decimals().call();

      const adjustedBalance = balance / Math.pow(10, decimals);
      if (typeof logos[token] !== 'undefined') {
        return {
          balance: adjustedBalance,
          logo: logos[token]
        };
      } else {
        return {
          balance: adjustedBalance,
          logo: ""
        };
      }
    } catch (err) {
      console.log(err);
      throw err;
    }
  },

  makeERC20Txn: async (data) => {
    try {
      const contractAddress = contracts[await Metamask.getNetwork()][data.token];
      const contract = new window.web3.eth.Contract(contractABI, contractAddress, {
        from: data.from
      });

      // Calculate contract compatible value for transfer with proper decimal points using BigNumber
      const decimals = await contract.methods.decimals().call();
      const tokenDecimals = window.web3.utils.toBN(decimals);
      const tokenAmountToTransfer = window.web3.utils.toBN(data.amount);
      const calculatedTransferValue = window.web3.utils.toHex(tokenAmountToTransfer.mul(window.web3.utils.toBN(10).pow(tokenDecimals)));

      const result = await contract.methods.transfer(data.to, calculatedTransferValue).send({
        from: data.from,
      });
      return result;
    } catch (err) {
      console.log(err);
      throw err;
    }
  },

  getTokensExchangeRate: async () => {
    const contractAddresses = contracts[await Metamask.getNetwork()];
    const tokens = Object.keys(contractAddresses);

    let data = {};
    for (const token of tokens) {
      const url = config.crypto.api.compare + Url.format({
        query: {
          fsym: token,
          tsyms: tokens.join(','),
        },
      });

      const ret = await fetch(url, {
        method: 'GET',
      });
      const json = await ret.json();
      data[token] = json;

      await sleep(250 /* milliseconds */);
    }
    Metamask.tokenExchangeRateList = data;
  }
};

module.exports = Metamask;
