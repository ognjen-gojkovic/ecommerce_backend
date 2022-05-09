require("dotenv");
const Products = require("../models/Model.Product");
const products = require("../data/products.json");
const connectDB = require("../config/ConnectDB");

connectDB();

const seedProducts = async () => {
  try {
    await Products.deleteMany();
    console.log("Products are deleted.");

    await Products.insertMany(products);
    console.log("Products are uploded.");

    process.exit();
  } catch (error) {
    console.log(error.message);
    process.exit(1);
  }
};

seedProducts();
