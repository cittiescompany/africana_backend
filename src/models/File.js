const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
    hash: { type: String, unique: true }, // Unique hash for each file
    url: String, // Cloudinary URL
  });

module.exports =  mongoose.model('File', fileSchema);