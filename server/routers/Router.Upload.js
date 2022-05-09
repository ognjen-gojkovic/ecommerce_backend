const express = require("express");
const cloudinary = require("cloudinary");
const removeTemp = require("../utils/removeTemp");

const router = express.Router();

/**
 * @desc
 * upload route
 * upload user images to cloudinary service
 * @url /api/upload
 */
router.route("/upload").post((req, res) => {
  try {
    /**
     * @desc
     * check if there are files on req.files prop
     */
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({
        success: false,
        msg: "No files were upladed.",
      });
    }

    const file = req.files.file;

    /**
     * @desc
     * take care of files size
     * 1024 * 1024 = 1mb
     * 1024 * 1024 * 4 = 4mb
     */
    if (file.size > 1024 * 1024 * 4) {
      removeTemp(file.tempFilePath);
      return res.status(400).json({
        success: false,
        msg: "File size is to large.",
      });
    }

    /**
     * @desc
     * check file type
     */
    if (
      file.mimetype !== "image/jpeg" ||
      file.mimetype !== "image/jpg" ||
      file.mimetype !== "image/png"
    ) {
      removeTemp(file.tempFilePath);
      return res.status(400).json({
        success: false,
        mag: "File format is incorrect.",
      });
    }

    /**
     * @desc
     * upload file to cloudinary
     */
    cloudinary.v2.uploader.upload(
      file.tempFilePath,
      {
        folder: "ecommerce-3",
      },
      async (err, result) => {
        if (err) throw err;
        removeTemp(file.tempFilePath);
        return res.status(200).json({
          success: true,
          public_id: result.public_id,
          url: result.secure_url,
        });
      }
    );
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
});

/**
 * @desc
 * destroy file route
 * @url /api/destroy
 */
router.route("/destroy").post((req, res) => {
  const { public_id } = req.body;

  try {
    /**
     * @desc
     * check if public_id is provided
     */
    if (!public_id)
      return res.status(400).json({
        success: false,
        msg: "No images selected.",
      });

    /**
     * @desc
     * delete the image
     */
    cloudinary.v2.uploader.destroy(public_id, async (err, result) => {
      if (err) throw err;

      return res.status(200).json({
        success: true,
        msg: "Image Deleted",
      });
    });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
});

module.exports = router;
