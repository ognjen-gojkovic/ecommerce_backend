const cloudinary = require("cloudinary");
const User = require("../models/Model.User");
const ErrorHandler = require("../utils/ErrorHandler");
const removeTemp = require("../utils/removeTemp");

const ControllerAuth = {
  /**
   * @desc
   * register user
   * @url /api/register
   */
  register: async (req, res, next) => {
    try {
      /**
       * @desc
       * to get the file we needed to use in index.js file 'express-fileUpload' middleware
       */
      const { username, email, password } = req.body;
      const avatar = req.files.avatar;
      console.log("req.files", req.files);

      /**
       * @desc
       * check if all fields are provided
       */
      if (!username || !email)
        return next(
          new ErrorHandler("You must provide input to all fields.", 400)
        );
      if (!avatar) return next(new ErrorHandler("No image uploaded.", 400));
      if (!password || password.length < 6)
        return next(
          new ErrorHandler("Password must be at least 6 charaters long.", 400)
        );

      /**
       * @desc
       * check if user already exists
       */

      const alreadyExists = await User.findOne({ email });

      if (alreadyExists)
        return next(new ErrorHandler("User already exists!", 400));

      /**
       * @desc
       * upload profile picture to cloudinary service
       */
      const profilePicture = await cloudinary.v2.uploader.upload(
        avatar.tempFilePath,
        {
          folder: "avatars",
          width: 150,
          crop: "scale",
        }
      );

      /**
       * @desc
       * save user to database
       */
      const user = await User.create({
        username,
        email,
        password,
        avatar: {
          public_id: profilePicture.public_id,
          url: profilePicture.secure_url,
        },
      });

      /**
       * @desc
       * remove image uploaded from frontend in 'tmp' folder
       */
      removeTemp(avatar.tempFilePath);

      /**
       * @desc
       * generate access and refresh token
       */
      const accessToken = user.generateAccessToken();
      const refreshToken = user.generateRefreshToken();

      /**
       * @desc
       * remove password field from document we will send to frontend
       */
      const newUser = { ...user._doc };
      newUser.password = undefined;

      /**
       * @desc
       * save refresh token to cookies header
       * on client side in 'fetch' method should be set option 'credentials: "include"'
       * on server side in cors options object should be set 'credentials: true'
       *
       * secure should be enabled when using 'https' protocol
       * when setting cookie-header from cross-origin 'sameSite' property should be 'none'
       * also in browser settings in my case 'Goggle Chrome' in 'security' section
       * should be enabled setting cookies from the third party
       */
      if (newUser && refreshToken.length > 50)
        res.cookie("refresh_token", refreshToken, {
          maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
          httpOnly: true,
          secure: true,
          sameSite: "none",
        });

      return res.status(201).json({
        success: true,
        msg: "Registered Successfully.",
        user: newUser,
        accessToken,
      });
    } catch (error) {
      return next(error);
    }
  },
  /**
   * @desc
   * login user
   * @url /api/login
   */
  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;

      /**
       * @desc
       * check if user provided inputs
       */
      if (!email) return next(new ErrorHandler("Email must be provided.", 400));
      if (!password || password.length < 6)
        return next(
          new ErrorHandler("Password must be at least 6 characters long.", 400)
        );

      /**
       * @desc
       * fetch user from database
       * and if don't exist return error
       */
      const user = await User.findOne({ email }).select("+password");
      if (!user)
        return next(
          new ErrorHandler(
            "There is no user with those credentials.\nYou first must register.",
            400
          )
        );

      /**
       * @desc
       * compare passwords
       * and if there is no match return error
       */
      const isMatch = user.matchPasswords(password);
      if (!isMatch) return next(new ErrorHandler("Invalid Password.", 400));

      /**
       * @desc
       * genenrate access and refresh tokens
       */
      const accessToken = user.generateAccessToken();
      const refreshToken = user.generateRefreshToken();

      /**
       * @desc
       * remove password field from user doc we will sent to frontend
       */
      const newUser = { ...user._doc };
      newUser.password = undefined;
      newUser.resetPasswordToken = undefined;
      newUser.resetPasswordExpire = undefined;
      newUser.createdAt = undefined;
      newUser._id = undefined;

      /**
       * @desc
       * save refresh token to cookies header
       */
      if (newUser && refreshToken.length > 50)
        res.cookie("refresh_token", refreshToken, {
          maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
          httpOnly: true,
          secure: true,
          sameSite: "none",
        });

      return res.status(201).json({
        success: true,
        msg: "Logged In.",
        user: newUser,
        accessToken,
      });
    } catch (error) {
      return next(error);
    }
  },
};

module.exports = ControllerAuth;
