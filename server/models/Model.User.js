const mongoose = require("mongoose");
const validator = require("validator");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const CryptoJS = require("crypto-js");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Please enter your username."],
      maxlength: [30, "Your username cannot exceed 30 characters."],
    },
    email: {
      type: String,
      required: [true, "Please enter your email."],
      unique: true,
      validate: [validator.isEmail, "Please enter valid email address."],
    },
    password: {
      type: String,
      required: [true, "Please enter your password."],
      minlength: [6, "Your password must be at least 6 characters long."],
      select: false,
    },
    avatar: {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
    role: {
      type: {
        type: String,
        default: "user",
      },
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  }
);

/**
 * @desc
 * hash password
 */
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await CryptoJS.AES.encrypt(
    this.password,
    process.env.PASSWORD_KEY
  );
});
/**
 * @desc
 * validate password
 */
UserSchema.methods.matchPasswords = function (password) {
  const DBpassword = CryptoJS.AES.decrypt(
    this.password,
    process.env.PASSWORD_KEY
  ).toString(CryptoJS.enc.Utf8);
  if (DBpassword !== password) return false;
  else return true;
};

/**
 * @desc
 * generate access JWT
 */
UserSchema.methods.generateAccessToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRE,
  });
};

/**
 * @desc
 * generate refresh JWT
 */
UserSchema.methods.generateRefreshToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE,
  });
};

/**
 * @desc
 * generate forgot password token
 */
UserSchema.methods.generateResetPasswordToken = function () {
  // generate token
  const resetToken = crypto.randomBytes(20).toString("hex");

  // hash token
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // set expire time
  this.resetPasswordExpire = Date.now() + 5 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model("user", UserSchema);
