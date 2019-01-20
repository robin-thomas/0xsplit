const DB = require('./db.js');

const Contacts = {
  addContact: async (address, contactAddress, contactNickname) => {
    const query = {
      sql: 'INSERT INTO contacts(address, contact_address, contact_nickname) \
            VALUES(?, ?, ?)',
      timeout: 6 * 1000, // 6s
      values: [ address, contactAddress, contactNickname ],
    };

    try {
      await DB.insert(query);
    } catch (err) {
      throw err;
    }
  },

  getAllContacts: async (address) => {
    const query = {
      sql: 'SELECT contact_address as address, contact_nickname as nickname \
            FROM contacts WHERE address = ?',
      timeout: 6 * 1000, // 6s
      values: [ address ],
    };

    try {
      const results = await DB.select(query);
      return results;
    } catch (err) {
      throw err;
    }
  },

  searchContacts: async (address, contactAddress, contactName) => {
    const query = {
      sql: 'SELECT contact_address as address, contact_nickname as nickname \
            FROM contacts WHERE address = ? AND \
            (contact_address = ? OR contact_nickname = ?)',
      timeout: 6 * 1000, // 6s
      values: [ address, contactAddress, contactName ],
    };

    try {
      const results = await DB.select(query);
      return results;
    } catch (err) {
      throw err;
    }
  },

  deleteContact: async (address, contactAddress) => {
    const query = {
      sql: 'DELETE FROM contacts WHERE address = ? AND contact_address = ?',
      timeout: 6 * 1000, // 6s
      values: [ address, contactAddress ],
    };

    try {
      await DB.select(query);
    } catch (err) {
      throw err;
    }
  },
};

module.exports = Contacts;
