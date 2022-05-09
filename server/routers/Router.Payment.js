const express = require("express");
const router = express.Router();
const controllerPayment = require("../controllers/Controller.Payment");
const catchAsyncError = require("../middlewares/CatchAsyncErrors");
const { authAccess } = require("../middlewares/Middleware.Auth");

/**
 * @desc
 * init payment
 */
router
  .route("/create_payment")
  .post(catchAsyncError(controllerPayment.createPayment));

/**
 * @desc
 * execute payment
 */
router
  .route("/execute_payment")
  .post(catchAsyncError(controllerPayment.executePayment));

module.exports = router;
