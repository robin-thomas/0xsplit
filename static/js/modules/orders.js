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

const config = require('../../../config.json');
const contracts = require('./contracts.json');

const getContractAddress = require('@0x/contract-addresses').getContractAddressesForNetworkOrThrow;
const contractAddresses = getContractAddress(config.app.networkId);

const DECIMALS = 18;
const ONE_SECOND_MS = 1000;
const ONE_MINUTE_MS = ONE_SECOND_MS * 60;
const TEN_MINUTES_MS = ONE_MINUTE_MS * 10;
const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
const TX_DEFAULTS = { gas: 400000 };

const getRandomFutureDateInSeconds = () => {
  return new BigNumber(Date.now() + TEN_MINUTES_MS).div(ONE_SECOND_MS).ceil();
};
const setAssetInfo = (user) => {
  switch (user.token) {
    case 'ETH':
      user.tokenAddress = contractAddresses.etherToken;
      break;
    case 'ZRX':
      user.tokenAddress = contractAddresses.zrxToken;
      break;
    default:
      user.tokenAddress = contracts[config.app.network][user.token];
  }

  user.assetData = assetDataUtils.encodeERC20AssetData(user.tokenAddress);
  user.assetAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(user.price), DECIMALS);

  return user;
};
const setContractPermissions = async (maker) => {
  if (maker.token === 'ETH') {
    // Convert ETH into WETH for maker by depositing ETH into the WETH contract.
    const makerWETHTxHash = await Orders.getContractWrapper().etherToken.depositAsync(
      maker.tokenAddress,
      maker.assetAmount,
      maker.address,
    );
    await Orders.getWeb3Wrapper().awaitTransactionSuccessAsync(makerWETHTxHash);
  }

  // Allow the 0x ERC20 Proxy to move token on behalf of account.
  const makerApprovalTxHash = await Orders.getContractWrapper().erc20Token.setUnlimitedProxyAllowanceAsync(
    maker.tokenAddress,
    maker.address,
  );
  await Orders.getWeb3Wrapper().awaitTransactionSuccessAsync(makerApprovalTxHash);
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

      maker = setAssetInfo(maker);
      taker = setAssetInfo(taker);

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

  fillOrder: async (orderHash, takerAddress) => {
    try {
      const order = await Orders.getOrder(orderHash);

      await Orders.getContractWrapper().exchange.validateFillOrderThrowIfInvalidAsync(
        order,
        order.takerAssetAmount,
        takerAddress
      );

      await Orders.getContractWrapper().exchange.fillOrderAsync(
        order,
        order.takerAssetAmount,
        takerAddress,
        {
          gasLimit: TX_DEFAULTS.gas,
        }
      );
    } catch (err) {
      throw err;
    }
  },
};

module.exports = Orders;
