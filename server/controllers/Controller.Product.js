const Product = require("../models/Model.Product");
const ErrorHandler = require("../utils/ErrorHandler");
const APIFeatures = require("../utils/APIFeatures");
const cloudinary = require("cloudinary");

const ControllersProduct = {
  /**
   * @desc
   * create product
   * @url /api/admin/products/new
   */
  createProduct: async (req, res, next) => {
    try {
      /**
       * @desc
       * save images to cloudinary service
       * and their url link into database
       */

      let images = [];
      if (typeof req.files.images == "object") {
        // if there is only one image just
        // push it to array
        images.push(req.files.images);
      } else {
        // if there is more than one image replace arrays
        images = req.files.images;
      }

      const imagesLinks = [];

      for (let i = 0; i < images.length; i++) {
        const result = await cloudinary.v2.uploader.upload(
          images[i].tempFilePath,
          {
            folder: "products",
          }
        );

        /**
         * @desc
         * links we get from cloudinary
         * push to array and attach that array to images prop on req.body
         */
        imagesLinks.push({
          public_id: result.public_id,
          url: result.secure_url,
        });
      }

      req.body.images = imagesLinks;

      const product = await Product.create(req.body);

      return res.status(200).json({
        success: true,
        msg: "Product created.",
        product,
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * @desc
   * fetch all products
   * @url /api/products
   */
  getAllProducts: async (req, res, next) => {
    try {
      const resPerPage = 8;
      const productsCount = await Product.countDocuments();
      const apiFeatures = new APIFeatures(Product.find(), req.query)
        .search()
        .filter()
        .pagination(resPerPage);

      const products = await apiFeatures.query;

      return res.status(200).json({
        success: true,
        msg: "Success.",
        productsCount,
        resPerPage,
        products,
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * @desc
   * fetch all products for admin
   * @url /api/admin/products
   */
  getAllAdminProducts: async (req, res, next) => {
    try {
      const products = await Product.find();

      return res.status(200).json({
        success: true,
        msg: "Success",
        products,
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * @desc
   * fetch single product
   * @url /api/product/:id
   */
  getSingleProduct: async (req, res, next) => {
    try {
      const { id } = req.params;

      /**
       * @desc
       * fetch product from database
       */
      const product = await Product.findById(id);
      if (!product) return next(new ErrorHandler("No such product.", 404));

      return res.status(200).json({
        success: true,
        msg: "Success",
        product,
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * @desc
   * update product
   * @url /api/admin/products/:id
   */
  updateProduct: async (req, res, next) => {
    try {
      /**
       * @desc
       * find product in database
       */
      const product = await Product.findById(req.params.id);
      if (!product) return next(new ErrorHandler("No such product.", 404));

      /**
       * @desc
       * update images in cloudinary
       */
      let images = [];

      if (typeof req.files.images == "object") {
        // if images is only one image, just push it to temp images array
        images.push(req.files.images);
      } else {
        // if images are more than one then replace those arrays
        images = req.files.images;
      }

      let imagesLinks = [];

      if (images !== undefined && images.length > 0) {
        // delete images assosiated with product
        for (let i = 0; i < product.images.length; i++) {
          const result = await cloudinary.v2.uploader.destroy(
            product.images[i].public_id
          );
        }

        // upload new images
        for (let i = 0; i < images.length; i++) {
          const result = await cloudinary.v2.uploader.upload(
            images[i].tempFilePath,
            {
              folder: "products",
            }
          );

          imagesLinks.push({
            public_id: result.public_id,
            url: result.secure_url,
          });
        }
      }
      // on req.body on images property attach those images liinks that points to coludinary service where
      // our product images are stored
      req.body.images = imagesLinks;

      // in case no images were uploaded
      const withNoImages = {
        name: req.body.name,
        price: req.body.price,
        description: req.body.description,
        stock: req.body.stock,
        seller: req.body.seller,
      };

      /**
       * @desc
       * upload product in database
       */
      Product.findByIdAndUpdate(
        req.params.id,
        req.body.images.length > 0 ? req.body : withNoImages,
        { new: true, runValidators: true },
        (err, doc) => {
          if (err) return next(err);
          return res
            .status(201)
            .json({ success: true, msg: "Product Updated.", product: doc });
        }
      );
    } catch (error) {
      return next(error);
    }
  },

  /**
   * @desc
   * delete product
   * @url api/admin/products/:id
   */
  deleteProduct: async (req, res, next) => {
    try {
      const { id } = req.params;

      /**
       * @desc
       * fetch product from database
       */
      const product = await Product.findById(id);
      if (!product) return next(new ErrorHandler("No such product.", 404));

      /**
       * @desc
       * delete images assosiated with product
       */
      for (let i = 0; i < product.images.length; i++) {
        const result = await cloudinary.v2.uploader.destroy(
          product.images[i].public_id
        );
      }

      /**
       * @desc
       * delete product from database
       */
      await product.remove();

      return res.status(200).json({
        success: true,
        msg: "Product deleted.",
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * @desc
   * create product review
   * @url /api/products/reviews
   */
  createProductReview: async (req, res, next) => {
    try {
      const { rating, comment, product_id } = req.body;

      const review = {
        user: req.user._id,
        name: req.user.username,
        rating: Number(rating),
        comment,
      };

      const product = await Product.findById(product_id);

      const isReviewed = product.reviews.find(
        (review) => review.user.toString() == req.user._id.toString()
      );

      /**
       * @desc
       * if review exists update it
       * one user can make one review
       */
      if (isReviewed) {
        product.reviews.forEach((review) => {
          if (review.user.toString() == req.user._id.toString()) {
            review.comment = comment;
            review.rating = rating;
          }
        });
        /**
         * @desc
         * if review don't exists create new
         */
      } else {
        product.reviews.push(review);
        product.numOfReviews = product.reviews.length;
      }

      /**
       * @desc
       * average review score
       */
      product.rating =
        product.reviews.reduce((acc, item) => {
          return (acc += item.rating);
        }, 0) / product.reviews.length;

      /**
       * @desc
       * save review into database
       */
      await product.save({ validateBeforeSave: false });

      return res
        .status(200)
        .json({ success: true, msg: "Review Created Successfully." });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * @desc
   * get product reviews
   * @url /api/products/reviews
   */
  getProductReviews: async (req, res, next) => {
    try {
      const product = await Product.findById(req.query.id);

      if (!product) return next(new ErrorHandler("Invalid product ID.", 400));

      return res
        .status(200)
        .json({ success: true, msg: "Success.", reviews: product.reviews });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * @desc
   * delete product review
   * @url /api/admin/products/reviews
   */
  deleteProductReview: async (req, res, next) => {
    try {
      const product = await Product.findById(req.params.productId);

      if (!product) return next(new ErrorHandler("Invalid product ID.", 400));

      /**
       * @desc
       * delete review by filtering it from reviews array
       */
      const reviews = product.reviews.filter(
        (review) => review._id.toString() !== req.params.reviewId.toString()
      );

      const numOfReviews = reviews.length;

      /**
       * @desc
       * average review score
       */
      const ratings =
        product.reviews.reduce((acc, item) => {
          return (acc += item.rating);
        }, 0) / reviews.length;

      const newProduct = await Product.findByIdAndUpdate(
        req.params.productId,
        {
          reviews,
          ratings,
          numOfReviews,
        },
        {
          new: true,
          runValidators: true,
          useFindAndModify: false,
        }
      );

      return res
        .status(200)
        .json({ success: true, msg: "Success.", reviews: newProduct.reviews });
    } catch (error) {
      return next(error);
    }
  },
};

module.exports = ControllersProduct;
