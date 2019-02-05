const ethUtil = require('ethereumjs-util');
const HttpClient = require('@0x/connect').HttpClient;
const ContractWrappers = require('@0x/contract-wrappers').ContractWrappers;
const orderHashUtils = require('@0x/order-utils').orderHashUtils;
const signatureUtils = require('@0x/order-utils').signatureUtils;
const assetDataUtils = require('@0x/order-utils').assetDataUtils;
const generatePseudoRandomSalt = require('@0x/order-utils').generatePseudoRandomSalt;
const Web3Wrapper = require('@0x/web3-wrapper').Web3Wrapper;
const BigNumber = require('@0x/utils').BigNumber;
const MetamaskSubprovider = require('@0x/subproviders').MetamaskSubprovider;
const RPCSubprovider = require('@0x/subproviders').RPCSubprovider;
const Web3ProviderEngine = require('@0x/subproviders').Web3ProviderEngine;

const Wallet = require('./metamask.js');

const config = require('../../../config.json');
const contracts = require('./config/contracts.json');

const getContractAddress = require('@0x/contract-addresses').getContractAddressesForNetworkOrThrow;
const contractAddresses = getContractAddress(config.app.networkId);

const DECIMALS = 18;
const ONE_SECOND_MS = 1000;
const ONE_MINUTE_MS = ONE_SECOND_MS * 60;
const TEN_MINUTES_MS = ONE_MINUTE_MS * 10;
const ONE_DAY_MS = TEN_MINUTES_MS * 6 * 24;
const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
const TX_DEFAULTS = { gas: 400000 };

const getRandomFutureDateInSeconds = () => {
  return new BigNumber(Date.now() + ONE_DAY_MS).div(ONE_SECOND_MS).ceil();
};
const getTokenAddress = async (token) => {
  const network = await Wallet.getNetwork();

  let tokenAddress = null;

  switch (token) {
    case 'ETH':
      return contractAddresses.etherToken;
    case 'ZRX':
      return contractAddresses.zrxToken;
    default:
      tokenAddress = contracts[network][token];
      if (tokenAddress === null || tokenAddress === undefined) {
        throw new Error('Invalid token address');
      }
      return tokenAddress;
  }
};
const setAssetInfo = async (user) => {
  try {
    user.tokenAddress = await getTokenAddress(user.token);
    user.assetData = assetDataUtils.encodeERC20AssetData(user.tokenAddress);
    user.assetAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(user.price), DECIMALS);
    return user;
  } catch (err) {
    throw err;
  }
};
const setContractPermissions = async (user) => {
  if (user.token === 'ETH') {
    // Convert ETH into WETH by depositing ETH into the WETH contract.
    const userWETHTxHash = await Orders.getContractWrapper().etherToken.depositAsync(
      user.tokenAddress,
      user.assetAmount,
      user.address,
      {
        gasLimit: TX_DEFAULTS.gas,
      }
    );
    await Orders.getWeb3Wrapper().awaitTransactionSuccessAsync(userWETHTxHash);
  }

  // Allow the 0x ERC20 Proxy to move token on behalf of account.
  const userApprovalTxHash = await Orders.getContractWrapper().erc20Token.setUnlimitedProxyAllowanceAsync(
    user.tokenAddress,
    user.address,
    {
      gasLimit: TX_DEFAULTS.gas,
    }
  );
  await Orders.getWeb3Wrapper().awaitTransactionSuccessAsync(userApprovalTxHash);
};
const constructOrder = (maker, taker) => {
  return {
    exchangeAddress: contractAddresses.exchange,
    expirationTimeSeconds: getRandomFutureDateInSeconds(),
    makerAddress: maker.address,
    makerAssetAmount: maker.assetAmount,
    makerAssetData: maker.assetData,
    salt: generatePseudoRandomSalt(),
    takerAddress: NULL_ADDRESS,
    takerAssetAmount: taker.assetAmount,
    takerAssetData: taker.assetData,
  };
};
const setOrderConfig = async (order) => {
  // Ask the relayer about the parameters they require for the order.
  const orderConfig = await Orders.getClient().getOrderConfigAsync(order, {
    networkId: config.app.networkId,
  });
  console.log(orderConfig);

  order.makerFee = orderConfig.makerFee;
  order.takerFee = orderConfig.takerFee;
  order.senderAddress = orderConfig.senderAddress;
  order.feeRecipientAddress = orderConfig.feeRecipientAddress;

  return order;
};
const getOrderSignature = async (maker, orderHashHex) => {
  const signature = await signatureUtils.ecSignHashAsync(
    Orders.getProvider(),
    orderHashHex,
    maker.address
  );
  return signature;
};
const deserializeTokenBalance = (assetAmount) => {
  return assetAmount.div(Math.pow(10, DECIMALS)).toString();
}
const deserializeTokenName = (assetData) => {
  const data = assetDataUtils.decodeERC20AssetData(assetData);
  return Object.keys(contracts[config.app.network])
               .find(key => contracts[config.app.network][key] === data.tokenAddress);
}

