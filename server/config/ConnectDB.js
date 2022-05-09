require("dotenv").config();
const mongoose = require("mongoose");

const ConnectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to database...");
  } catch (error) {
    console.log("Database connection error: ", error);
    process.exit(1);
  }
};

module.exports = ConnectDB;
