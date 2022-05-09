const ErrorHandler = require("../utils/ErrorHandler");

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode ? err.statusCode : 500;
  err.message = err.message ? err.message : "Internal Server Error.";

  /**
   * @desc
   * it needs to be trimed because
   * when we run script to set NODE_ENV with '&&' it adds space ' ' at the end like:
   * SET NODE_ENV=PRODUCTION && nodemon index.js
   * "PRODUCTION" + " " => "PRODUCTION "
   */
  const nodeEnv = process.env.NODE_ENV.trim();

  if (nodeEnv === "DEVELOPMENT") {
    res.status(err.statusCode).json({
      success: false,
      msg: err.message,
      stack: err.stack,
      error: err,
    });
  }

  /**
   * @desc
   * PRODUCTION ENVIROMENT
   */

  let error = { ...err };
  if (nodeEnv === "PRODUCTION") {
    error.message = err.message;

    /**
     * @desc
     * no input error handler
     */
    if (err.name === "CastError") {
      const message = `Resource not Found. Invalid: ${err.path}`;
      error = new ErrorHandler(message, 400);
    }

    /**
     * @desc
     * invalid input error handler
     */
    if (err.name === "ValidationError") {
      const message = Object.values(err.errors).map((value) => value.message);
      error = new ErrorHandler(message, 400);
    }

    /**
     * @desc
     * mongoose duplicate fields error handler
     */
    if (err.code === 11000) {
      const message = `Duplicate ${Object.keys(err.keyValue)} entered.`;
      error = new ErrorHandler(message, 400);
    }

    /**
     * @desc
     * wrong jwt error handler
     */
    if (err.name === "JsonWebTokenError") {
      const message = "JSON Web Token is Invalid. Try Again.";
      error = new ErrorHandler(message, 400);
    }

    /**
     * @desc
     * expired jwt error handler
     */
    if (err.name === "TokenExpiredError") {
      const message = "JSON Web Token is Expired. Try Again.";
      error = new ErrorHandler(message, 400);
    }

    res.status(err.statusCode).json({
      success: false,
      msg: error.message || "Internal Server Error.",
    });
  }
};
