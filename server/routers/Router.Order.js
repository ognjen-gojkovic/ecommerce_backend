const express = require("express");
const router = express.Router();
const controllerOrder = require("../controllers/Controller.Order");
const catchAsyncError = require("../middlewares/CatchAsyncErrors");
const { authAccess, authRole } = require("../middlewares/Middleware.Auth");

/**
 * @desc
 * create new order
 */
router
  .route("/order/new")
  .post(catchAsyncError(authAccess), catchAsyncError(controllerOrder.newOrder));

/**
 * @desc
 * fetch logged in user all orders
 */
router
  .route("/orders/me")
  .get(
    catchAsyncError(authAccess),
    catchAsyncError(controllerOrder.myAllOrders)
  );

/**
 * @desc
 * fetch logged in user single order
 */
router
  .route("/orders/me/:id")
  .get(
    catchAsyncError(authAccess),
    catchAsyncError(controllerOrder.mySingleOrder)
  );

/**
 * @desc
 * ADMIN fetch all orders of single user
 */
router
  .route("/admin/orders")
  .get(
    catchAsyncError(authAccess),
    catchAsyncError(authRole("admin")),
    catchAsyncError(controllerOrder.adminAllUsersOrders)
  );

/**
 * @desc
 * ADMIN update / process order
 */
router
  .route("/admin/orders/:id")
  .put(
    catchAsyncError(authAccess),
    catchAsyncError(authRole("admin")),
    catchAsyncError(controllerOrder.adminUpdateOrder)
  );

/**
 * @desc
 * ADMIN delete order
 */
router
  .route("/admin/orders/:id")
  .delete(
    catchAsyncError(authAccess),
    catchAsyncError(authRole("admin")),
    catchAsyncError(controllerOrder.adminDeleteOrder)
  );

module.exports = router;
