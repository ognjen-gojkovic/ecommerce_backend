const fs = require("fs");
/**
 * @note
 * after every upload, temp folder with temp file we uploaded
 * is created in our project folder. So we will create function for deleting this folder
 */
function removeTemp(path) {
  fs.unlink(path, (err) => {
    if (err) throw err;
  });
}

module.exports = removeTemp;
