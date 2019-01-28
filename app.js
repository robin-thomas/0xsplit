const express = require('express');
const cors = require('cors');

const Auth = require('./src/modules/auth.js');
const Contacts = require('./src/modules/contacts.js');
const Expenses = require('./src/modules/expenses.js');

const config = require('./config.json');

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.options('*', cors());
app.use(express.static(__dirname + '/static'));

app.post(config.api.login.path, Auth.login);

app.post(config.api.test.path, Auth.validate, (req, res) => {
  res.status(200).send({
    status: "ok",
    msg: "passed!"
  });
});

app.post(config.api.addContact.path, Auth.validate, async (req, res) => {
  const contactAddress = req.body.contact_address;
  const contactNickname = req.body.contact_nickname;
  const address = req.body.address;

  // Add the new contact to DB.
  try {
    await Contacts.addContact(address, contactAddress, contactNickname);

    res.status(200).send({
      status: "ok",
      msg: "new contact added!"
    });
  } catch (err) {
    res.status(500).send({
      status: "not ok",
      msg: err.message
    });
  }
});

app.get(config.api.getAllContacts.path, Auth.validate, async (req, res) => {
  const address = req.query.address;

  try {
    const contacts = await Contacts.getAllContacts(address);

    res.status(200).send({
      status: "ok",
      msg: contacts
    });
  } catch (err) {
    res.status(500).send({
      status: "not ok",
      msg: err.message
    });
  }
});

app.get(config.api.searchContacts.path, Auth.validate, async (req, res) => {
  const address = req.query.address;
  const contactAddress = req.query.contactAddress;
  const contactName = req.query.contactName;

  try {
    const contacts = await Contacts.searchContacts(address, contactAddress, contactName);

    res.status(200).send({
      status: "ok",
      msg: contacts
    });
  } catch (err) {
    res.status(500).send({
      status: "not ok",
      msg: err.message
    });
  }
});

app.delete(config.api.deleteContact.path, Auth.validate, async (req, res) => {
  const address = req.body.address;
  const contactAddress = req.body.contactAddress;

  try {
    await Contacts.deleteContact(address, contactAddress);

    res.status(200).send({
      status: "ok",
      msg: null
    });
  } catch (err) {
    res.status(500).send({
      status: "not ok",
      msg: err.message
    });
  }
});

app.post(config.api.addExpense.path, Auth.validate, async (req, res) => {
  const address = req.body.address;
  const contactAddress = req.body.contactAddress;
  const expense = req.body.expense;

  try {
    await Expenses.addExpense(address, contactAddress, expense);

    res.status(200).send({
      status: "ok",
      msg: null
    });
  } catch (err) {
    res.status(500).send({
      status: "not ok",
      msg: err.message
    });
  }
});

app.get(config.api.searchExpenses.path, Auth.validate, async (req, res) => {
  const address = req.query.address;
  const offset = req.query.offset;
  const limit = req.query.limit;

  try {
    const expenses = await Expenses.searchExpenses(address, offset, limit);

    res.status(200).send({
      status: "ok",
      msg: expenses
    });
  } catch (err) {
    res.status(500).send({
      status: "not ok",
      msg: err.message
    });
  }
});

app.get(config.api.searchExpensesWithKeyword.path, Auth.validate, async (req, res) => {
  const address = req.query.address;
  const keyword = req.query.keyword;
  const includeDeleted = req.query.includeDeleted;

  try {
    const expenses = await Expenses.searchExpensesWithKeyword(address, keyword, includeDeleted);

    res.status(200).send({
      status: "ok",
      msg: expenses
    });
  } catch (err) {
    res.status(500).send({
      status: "not ok",
      msg: err.message
    });
  }
});

app.delete(config.api.deleteExpense.path, Auth.validate, async (req, res) => {
  const expenseId = req.body.id;

  try {
    await Expenses.deleteExpense(expenseId);

    res.status(200).send({
      status: "ok",
      msg: null
    });
  } catch (err) {
    res.status(500).send({
      status: "not ok",
      msg: err.message
    });
  }
});

app.put(config.api.updateExpense.path, Auth.validate, async (req, res) => {
  const expenseId = req.body.id;
  const expense = req.body.expense;

  try {
    await Expenses.updateExpense(expenseId, expense);

    res.status(200).send({
      status: "ok",
      msg: null
    });
  } catch (err) {
    res.status(500).send({
      status: "not ok",
      msg: err.message
    });
  }
});

app.listen(port, () => console.log(`app listening on ${port}`));
