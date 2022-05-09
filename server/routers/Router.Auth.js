const express = require("express");
const ControllerAuth = require("../controllers/Controller.Auth");
const catchAsyncErrors = require("../middlewares/CatchAsyncErrors");

const router = express.Router();

router.route("/register").post(catchAsyncErrors(ControllerAuth.register));
router.route("/login").post(catchAsyncErrors(ControllerAuth.login));

module.exports = router;
