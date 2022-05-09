const express = require("express");
const MiddlewareAuth = require("../middlewares/Middleware.Auth");
const catchAsyncError = require("../middlewares/CatchAsyncErrors");
const ControllerProduct = require("../controllers/Controller.Product");

const router = express.Router();

/**
 * @desc
 * create new product
 * only admin
 */
router
  .route("/admin/products/new")
  .post(
    catchAsyncError(MiddlewareAuth.authAccess),
    catchAsyncError(MiddlewareAuth.authRole("admin")),
    catchAsyncError(ControllerProduct.createProduct)
  );

/**
 * @desc
 * fetch all products
 */
router
  .route("/products")
  .get(catchAsyncError(ControllerProduct.getAllProducts));

/**
 * @desc
 * fetch all products as admin
 */
router
  .route("/admin/products")
  .get(
    catchAsyncError(MiddlewareAuth.authAccess),
    catchAsyncError(MiddlewareAuth.authRole("admin")),
    catchAsyncError(ControllerProduct.getAllAdminProducts)
  );

/**
 * @desc
 * fetch single product
 */
router
  .route("/products/:id")
  .get(catchAsyncError(ControllerProduct.getSingleProduct));

/**
 * @desc
 * update product
 * only admin
 */
router
  .route("/admin/products/:id")
  .put(
    catchAsyncError(MiddlewareAuth.authAccess),
    catchAsyncError(MiddlewareAuth.authRole("admin")),
    catchAsyncError(ControllerProduct.updateProduct)
  );

/**
 * @desc
 * delete product
 * only admin
 */
router
  .route("/admin/products/:id")
  .delete(
    catchAsyncError(MiddlewareAuth.authAccess),
    catchAsyncError(MiddlewareAuth.authRole("admin")),
    catchAsyncError(ControllerProduct.deleteProduct)
  );

/**
 * @desc
 * create product review
 * only users
 */
router
  .route("/products/reviews")
  .post(
    catchAsyncError(MiddlewareAuth.authAccess),
    catchAsyncError(ControllerProduct.createProductReview)
  );

/**
 * @desc
 * fetch product reviews
 */
router
  .route("/products/reviews/:id")
  .get(catchAsyncError(ControllerProduct.getProductReviews));

/**
 * @desc
 * delete product review
 * only admin
 */
router
  .route("/admin/products/reviews/:productId/:reviewId")
  .delete(
    catchAsyncError(MiddlewareAuth.authAccess),
    catchAsyncError(MiddlewareAuth.authRole("admin")),
    catchAsyncError(ControllerProduct.deleteProductReview)
  );

module.exports = router;
