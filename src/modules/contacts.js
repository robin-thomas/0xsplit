const DB = require('./db.js');
const Expenses = require('./expenses.js');

const Contacts = {
  addContact: async (address, contactAddress, contactNickname) => {
    const query = {
      sql: 'INSERT INTO contacts(address, contact_address, contact_nickname) \
            VALUES(?, ?, ?)',
      timeout: 6 * 1000, // 6s
      values: [ address, contactAddress, contactNickname ],
    };

    try {
      await DB.query(query);
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
      const results = await DB.query(query);

      // // Insert the owe amount.
      // for (let result of results) {
      //   const contactAddress = result.address;
      //
      //   // Get all un-deleted expenses among you both.
      //   const owe = await Expenses.getOweAmount(address, contactAddress);
      //
      //   // If anything is owed or you are owed.
      //   if (Object.entries(owe).length !== 0 || owe.constructor !== Object) {
      //     result.settle = owe;
      //   }
      // }

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
      const results = await DB.query(query);

      // Insert the owe amount.
      for (let result of results) {
        const contactAddress = result.address;

        // Get all un-deleted expenses among you both.
        const owe = await Expenses.getOweAmount(address, contactAddress);

        // If you owe anything or you are owed.
        if (Object.entries(owe).length !== 0 || owe.constructor !== Object) {
          result.settle = owe;
        }
      }

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
      await DB.query(query);
    } catch (err) {
      throw err;
    }
  },
};

module.exports = Contacts;
