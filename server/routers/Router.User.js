const express = require("express");
const MiddlewareAuth = require("../middlewares/Middleware.Auth");
const catchAsyncErrors = require("../middlewares/CatchAsyncErrors");
const ControllersUser = require("../controllers/Controller.User");

const router = express.Router();

/**
 * @desc
 * get user currently logged user profile
 */
router
  .route("/me")
  .get(
    catchAsyncErrors(MiddlewareAuth.authAccess),
    catchAsyncErrors(ControllersUser.getUserProfile)
  );

/**
 * @desc
 * logout currently logged in user
 */
router.route("/logout").get(catchAsyncErrors(ControllersUser.logout));

/**
 * @desc
 * send email to reset password
 */
router
  .route("/password/forgot")
  .post(catchAsyncErrors(ControllersUser.forgotPassword));

/**
 * @desc
 * reset password to new one
 */
router
  .route("/password/reset/:resetToken")
  .post(catchAsyncErrors(ControllersUser.resetPassword));

/**
 * @desc
 * update password as user
 */
router
  .route("/password/update")
  .post(
    catchAsyncErrors(MiddlewareAuth.authAccess),
    catchAsyncErrors(ControllersUser.updatePassword)
  );

/**
 * @desc
 * update profile as user
 */
router
  .route("/me/update")
  .put(
    catchAsyncErrors(MiddlewareAuth.authAccess),
    catchAsyncErrors(ControllersUser.updateProfile)
  );

/**
 * @desc
 * gat all users as admin
 */
router
  .route("/admin/users")
  .get(
    catchAsyncErrors(MiddlewareAuth.authAccess),
    catchAsyncErrors(MiddlewareAuth.authRole("admin")),
    catchAsyncErrors(ControllersUser.adminGetAllUsers)
  );

/**
 * @desc
 * get specific user profile as admin
 */
router
  .route("/admin/users/:id")
  .get(
    catchAsyncErrors(MiddlewareAuth.authAccess),
    catchAsyncErrors(MiddlewareAuth.authRole("admin")),
    catchAsyncErrors(ControllersUser.adminGetUserDetails)
  );

/**
 * @desc
 * update specific user profile as admin
 */
router
  .route("/admin/users/:id")
  .put(
    catchAsyncErrors(MiddlewareAuth.authAccess),
    catchAsyncErrors(MiddlewareAuth.authRole("admin")),
    catchAsyncErrors(ControllersUser.adminUpdateUser)
  );

/**
 * @desc
 * delete specific user profile as admin
 */
router
  .route("/admin/users/:id")
  .delete(
    catchAsyncErrors(MiddlewareAuth.authAccess),
    catchAsyncErrors(MiddlewareAuth.authRole("admin")),
    catchAsyncErrors(ControllersUser.adminDeleteUser)
  );
module.exports = router;
