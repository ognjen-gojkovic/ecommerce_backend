require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const ConnectDB = require("./config/ConnectDB");
const errorMiddleware = require("./middlewares/Middleware.error");
const cloudinary = require("cloudinary");

/**
 * @desc
 * catch unhandled rejection
 * run it before connecting to the database
 */
process.on("uncaughtException", (err) => {
  console.log("Shutting down server due uncaught exception.");
  console.log(`Error: ${err.stack}`);

  process.exit(1);
});

/**
 * @desc
 * connect database
 */
ConnectDB();

/**
 * @desc
 * initialize server
 */
const app = express();

/**
 * @desc
 * setup cloudinary config
 */
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

app.use(cookieParser());
app.use(fileUpload({ useTempFiles: true, limits: { fileSize: "50mb" } }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(
  cors({
    credentials: true,
    origin: ["http://localhost:3000", "http://localhost:5000"],
  })
);

/**
 * @desc
 * apply routes
 */
app.use("/api", require("./routers/Router.Auth"));
app.use("/api", require("./routers/Router.User"));
app.use("/api", require("./routers/Router.Products"));
app.use("/api", require("./routers/Router.Upload"));
app.use("/api", require("./routers/Router.Order"));
app.use("/api", require("./routers/Router.Payment"));

/**
 * @desc
 * error middleware, always use it last
 */
app.use(errorMiddleware);

/**
 * @desc
 * connect the server to internet
 */
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
  console.log("NODE_ENV:", process.env.NODE_ENV);
});

process.on("unhandledRejection", (err, promise) => {
  console.log("Logged error: ", err);
  server.close(() => process.exit(1));
});
