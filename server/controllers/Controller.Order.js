const Order = require("../models/Model.Order");
const Product = require("../models/Model.Product");
const ErrorHandler = require("../utils/ErrorHandler");

const ControllerOrder = {
  /**
   * @desc
   * create new order
   * @url /api/order/new
   */
  newOrder: async (req, res, next) => {
    try {
      const {
        orderItems,
        shippingInfo,
        taxPrice,
        itemsPrice,
        shippingPrice,
        totalPrice,
        paymentInfo,
      } = req.body;

      /**
       * @desc
       * save order into database
       */
      const order = await Order.create({
        orderItems: orderItems.map((item) => {
          return {
            ...item,
            image: item.images[0].url,
            product: item._id,
          };
        }),
        shippingInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        paymentInfo,
        paidAt: Date.now(),
        user: req.user._id,
      });

      /**
       * @desc
       * return response
       */
      return res.status(200).json({
        success: true,
        msg: "Order created.",
        order,
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * @desc
   * fetch logged in user all orders
   * @url /api/orders/me
   */
  myAllOrders: async (req, res, next) => {
    try {
      /**
       * @desc
       * fetch all orders from database
       */
      const orders = await Order.find({ user: { _id: req.user._id } });

      if (!orders)
        return next(new ErrorHandler("No orders was found with this ID.", 404));

      /**
       * @desc
       * return response
       */
      return res.status(200).json({
        success: true,
        msg: "Success",
        orders,
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * @desc
   * fetch logged in user single order
   * @url /api/orders/me/:id
   */
  mySingleOrder: async (req, res, next) => {
    try {
      /**
       * @desc
       * fetch single order from database
       */
      const order = await Order.findById(req.params.id).populate(
        "user",
        "username email"
      );

      /**
       * @desc
       * no order return error
       */
      if (!order)
        return next(new ErrorHandler("No Order was found with this ID.", 404));

      /**
       * @desc
       * return response
       */
      return res
        .status(200)
        .json({ success: true, success: "Success.", order });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * @desc
   * ADMIN fetch all orders of single user
   * @url /api/admin/orders
   */
  adminAllUsersOrders: async (req, res, next) => {
    try {
      /**
       * @desc
       * fetch all user orders
       */
      const orders = await Order.find();

      if (!orders)
        return next(new ErrorHandler("User don't have any orders yet.", 404));

      let totalAmount = 0;

      orders.forEach((order) => {
        totalAmount += +order.totalPrice;
      });

      /**
       * @desc
       * return response
       */
      return res
        .status(200)
        .json({ success: true, msg: "Success.", orders, totalAmount });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * @desc
   * ADMIN update / process order
   * @url /api/admin/orders/:id
   */
  adminUpdateOrder: async (req, res, next) => {
    try {
      /**
       * @desc
       * check if order is already delivered.
       */
      const order = await Order.findById(req.params.id);

      if (order.orderStatus === "Delivered.")
        return next(new ErrorHandler("This order is already delivered.", 400));

      /**
       * @desc
       * update stock with new quantity
       */
      order.orderItems.forEach(async (item) => {
        await updateStock(item.product, item.quantity);
      });

      order.orderStatus = req.body.status;
      if (req.body.status == "Delivered.") order.deliveredAt = Date.now();

      await order.save();

      res.status(200).json({ success: true, success: "Order Updated." });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * @desc
   * ADMIN delete order
   * @url /admin/orders/:id
   */
  adminDeleteOrder: async (req, res, next) => {
    try {
      const order = await Order.findById(req.params.id);

      if (!order)
        return next(new ErrorHandler("No Order was found with this ID.", 404));

      await order.remove();

      res.status(200).json({ success: true, success: "Order Deleted." });
    } catch (error) {
      next(error);
    }
  },
};

/**
 * @desc
 * function to update stock after order was completed / status: 'sent'
 * called in update order controller
 */
async function updateStock(id, quantity) {
  const product = await Product.findById(id);
  product.stock = product.stock - quantity;

  await product.save({ validateBeforeSave: false });
}

module.exports = ControllerOrder;