const Orders = {
  client: null,
  getClient: () => {
    if (Orders.client === null) {
      Orders.client = new HttpClient(config.app.relayer);
    }
    return Orders.client;
  },
  provider: null,
  getProvider: () => {
    if (Orders.provider === null) {
      Orders.provider = new Web3ProviderEngine();
      Orders.provider.addProvider(new MetamaskSubprovider(window.web3.currentProvider));
      Orders.provider.addProvider(new RPCSubprovider(config.infura[config.app.network]));
      Orders.provider.start();
    }
    return Orders.provider;
  },
  contractWrapper: null,
  getContractWrapper: () => {
    if (Orders.contractWrapper === null) {
      Orders.contractWrapper = new ContractWrappers(Orders.getProvider(), {
        networkId: config.app.networkId
      });
    }
    return Orders.contractWrapper;
  },
  web3Wrapper: null,
  getWeb3Wrapper: () => {
    if (Orders.web3Wrapper === null) {
      Orders.web3Wrapper = new Web3Wrapper(Orders.getProvider());
    }
    return Orders.web3Wrapper;
  },

  loadOrders: async () => {
    try {
      const _orders = await Orders.getOrders();

      let orders = [];
      for (let _order of _orders.records) {
        _order = _order.order;

        orders.push({
          hash: orderHashUtils.getOrderHashHex(_order),
          takerToken: deserializeTokenName(_order.takerAssetData),
          takerAmount: deserializeTokenBalance(_order.takerAssetAmount),
          makerToken: deserializeTokenName(_order.makerAssetData),
          makerAmount: deserializeTokenBalance(_order.makerAssetAmount),
        });
      }

      return orders;
    } catch (err) {
      throw err;
    }
  },

  getOrder: async (orderHash) => {
    try {
      const order = await Orders.getClient().getOrderAsync(orderHash);
      return order;
    } catch (err) {
      throw err;
    }
  },

  getOrders: async () => {
    try {
      const orders = await Orders.getClient().getOrdersAsync();
      return orders;
    } catch (err) {
      throw err;
    }
  },

  submitOrder: async (maker, taker) => {
    try {
      maker.address = ethUtil.bufferToHex(maker.address);

      maker = await setAssetInfo(maker);
      taker = await setAssetInfo(taker);

      await setContractPermissions(maker);

      // Construct the order object.
      let order = await setOrderConfig(constructOrder(maker, taker));
      const orderHashHex = orderHashUtils.getOrderHashHex(order);
      order.signature = await getOrderSignature(maker, orderHashHex);
      console.log(order);

      // Validate this order.
      await Orders.getContractWrapper().exchange.validateOrderFillableOrThrowAsync(order);

      // Submit the order to the relayer.
      await Orders.getClient().submitOrderAsync(order);
    } catch (err) {
      throw err;
    }
  },

  fillOrder: async (orderHash, takerAddress, takerToken) => {
    try {
      let order = await Orders.getOrder(orderHash);
      order = order.order;

      // // Taker allowance.
      // await setContractPermissions({
      //   tokenAddress: await getTokenAddress(takerToken),
      //   address: takerAddress,
      // });

      const txHash = await Orders.getContractWrapper().exchange.fillOrderAsync(
        order,
        order.takerAssetAmount,
        takerAddress,
        {
          gasLimit: TX_DEFAULTS.gas,
          shouldValidate: true,
        }
      );

      return txHash;
    } catch (err) {
      throw err;
    }
  },
};

module.exports = Orders;
