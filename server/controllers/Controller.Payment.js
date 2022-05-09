const paypal = require("@paypal/checkout-server-sdk");
const Product = require("../models/Model.Product");

const ControllerPayment = {
  /**
   * @desc
   * create payment
   * @url /api/create_payment
   */
  createPayment: async (req, res, next) => {
    try {
      /**
       * @desc
       * fetch bougth items from database
       */
      //let boughtItems = [];
      let boughtItems = await Product.find({
        _id: { $in: req.body.orderItems },
      });

      /**
       * @desc
       * calculate total price of the items in customers order
       */
      const totalItemsPrice = req.body.orderItems.reduce((sum, item, idx) => {
        return sum + boughtItems[idx].price * item.quantity;
      }, 0);

      /**
       * @desc
       * calculate total price including shipping and tax
       */
      const totalPrice =
        totalItemsPrice + req.body.shippingPrice + req.body.taxPrice;

      // Creating an environment
      let clientId = process.env.PAYPAL_CLIENT_ID;
      let clientSecret = process.env.PAYPAL_CLIENT_SECRET;

      // This sample uses SandboxEnvironment. In production, use LiveEnvironment
      let environment = new paypal.core.SandboxEnvironment(
        clientId,
        clientSecret
      );
      let client = new paypal.core.PayPalHttpClient(environment);

      // Construct a request object and set desired parameters
      // Here, OrdersCreateRequest() creates a POST request to /v2/checkout/orders
      let request = new paypal.orders.OrdersCreateRequest();
      request.requestBody({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: totalPrice,
              breakdown: {
                item_total: {
                  currency_code: "USD",
                  value: totalItemsPrice,
                },
                tax_total: {
                  currency_code: "USD",
                  value: req.body.taxPrice,
                },
                shipping: {
                  currency_code: "USD",
                  value: req.body.shippingPrice,
                },
              },
            },
            items: boughtItems.map((item, idx) => {
              return {
                name: item.name,
                unit_amount: {
                  currency_code: "USD",
                  value: item.price,
                },
                quantity: req.body.orderItems[idx].quantity,
              };
            }),
          },
        ],
      });

      let response = await client.execute(request);

      res.status(200).json({ response });
    } catch (error) {
      return next(error);
    }
  },
  /**
   * @desc
   * execute payment with ID we sent with create_payment route to frontend and recived it back
   * @url /api/execute_payment
   */
  executePayment: async (req, res, next) => {
    try {
      // Creating an environment
      let clientId = process.env.PAYPAL_CLIENT_ID;
      let clientSecret = process.env.PAYPAL_CLIENT_SECRET;

      // This sample uses SandboxEnvironment. In production, use LiveEnvironment
      let environment = new paypal.core.SandboxEnvironment(
        clientId,
        clientSecret
      );
      let client = new paypal.core.PayPalHttpClient(environment);

      let request = new paypal.orders.OrdersCaptureRequest(req.body.orderID);
      request.requestBody({});
      // Call API with your client and get a response for your call
      let response = await client.execute(request);

      return res.status(200).json({ response });
    } catch (error) {
      return next(error);
    }
  },
};

module.exports = ControllerPayment;
