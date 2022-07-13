const { v4: uuidv4 } = require("uuid");
const multer = require("multer");
const path = require("path");
const id = `${uuidv4()}`;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      id + path.extname(file.originalname)
      //   file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
});

module.exports = { storage, upload, id };
