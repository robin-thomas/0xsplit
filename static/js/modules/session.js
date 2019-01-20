const fetch = require('node-fetch');
const Url = require('url');
const Metamask = require('./metamask.js');
const config = require('../../../config.json');

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

const setToken = (headers) => {
  headers = JSON.stringify(headers);
  headers = headers.replace('%token', Session.token);
  return JSON.parse(headers);
};

const Session = {
  token: null,

  login: async (address, message) => {
    try {
      const sig = await Metamask.personalSign(address, message);
      if (typeof sig !== 'undefined') {
        Session.token = await getToken(message, sig, address);
        return await Session.testToken(address);
      }
    } catch (err) {
      throw err;
    }
  },

  api: async (apiName, data) => {
    try {
      const headers = setToken(config.api[apiName].headers);

      let url = config.api[apiName].path;
      if (config.api[apiName].method === 'GET') {
        //url.search = new URLSearchParams(data);
        url += Url.format({query: data});
      }

      const ret = await fetch(url, {
        method: config.api[apiName].method,
        headers: headers,
        body: config.api[apiName].method !== 'GET' ? JSON.stringify(data) : undefined,
      });

      const json = await ret.json();
      if (json.status !== 'ok') {
        throw new Error(apiName + ' failed: ' + json.msg);
      }
      return json.msg;
    } catch (err) {
      throw err;
    }
  },

  testToken: async (address) => {
    try {
      const headers = setToken(config.api.test.headers);

      const ret = await fetch(config.api.test.path, {
        method: config.api.test.method,
        headers: headers,
        body: JSON.stringify({address: address}),
      });

      const json = await ret.json();
      return json.status === "ok";
    } catch (err) {
      throw err;
    }
  },

  logout: () => {
    Session.token = null;
  },
};

module.exports = Session;
