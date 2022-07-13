const mongoose = require("mongoose");

const dataSchema = new mongoose.Schema({
  name: {
    required: true,
    type: String,
  },
  username: {
    required: true,
    unique: true,
    type: String,
  },
  age: {
    required: true,
    type: Number,
  },
  ph: {
    required: true,
    type: Number,
  },
  bp_type: {
    // required: true,
    type: String,
  },
});

module.exports = mongoose.model("Data", dataSchema);
