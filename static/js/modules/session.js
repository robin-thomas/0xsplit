const fetch = require('node-fetch');
const Url = require('url');

const Metamask = require('./metamask.js');

const config = require('../../../config.json');

const cookieName = config.app.name;
const cookieExpiry = 30 * 24 * 60 * 60 * 1000; // 30 days
const cookieTerminator = '00000';

const getToken = async (msg, sig, address) => {
  try {
    const ret = await fetch(config.api.login.path, {
      method: config.api.login.method,
      body: JSON.stringify({msg: msg, sig: sig, address: address}),
      headers: config.api.login.headers,
    });

    const json = await ret.json();

    return {
      token: json.token,
      expiresIn: json.expiresIn,
      refreshToken: json.refreshToken
    };
  } catch (err) {
    throw err;
  }
};
const getTokenWithRefreshToken = async (address, refreshToken) => {
  if (refreshToken === null) {
    return;
  }

  try {
    const ret = await fetch(config.api.refresh.path, {
      method: config.api.refresh.method,
      body: JSON.stringify({
        address: address,
        refreshToken: refreshToken,
      }),
      headers: config.api.refresh.headers,
    });

    const json = await ret.json();

    return {
      token: json.token,
      expiresIn: json.expiresIn,
    };
  } catch (err) {
    throw err;
  }
};

const setToken = (headers) => {
  headers = JSON.stringify(headers);
  headers = headers.replace('%token', Session.token);
  return JSON.parse(headers);
};

const hasTokenExpired = () => {
  const currentTimestamp = new Date().getTime();
  const timestamp = new Date(Session.expiresIn).getTime();

  return (currentTimestamp < timestamp) ? false : true;
};

const updateTokenIfRequired = async (address) => {
  if (hasTokenExpired()) {
    console.log('token has expired');

    // Use the refresh token to update the token.
    try {
      const newSession = await getTokenWithRefreshToken(address, Session.refreshToken);
      Session.token = newSession.token;
      Session.expiresIn = newSession.expiresIn;

      // Update the cookie.
      let date = new Date();
      date.setTime(date.getTime() + cookieExpiry);
      const expires = ';expires=' + date.toUTCString();

      const name = cookieName + '=';
      const cookieStr = document.cookie.split(';');
      for (let i = 0; i < cookieStr.length; ++i) {
        const str = cookieStr[i].trim();
        if (str.indexOf(name) === 0) {
          const cookieValue = str.substring(name.length).split(cookieTerminator);

          const cookie = address + cookieTerminator +
                              Session.token + cookieTerminator +
                              Session.expiresIn + cookieTerminator + cookieValue[3];

          document.cookie = cookieName + '=' + cookie + expires + ';path=/';
        }
      }
    } catch (err) {
      throw err;
    }
  }
};

const Session = {
  address: null,
  token: null,
  expiresIn: null,
  refreshToken: null,

  login: async (address, message) => {
    try {
      const sig = await Metamask.personalSign(address, message);
      if (typeof sig !== 'undefined') {
        const newSession = await getToken(message, sig, address);
        Session.token = newSession.token;
        Session.expiresIn = newSession.expiresIn;
        Session.refreshToken = newSession.refreshToken;
        console.log(newSession);

        // Update cookie.
        let date = new Date();
        date.setTime(date.getTime() + cookieExpiry);
        const expires = ';expires=' + date.toUTCString();

        const cookieValue = address + cookieTerminator +
                            Session.token + cookieTerminator +
                            Session.expiresIn + cookieTerminator + Session.refreshToken;
        document.cookie = cookieName + '=' + cookieValue + expires + ';path=/';

        return await Session.testToken(address);
      }
    } catch (err) {
      throw err;
    }
  },

  api: async (apiName, data) => {
    try {
      await updateTokenIfRequired(data.address);

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
    Session.address = null;
    Session.token = null;
    Session.expiresIn = null;
    Session.refreshToken = null;
    document.cookie = cookieName + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC";';
  },

  isLoggedIn: () => {
    const name = cookieName + '=';
    const cookieStr = document.cookie.split(';');
    for (let i = 0; i < cookieStr.length; ++i) {
      const str = cookieStr[i].trim();
      if (str.indexOf(name) === 0) {
        const cookieValue = str.substring(name.length).split(cookieTerminator);
        Session.address = cookieValue[0];
        Session.token = cookieValue[1];
        Session.expiresIn = cookieValue[2];
        Session.refreshToken = cookieValue[3];

        console.log('Cookie found. Logging in...');

        return true;
      }
    }

    return false;
  },
};

module.exports = Session;
