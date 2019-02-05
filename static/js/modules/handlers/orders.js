const Wallet = require('../metamask.js');
const Orders = require('../orders.js');

const walletAfterConnect    = $('#wallet-after-connect');

const walletLogo = '<i class="fas fa-wallet" style="color:#17a2b8"></i>';

const orderRow = '<div class="row">\
                    <div class="col-md-2">%logo%</div>\
                    <div class="col-md-7">\
                      <div style="font-size:11px;">%orderDesc%</div>\
                      <div style="font-weight:bold;">%tokenBalance%</div>\
                    </div>\
                    <div class="col-md-3">\
                      <div class="buy-order">\
                        Buy\
                        <input type="hidden" class="buy-order-json" value="%buyOrderJsonValue%">\
                      </div>\
                    </div>\
                  </div>';

const defaultLogo = '<svg width="28" height="28">\
                      <circle cx="14" cy="14" r="14" fill="#12131f"></circle>\
                    </svg>';

const orderHtml = '<div class="container-fluid" style="margin:0px !important;padding:0px !important;">\
                    <div class="row row-header" style="height:50px !important;padding:0 !important;margin:0 !important;">\
                      <div class="col-md-2">%walletLogo%</div>\
                      <div class="col-md-7" style="color:#17a2b8;">%addressDisplay%</div>\
                      <div class="col-md-3">&nbsp;</div>\
                    </div>\
                    <div id="wallet-erc20-display"></div>\
                  </div>';

const getTokenLogo = (logo) => {
  return logo !== "" ?
          '<img width="28" height="28" src="' + logo + '" />' : defaultLogo;
};
const getOrderDesc = (order) => {
  return order.takerAmount + ' ' + order.takerToken + ' → ' +
         order.makerAmount + ' ' + order.makerToken;
};

// const sleep = (ms) => {
//   return new Promise(resolve => setTimeout(resolve, ms));
// };

const OrderHandler = {
  orderDisplayHandler: async (orders) => {
    orders = orders || await Orders.loadOrders();

    // Set the wallet display.
    const addressDisplay = Wallet.address.substr(0, 5) + '...' + Wallet.address.substr(37);
    let html = orderHtml.replace('%walletLogo%', walletLogo);
    html = html.replace('%addressDisplay%', addressDisplay);
    walletAfterConnect.html(html);

    const walletDisplay = walletAfterConnect.find('#wallet-erc20-display');

    for (const order of orders) {
      const {balance, logo} = await Wallet.getTokenBalanceAndLogo(order.takerToken, Wallet.address);

      // Set the order details in the row.
      let row = orderRow.replace('%logo%', getTokenLogo(logo));
      row = row.replace('%orderDesc%', getOrderDesc(order));
      row = row.replace('%tokenBalance%', balance);
      row = row.replace('%buyOrderJsonValue%', encodeURIComponent(JSON.stringify(order)));
      walletDisplay.append(row);
    }
    walletDisplay.append('<div class="row"></div>');

    const el = new SimpleBar(walletDisplay[0]);
    el.recalculate();
  },
  orderBuyHandler: async (btn) => {
    let order = btn.find('.buy-order-json').val();
    order = JSON.parse(decodeURIComponent(order));

    const orderDesc = order.makerAmount + ' ' + order.makerToken + ' for ' +
                      order.takerAmount + ' ' + order.takerToken;

    if (confirm('Are you sure you want to buy ' + orderDesc + ' ?')) {
      try {
        const loadingText = '<i class="fas fa-circle-notch fa-spin"></i>';
        btn.data('original-text', btn.html());
        btn.html(loadingText);

        await Orders.fillOrder(order.hash, Wallet.address, order.takerToken);

        btn.html(btn.data('original-text'));
        btn.parent().parent().remove();

        const el = new SimpleBar(walletAfterConnect.find('#wallet-erc20-display')[0]);
        el.recalculate();
      } catch (err) {
        btn.html(btn.data('original-text'));
        throw err;
      }
    }
  }
};

module.exports = OrderHandler;
