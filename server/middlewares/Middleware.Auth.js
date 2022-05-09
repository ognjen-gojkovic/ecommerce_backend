const jwt = require("jsonwebtoken");
const User = require("../models/Model.User");
const ErrorHandler = require("../utils/ErrorHandler");

const MiddlewareAuth = {
  /**
   * @desc
   * middleware that validates access to app resources
   * based on jwt that user recives on register/login
   */
  authAccess: async (req, res, next) => {
    try {
      let token;
      if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
      ) {
        token = req.headers.authorization.split(" ")[1];
      }

      if (!token) {
        next(new ErrorHandler("You are not authenticated!", 401));
      }

      /**
       * @desc
       * if there is token and token is valid
       * pull user from DB and attach it to 'req' object
       * and forward it to next middleware
       */
      jwt.verify(token, process.env.JWT_ACCESS_SECRET, async (err, decoded) => {
        if (err) return next(new ErrorHandler("Invalid Authorization", 403));

        const user = await User.findById(decoded.id);
        req.user = user;
        next();
      });
    } catch (error) {
      next(error);
    }
  },
  /**
   * @desc
   * middleware that checks is user admin or not
   */
  authRole:
    (admin = false) =>
    (req, res, next) => {
      if (!admin)
        return next(
          new ErrorHandler(
            "You are not authorized to access this resource!",
            400
          )
        );
      return next();
    },
};

module.exports = MiddlewareAuth;
