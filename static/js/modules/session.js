const fetch = require('node-fetch');
const Metamask = require('./metamask.js');
const config = require('../../../config.json');

let token = null;

const getToken = async (msg, sig, address) => {
  try {
    const ret = await fetch(config.api.login.path, {
      method: config.api.login.method,
      body: JSON.stringify({msg: msg, sig: sig, address: address}),
      headers: config.api.login.headers,
    });

    return (await ret.json()).token;
  } catch (err) {
    throw err;
  }
};

const Session = {
  login: async (address, message) => {
    try {
      const sig = await Metamask.personalSign(address, message);
      if (typeof sig !== 'undefined') {
        token = await getToken(message, sig, address);
        console.log(token);
        return true;
      }
    } catch (err) {
      throw err;
    }
  },

  logout: () => {
    token = null;
  },
};

module.exports = Session;
