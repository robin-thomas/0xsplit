const Session = require('./session.js');

const config = require('../../../config.json');

const cookieName = config.app.name;
const cookieExpiry = 24 * 60 * 60 * 1000; // 24h
const cookieTerminator = '00000';

const Cookies = {
  address: null,
  isLoggedIn: () => {
    const name = cookieName + '=';
    const cookieStr = document.cookie.split(';');
    for (let i = 0; i < cookieStr.length; ++i) {
      const str = cookieStr[i].trim();
      if (str.indexOf(name) === 0) {
        const cookieValue = str.substring(name.length).split(cookieTerminator);
        Cookies.address = cookieValue[0];
        Session.token = cookieValue[1];
        return true;
      }
    }

    return false;
  },
  login: (address, jwt) => {
    let date = new Date();
    date.setTime(date.getTime() + cookieExpiry);
    const expires = ';expires=' + date.toUTCString();

    const cookieValue = address + cookieTerminator + jwt;

    document.cookie = cookieName + '=' + cookieValue + expires + ';path=/';
    Cookies.address = address;
  },
  logout: () => {
    document.cookie = cookieName + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC";';
    Cookies.address = null;
  },
};

module.exports = Cookies;
