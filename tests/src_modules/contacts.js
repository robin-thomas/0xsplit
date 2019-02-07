const assert = require('assert');

const Contacts = require('../../src/modules/contacts.js');
const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
const VALID_ADDRESS_1 = '0xbd373d1083bed4236d11c4d5330e8c5f5ec91462';
const VALID_ADDRESS_2 = '0xbbe64a787620F681775499aAb5E843C68D37CCF7';

const checkContactExists = (contactAddress, contacts) => {
  for (const contact of contacts) {
    if (contact.address === contactAddress) {
      return true;
    }
  }

  return false;
}

describe('Contacts', () => {
  describe('addContact', () => {
    it('add contact when address do not exist', (done) => {
      const address = NULL_ADDRESS;

      Contacts.addContact(address, NULL_ADDRESS, 'Hello')
        .then(() => {
          assert.fail('test was supported to throw error');
        }).catch ((err) => {
          done();
        });
    });

    it('nickname cannot be empty', (done) => {
      const address = NULL_ADDRESS;

      Contacts.addContact(address, null, '')
        .then(() => {
          assert.fail('test was supported to throw error');
        }).catch ((err) => {
          done();
        });
    });

    it('Nickname not in valid format', (done) => {
      const address = NULL_ADDRESS;

      Contacts.addContact(address, NULL_ADDRESS, 'hello123')
        .then(() => {
          assert.fail('test was supported to throw error');
        }).catch ((err) => {
          done();
        });
    });

    it('ETH Address cannot be not empty', (done) => {
      const address = NULL_ADDRESS;

      Contacts.addContact(address, '', 'hello')
        .then(() => {
          assert.fail('test was supported to throw error');
        }).catch ((err) => {
          done();
        });
    });

    it('ETH Address not valid', (done) => {
      const address = NULL_ADDRESS;

      Contacts.addContact(address, 'hello', 'hello')
        .then(() => {
          assert.fail('test was supported to throw error');
        }).catch ((err) => {
          done();
        });
    });

    it('Contact address cannot be as same as your address', (done) => {
      const address = NULL_ADDRESS;

      Contacts.addContact(address, NULL_ADDRESS, 'hello')
        .then(() => {
          assert.fail('test was supported to throw error');
        }).catch ((err) => {
          done();
        });
    });
  });

  describe('Contact operation 1', () => {
    it('add/get/delete contact', (done) => {
      const address = NULL_ADDRESS;

      Contacts.addContact(VALID_ADDRESS_1, VALID_ADDRESS_2, 'Hello')
        .then((id) => {
          Contacts.getAllContacts(VALID_ADDRESS_1)
            .then((contacts) => {
            // Make sure that contact address is present.
            return new Promise((resolve, reject) => {
              if (checkContactExists(VALID_ADDRESS_2, contacts)) {
                resolve(id);
              } else {
                reject();
              }
            });
          })
          .then(Contacts.deleteContact)
          .then(() => Contacts.getAllContacts(VALID_ADDRESS_1))
          .then((contacts) => {
            // Make sure that contact address is not present.
            return new Promise((resolve, reject) => {
              if (checkContactExists(VALID_ADDRESS_2, contacts)) {
                reject();
              } else {
                resolve();
              }
            });
          });
        })
        .then(() => done())
        .catch((err) => {
          console.log(err);
          assert.fail('test was supported to not throw error');
          done();
        });

    });
  });
});
