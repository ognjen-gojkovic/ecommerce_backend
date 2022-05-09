const User = require("../models/Model.User");
const ErrorHandler = require("../utils/ErrorHandler");
const crypto = require("crypto");
const cloudinary = require("cloudinary");
const sendEmail = require("../utils/SendEmail");

const ControllerUser = {
  /**
   * @desc
   * get details off currently logged in user
   * @url /api/me
   */
  getUserProfile: async (req, res, next) => {
    try {
      /**
       * @desc
       * fetch user from database
       */
      const user = await User.findById(req.user._id);

      res.status(200).json({
        success: true,
        msg: "Success",
        user,
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * @desc
   * logout user
   * @url /api/logout
   */
  logout: (req, res, next) => {
    try {
      res.clearCookie("refresh_token");

      return res.status(200).json({
        success: true,
        msg: "Logged out.",
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * @desc
   * send email with url for password recovery
   * @url /api/password/forgot
   */
  forgotPassword: async (req, res, next) => {
    try {
      /**
       * @desc
       * find user in database
       */
      const user = await User.findOne({ email: req.body.email });

      if (!user) return next(new ErrorHandler("User doesn't exists.", 404));

      /**
       * @desc
       * generate reset pasword token and save it to database
       */
      const resetPasswordToken = user.generateResetPasswordToken();
      await user.save({ validateBeforeSave: false });

      /**
       * @desc
       * create url fo rreset password
       */
      const resetUrl = `${req.protocol}://${req.get(
        "host"
      )}/api/password/reset/${resetPasswordToken}`;

      const message = `Your reset password token is as follows;\n
      \n${resetUrl}\n\nIf you have not requested this email ignore it.`;

      try {
        /**
         * @desc
         * send reset password token and message vie email
         */
        await sendEmail({
          email: user.email,
          subject: "Password Recovery.",
          message,
        });
      } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
        return next(error);
      }

      /**
       * @desc
       * send respons
       */
      res.status(200).json({
        success: true,
        msg: `Email sent to: ${user.email}`,
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * @desc
   * reset password
   * @url /api/password/reset/:resetToken
   */
  resetPassword: async (req, res, next) => {
    try {
      /**
       * @desc
       * hash reset token
       */
      const resetPassToken = crypto
        .createHash("sha256")
        .update(req.params.resetToken)
        .digest("hex");

      /**
       * @desc
       * find user in database
       */
      const user = await User.findOne({
        resetPasswordToken: resetPassToken,
        resetPasswordExpire: { $gt: Date.now() },
      });

      if (!user)
        return next(
          new ErrorHandler(
            "Password reset token is invalid\nor has been expired.",
            400
          )
        );

      /**
       * @desc
       * check if passwords match
       */
      if (req.body.password !== req.body.confirmPassword)
        return next(new ErrorHandler("Passwords do not match.", 400));

      /**
       * @desc
       * set new Password and remove reset password token and expire time
       */
      user.password = req.body.confirmPassword;
      user.resetPasswordToken = "";
      user.resetPasswordExpire = "";

      console.log("reset user:", user);

      await user.save();

      /**
       * @desc
       * remove password, res field from user object that we will send to frontend
       */
      const { password, resetPasswordToken, resetPasswordExpire, ...rest } =
        user._doc;
      const newUser = { ...rest };

      return res.status(200).json({
        success: true,
        msg: "Password reset success.",
        user: newUser,
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * @desc
   * update Password
   * @url /api/password/update
   */
  updatePassword: async (req, res, next) => {
    try {
      /**
       * @desc
       * find user in database
       */
      const user = await User.findById(req.user._id).select("+password");

      /**
       * @desc
       * match passwords
       */
      const isMatch = user.matchPasswords(req.body.oldPassword);

      if (!isMatch) return next(new ErrorHandler("Password is invalid.", 400));

      /**
       * @desc
       * save new password into database
       */
      user.password = req.body.newPassword;
      await user.save();

      /**
       * @desc
       * generate access token
       */
      const accessToken = user.generateAccessToken();

      /**
       * @desc
       * remove password field from user object that we will send to frontend
       */
      const { password, resetPasswordToken, resetPasswordExpire, ...rest } =
        user._doc;
      const newUser = { ...rest };

      return res.status(200).json({
        success: true,
        msg: "Password updated successfully.",
        accessToken,
        user: newUser,
      });
    } catch (error) {
      return next(err);
    }
  },

  /**
   * @desc
   * update user Profile
   * @url /api/me/update
   */
  updateProfile: async (req, res, next) => {
    try {
      const newUserData = {
        username: req.body.username,
        email: req.body.email,
      };

      /**
       * @desc
       * update avatar
       * delete previous images from cloudinary before uploading new one
       */
      if (!req.files !== []) {
        const user = await User.findById(req.user._id);
        const image_id = user.avatar.public_id;

        const res = await cloudinary.v2.uploader.destroy(image_id);

        const result = await cloudinary.v2.uploader.upload(
          req.files.avatar.tempFilePath,
          {
            folder: "avatars",
            width: 150,
            crop: "scale",
          }
        );

        /**
         * @desc
         * attach avatar to response object
         */
        newUserData.avatar = {
          public_id: result.public_id,
          url: result.secure_url,
        };
      }

      /**
       * @desc
       * update user
       */
      const user = await User.findByIdAndUpdate(req.user._id, newUserData, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
      });

      console.log("updated user:", user);

      return res.status(200).json({
        success: true,
        msg: "Profile Updated.",
        user,
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * @desc
   * ADMIN get all users
   * @url /api/admin/users
   */
  adminGetAllUsers: async (req, res, next) => {
    try {
      /**
       * @desc
       * fetch all users from database
       * in mongo how to update field
       *  db.users.updateOne({"email": "ognjen1804@gmail.com"}, {$set: {"role": {"type": "admin"}}})
       */
      const users = await User.find();

      return res.status(200).json({
        success: true,
        msg: "Success",
        users,
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * @desc
   * ADMIN get user details
   * @url /api/admin/users/:id
   */
  adminGetUserDetails: async (req, res, next) => {
    try {
      /**
       * @desc
       * fetch user from database
       */
      const user = await User.findById(req.params.id);

      if (!user)
        return next(
          new ErrorHandler(`User not found with id: ${req.params.id}`, 404)
        );

      return res.status(200).json({
        success: true,
        msg: "Success",
        user,
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * @desc
   * ADMIN update user profile
   * @url /api/admin/users/:id
   */
  adminUpdateUser: async (req, res, next) => {
    try {
      const newUserData = {
        username: req.body.username,
        email: req.body.email,
        role: req.body.role,
      };

      /**
       * @desc
       * update user
       */
      const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
      });

      return res.status(200).json({
        success: true,
        msg: "Profile Updated",
        user,
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * @desc
   * ADMIN delete user
   * @url /api/admin/users/:id
   */
  adminDeleteUser: async (req, res, next) => {
    try {
      /**
       * @desc
       * fetch user from database
       */
      const user = await User.findById(req.params.id);
      if (!user)
        return next(
          new ErrorHandler(`User not found with id: ${req.params.id}`, 404)
        );

      /**
       * @desc
       * remove profile picture, avatar from cloudinary
       */
      const result = await cloudinary.v2.uploader.destroy(
        user.avatar.public_id
      );

      /**
       * @desc
       * delete user from database
       */
      user.remove();

      return res.status(200).json({
        success: true,
        msg: "User deleted.",
      });
    } catch (error) {
      return next(error);
    }
  },
};

module.exports = ControllerUser;
