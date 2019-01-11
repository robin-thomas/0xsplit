const ethUtil = require('ethereumjs-util');
const jwt = require('jsonwebtoken');
const config = require('../../config.json');

const verifySignature = (msg, signature, address) => {
  const msgHash = ethUtil.hashPersonalMessage(ethUtil.toBuffer(msg));
  const sigParams = ethUtil.fromRpcSig(ethUtil.toBuffer(signature));
  const pubKey = ethUtil.ecrecover(msgHash, sigParams.v, sigParams.r, sigParams.s);
  const sender = ethUtil.bufferToHex(ethUtil.publicToAddress(pubKey));
  return (sender === ethUtil.bufferToHex(address)) ? true : false;
}

const Auth = {
  login: (req, res) => {
    const msg = req.body.msg;
    const sig = req.body.sig;
    const address = req.body.address;

    if (verifySignature(msg, sig, address)) {
      const token = jwt.sign({user: address}, config.jwt.secret, {expiresIn: config.jwt.expiresIn});
      res.status(200).send({
        status: "ok",
        token: token
      });
    } else {
      res.status(400).send({
        status: "not ok",
        error: "unable to verify the signature"
      });
    }
  },

  validate: (req, res, next) => {
    try {
      const token = req.headers['x-access-token'];
      const address = req.body.address;

      const decoded = jwt.verify(token, config.jwt.secret);
      if (decoded.user === address) {
        req.user = decoded.user;
        next();
      } else {
        res.status(400).send({
          status: "not ok",
          error: "Failed to authenticate token"
        });
      }
    } catch (err) {
      res.status(400).send({
        status: "not ok",
        error: err.message
      });
    }
  }
};

module.exports = Auth;
