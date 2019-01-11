const express = require('express');
const cors = require('cors');
const Auth = require('./src/modules/auth.js');
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

app.listen(port, () => console.log(`app listening on ${port}`));
