const assert = require('assert');

const Contacts = require('../../src/modules/contacts.js');
const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';

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
});
