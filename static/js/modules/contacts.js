const ethUtil = require('ethereumjs-util');
const fetch = require('node-fetch');
const config = require('../../../config.json');
const Session = require('./session.js');

const Contacts = {
  validateNewContactFields: (address, name) => {
    // Validate Name.
    const nameValid = /^[a-zA-Z ]+$/.test(name);
    if (!nameValid) {
      throw new Error('Nickname not in valid format!');
    }

    // Validate ETH address.
    const addressValid = ethUtil.isValidAddress(address);
    if (!addressValid) {
      throw new Error('ETH Address not valid!');
    }
  },

  addNewContact: async (data) => {
    try {
      const out = await Session.api(config.api.addContact.name, data);
      return out;
    } catch (err) {
      throw err;
    }
  },
};

module.exports = Contacts;
