const Contacts = require('../contacts.js');
const Expenses = require('../expenses.js');
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
      const contact = ContactsHandler.contactsList[i];

      const settle = '<div class="settle-up-with-contact">Settle</div>';

      const contactName = contact.nickname.split(' ')[0];

      const row = '<div class="row">\
                    <div class="col-md-3">\
                      <i class="fas fa-user-circle" style="font-size:3em;color:#17a2b8;"></i>\
                    </div>\
                    <div class="col-md-4" style="text-align:left;padding-left:0 !important">'
                     + contactName +
                    '</div>\
                    <div class="col-md-3">' + settle + '</div>\
                    <div class="col-md-2">\
                      <input type="hidden" class="contact-name" value="' + contactName + '" />\
                      <input type="hidden" class="contact-address" value="' + contact.address + '" />\
                      <i class="fas fa-times-circle" style="cursor:pointer;color:#17a2b8;" title="Delete contact"></i>\
                    </div>\
                  </div>';

      rows += row;
    }

    const html = '<div id="contacts-display">' + rows + '</div>';
    contactsAfterConnect.find('.container-fluid').html(html);

    const el = new SimpleBar(contactsAfterConnect.find('#contacts-display')[0]);
    el.recalculate();
  },
  addNewContactHandler: async (btn, contact) => {
    btn = (btn === undefined || btn === null ? null : btn);

    const contactName = btn !== null ? newContactNickname.val() : contact.nickname;
    const contactAddress = btn !== null ? newContactAddress.val() : contact.address;

    // Validate the fields.
    try {
      await Contacts.validateNewContactFields(contactAddress, contactName);
    } catch (err) {
      alert(err.message);
      return;
    }

    if (btn) {
      const loadingText = '<i class="fas fa-spinner fa-spin"></i>&nbsp;Adding...';
      btn.data('original-text', btn.html());
      btn.html(loadingText);
    }

    // Add the new contact.
    try {
      await Contacts.addNewContact({
        contact_address: contactAddress,
        contact_nickname: contactName,
        address: Wallet.address
      });
    } catch (err) {
      if (btn) {
        btn.html(btn.data('original-text'));
      }

      alert(err.message);
      return;
    }

    // Send an invite to the contact.
    if (confirm("Do you want to invite this contact through an ETH transaction (gas costs included)?")) {
      const rawTransaction = {
        "from": Wallet.address,
        "to": contactAddress,
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
    ContactsHandler.contactsList.push({address: contactAddress, nickname: contactName});
    ContactsHandler.contactsDisplayHandler();

    if (btn) {
      btn.html(btn.data('original-text'));
      addContactDialog.modal('hide');
    }
  },
  deleteContactHandler: async (ele) => {
    const contactAddress = $(ele).parent().find('.contact-address').val();
    const contactName = $(ele).parent().find('.contact-name').val();

    try {
      if (confirm('Are you sure you want to delete ' + contactName + ' from your contacts?')) {
        // Check whether there are any expenses with this contact.
        // If yes, we wont delete this contact.
        const out = await Expenses.searchExpensesWithKeyword(Wallet.address, contactName, true);
        if (out.length >= 1) {
          throw new Error('Cannot delete, as you have previous expenses with ' + contactName + '!');
        }

        await Contacts.deleteContact({address: Wallet.address, contactAddress: contactAddress});

        ContactsHandler.contactsList = ContactsHandler.contactsList.filter(e => e.address !== contactAddress);
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
  settleContactDisplayHandler: async (ele) => {
    // Get the settlement for this contact.
    const parent = ele.parent().next();
    const contactName = parent.find('.contact-name').val();
    const contactAddress = parent.find('.contact-address').val();

    const loadingText = '<i class="fas fa-circle-notch fa-spin"></i>';
    ele.data('original-text', ele.html());
    ele.html(loadingText);

    try {
      const out = await Contacts.searchContacts({
        address: Wallet.address,
        contactAddress: contactAddress,
        contactName: contactName,
      });

      if (out.length === 0 || out[0].settle === undefined) {
        throw new Error('You do not have any unsettled expenses with ' + contactName + '!');
      }

      const json = encodeURIComponent(JSON.stringify(out[0].settle));
      // ele.find('.settle-up-json').val(json);
      $('#settle-expense-currency').next().val(json);
      $('#settle-expense-currency').next().next().val(contactAddress);
      $('#settle-expense-currency').next().next().next().val(contactName);

      let options = '';
      for (const token of Object.keys(out[0].settle)) {
        options += '<option value="' + token + '">' + token + '</option>';
      }
      $('#settle-expense-currency').html(options);

      await ContactsHandler.expenseSettleTokenChange();

      $('#settle-expenses-dialog').find('.modal-title').html('Settle expenses with ' + contactName);
      $('#settle-expenses-dialog').modal('show');
      ele.html(ele.data('original-text'));
    } catch (err) {
      ele.html(ele.data('original-text'));
      alert(err.message);
    }
  },
  expenseSettleTokenChange: async () => {
    const btn = $('#settle-expense-currency');

    let json = JSON.parse(decodeURIComponent(btn.next().val()));

    $('#confirm-settle-expenses').prop('disabled', true);

    const val = btn.val();
    const amount = parseFloat(json[val]);
    const amountDisplay = Math.abs(amount) + ' ' + val;

    const rows = btn.parent().find('.container > .row');
    if (amount < 0) {
      rows.first().html('<span style="margin:0 auto;color:#28a745">You are owed</span>');
      rows.first().next().html('<span style="margin:0 auto;color:#28a745">' + amountDisplay + '</span>');
    } else if (amount > 0) {
      rows.first().html('<span style="margin:0 auto;color:#dc3545">You owe</span>');
      rows.first().next().html('<span style="margin:0 auto;color:#dc3545">' + amountDisplay + '</span>');
      $('#confirm-settle-expenses').prop('disabled', false);
    }

    let {balance, logo} = await Wallet.getTokenBalanceAndLogo(val, Wallet.address);
    balance = parseFloat(balance).toFixed(2) + ' ' + val;
    $('#settle-expense-wallet-balance').html(balance);

    // Doesnt have enough balance in the wallet.
    if (parseFloat(balance) < amount) {
      $('#confirm-settle-expenses').prop('disabled', false);
    }
  },
};

module.exports = ContactsHandler;
