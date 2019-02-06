const ethUtil = require('ethereumjs-util');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const crypto = require('crypto');

const DB = require('./db.js');

const config = require('../../config.json');

const verifySignature = (msg, signature, address) => {
  const msgHash = ethUtil.hashPersonalMessage(ethUtil.toBuffer(msg));
  const sigParams = ethUtil.fromRpcSig(ethUtil.toBuffer(signature));
  const pubKey = ethUtil.ecrecover(msgHash, sigParams.v, sigParams.r, sigParams.s);
  const sender = ethUtil.bufferToHex(ethUtil.publicToAddress(pubKey));
  return (sender === ethUtil.bufferToHex(address)) ? true : false;
}

const isValidRefreshToken = async (address, refreshToken) => {
  const query = {
    sql: 'SELECT COUNT(id) AS count FROM auth \
          WHERE address = ? AND refresh_token = ? AND expiry > NOW()',
    timeout: 6 * 1000, // 6s
    values: [ address, refreshToken ],
  };

  try {
    const results = await DB.query(query);
    return results[0].count == 1;
  } catch (err) {
    throw err;
  }
};

const genToken = (address) => {
  const expiresIn = moment().add(config.jwt.expiresInHours, 'hours').format('YYYY-MM-DD HH:mm:ss');
  const token = jwt.sign({user: address}, config.jwt.secret, {expiresIn: config.jwt.expiresIn});

  return {
    token: token,
    expiresIn: expiresIn
  };
}
const genRefreshToken = async (address) => {
  const refreshToken = crypto.randomBytes(15).toString('hex');
  const expiry = moment().add(1, 'M').format('YYYY-MM-DD HH:mm:ss');

  const query = {
    sql: 'INSERT INTO auth(address, refresh_token, expiry) \
          VALUES(?, ?, ?)',
    timeout: 6 * 1000, // 6s
    values: [ address, refreshToken, expiry ],
  };

  try {
    await DB.query(query);
    return refreshToken;
  } catch (err) {
    throw err;
  }
};

const Auth = {
  login: async (req, res) => {
    const msg = req.body.msg;
    const sig = req.body.sig;
    const address = req.body.address;

    if (verifySignature(msg, sig, address)) {
      const {token, expiresIn} = genToken(address);
      const refreshToken = await genRefreshToken(address);

      res.status(200).send({
        status: 'ok',
        token: token,
        expiresIn: expiresIn,
        refreshToken: refreshToken,
      });
    } else {
      res.status(400).send({
        status: 'not ok',
        msg: 'unable to verify the signature'
      });
    }
  },

  validate: (req, res, next) => {
    try {
      const token = req.headers['x-access-token'];
      const address = req.method !== 'GET' ? req.body.address : req.query.address;

      const decoded = jwt.verify(token, config.jwt.secret);
      if (decoded.user === address) {
        req.user = decoded.user;
        next();
      } else {
        res.status(400).send({
          status: 'not ok',
          msg: 'Failed to authenticate the token',
          address: address,
        });
      }
    } catch (err) {
      res.status(400).send({
        status: 'not ok',
        msg: err.message
      });
    }
  },

  refresh: async (req, res) => {
    const address = req.body.address;
    const refreshToken = req.body.refreshToken;

    try {
      if (await isValidRefreshToken(address, refreshToken)) {
        const {token, expiresIn} = genToken(address);

        res.status(200).send({
          status: 'ok',
          token: token,
          expiresIn: expiresIn,
        });
      } else {
        res.status(400).send({
          status: 'not ok',
          msg: 'unable to verify the refresh token',
          refreshToken: refreshToken
        });
      }
    } catch (err) {
      res.status(400).send({
        status: 'not ok',
        msg: err.message
      });
    }
  }
};

module.exports = Auth;
