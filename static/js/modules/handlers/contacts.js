const Contacts = require('../contacts.js');
const Wallet = require('../metamask.js');

const config = require('../../../../config.json');

const contactsAfterConnect = $('#contacts-after-connect'),
      expenseContacts      = $('#expense-contacts'),
      newContactAddress    = $('#new-contact-address'),
      newContactNickname   = $('#new-contact-nickname');

const addContactDialog = $('#add-contact-dialog');

const ContactsHandler = {
  contactsList: [],
  contactsDisplayHandler: () => {
    const names = ContactsHandler.contactsList.filter(e => e.hasOwnProperty('nickname')).map(e => e.nickname);
    try {
      expenseContacts.autocomplete({
        source: names
      });
    } catch (err) {
      console.log(err);
    }

    let rows = '';
    for (let i in ContactsHandler.contactsList) {
      const contactName = ContactsHandler.contactsList[i].nickname;
      const contactAddress = ContactsHandler.contactsList[i].address;
      const row = '<div class="row">\
                    <div class="col-md-3">\
                      <i class="fas fa-user-circle" style="font-size:3em;color:#17a2b8;"></i>\
                    </div>\
                    <div class="col-md-6" style="text-align:left;padding-left:0 !important">'
                     + contactName +
                    '</div>\
                    <div class="col-md-1">\
                      <input type="hidden" class="contact-name" value="' + contactName + '" />\
                      <input type="hidden" class="contact-address" value="' + contactAddress + '" />\
                      <i class="fas fa-times-circle" style="cursor:pointer;color:#17a2b8;" title="Delete contact"></i>\
                    </div>\
                    <div class="col-md-1">&nbsp;</div>\
                  </div>';

      rows += row;
    }
    const html = '<div id="contacts-display">'
                  + rows +
                  '</div>';

    contactsAfterConnect.find('.container-fluid').html(html);

    const el = new SimpleBar(contactsAfterConnect.find('#contacts-display')[0]);
    el.recalculate();
  },
  addNewContactHandler: async (btn) => {
    // Validate the fields.
    try {
      Contacts.validateNewContactFields(newContactAddress.val(), newContactNickname.val());

      // TODO: add a validation to see that this contact
      // hasnt been added under a different name.

      // TODO: validate to see that there is no other contact
      // with the same name.

      if (newContactAddress.val().trim() === Wallet.address) {
        throw new Error('Contact address cannot be as same as your address!');
      }
    } catch (err) {
      alert(err.message);
      return;
    }

    const loadingText = '<i class="fas fa-spinner fa-spin"></i>&nbsp;Adding...';
    btn.data('original-text', btn.html());
    btn.html(loadingText);

    // Add the new contact.
    try {
      await Contacts.addNewContact({
        contact_address: newContactAddress.val(),
        contact_nickname: newContactNickname.val(),
        address: Wallet.address
      });
    } catch (err) {
      btn.html(btn.data('original-text'))
      alert(err.message);
      return;
    }

    // Send an invite to the contact.
    if (confirm("Do you want to invite this contact through an ETH transaction (gas costs included)?")) {
      const rawTransaction = {
        "from": Wallet.address,
        "to": newContactAddress.val(),
        "data": window.web3.utils.toHex(config.app.url),
        "gas": 200000
      };
      try {
        await window.web3.eth.sendTransaction(rawTransaction);
      } catch(err){
        alert('Failed to send the transaction!');
      }
    }

    // Load all the contacts
    ContactsHandler.contactsList.push({address: newContactAddress.val(), nickname: newContactNickname.val()});
    console.log(ContactsHandler.contactsList);
    ContactsHandler.contactsDisplayHandler();

    btn.html(btn.data('original-text'));
    addContactDialog.modal('hide');
  },
  deleteContactHandler: async (ele) => {
    const contactAddress = $(ele).parent().find('.contact-address').val();
    const contactName = $(ele).parent().find('.contact-name').val();

    try {
      if (confirm('Are you sure you want to delete ' + contactName + ' from your contacts?')) {
        await Contacts.deleteContact({address: Wallet.address, contactAddress: contactAddress});
        console.log({address: Wallet.address, contactAddress: contactAddress});

        ContactsHandler.contactsList = ContactsHandler.contactsList.filter(e => e.address !== contactAddress);
        console.log(ContactsHandler.contactsList);
        ContactsHandler.contactsDisplayHandler();
      }
    } catch (err) {
      alert(err.message);
    }
  },
  addNewContactDisplayHandler: () => {
    addContactDialog.find('input[type="text"]').val('');
    addContactDialog.modal('show');
  },
};

module.exports = ContactsHandler;
