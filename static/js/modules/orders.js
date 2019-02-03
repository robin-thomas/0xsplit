const config = require('../../../config.json');
const HttpClient = require('@0x/connect').HttpClient;

const Orders = {
  client: null,
  createClient: () => {
    if (Orders.client === null) {
      Orders.client = new HttpClient(config.app.relayer);
    }
    return Orders.client;
  },

  getOrder: async (orderHash) => {
    try {
      const order = await Orders.createClient().getOrderAsync(orderHash);
      return order;
    } catch (err) {
      throw err;
    }
  },

  getOrders: async () => {
    try {
      const orders = await Orders.createClient().getOrdersAsync();
      return orders;
    } catch (err) {
      throw err;
    }
  },

  submitOrder: async (signedOrder) => {
    try {
      await Orders.createClient().submitOrderAsync(signedOrder);
    } catch (err) {
      throw err;
    }
  }

};

module.exports = Orders;
