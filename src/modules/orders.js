const DB = require('./db.js');
const BigNumber = require('0x.js').BigNumber;
const generatePseudoRandomSalt = require('0x.js').generatePseudoRandomSalt;

const generateRandomExpiration = () => {
  return new BigNumber(Date.now() + TEN_MINUTES_MS).div(ONE_SECOND_MS).ceil();
}

const Orders = {
  ZERO: new BigNumber(0),
  NULL_ADDRESS: '0x0000000000000000000000000000000000000000',

  addOrder: async (address, order) => {
    const query = {
      sql: 'INSERT INTO orders(address, order) VALUES(?, ?)',
      timeout: 6 * 1000, // 6s
      values: [ address, JSON.stringify(order) ],
    };

    try {
      await DB.insert(query);
    } catch (err) {
      throw err;
    }
  },

  constructOrder: (req) => {
    return {
      exchangeAddress: req.exchangeAddress,
      makerAddress: req.maker,
      makerAssetAmount: req.makerAssetAmount,
      takerAssetAmount: req.takerAssetAmount,
      makerAssetData: req.makerAssetData,
      takerAssetData: req.takerAssetData,
    };
  },

  constructFillableOrder: (req) => {
    req = JSON.parse(req);

    return {
      exchangeAddress: req.exchangeAddress,
      makerAddress: req.maker,
      takerAddress: Orders.NULL_ADDRESS,
      senderAddress: Orders.NULL_ADDRESS,
      feeRecipientAddress: Orders.NULL_ADDRESS,
      expirationTimeSeconds: generateRandomExpiration(),
      salt: generatePseudoRandomSalt(),
      makerAssetAmount: req.makerAssetAmount,
      takerAssetAmount: req.takerAssetAmount,
      makerAssetData: req.makerAssetData,
      takerAssetData: req.takerAssetData,
      makerFee: Orders.ZERO,
      takerFee: Orders.ZERO,
    };
  }
};

module.exports = Orders;
