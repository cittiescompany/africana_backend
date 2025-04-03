const mongoose = require("mongoose");
const User = require("./users.js") 
const propertySchema = new mongoose.Schema({
  productName: String,
  amount: Number,
  location: String,
  description: { type: String, default: null },
  sold: { type: Boolean, default: false },
  pictures: [{ type: String, ref: "File", default: null }], 
  videos: [{ type: String, ref: "File", default: null }], 
  seller: { type: mongoose.Schema.Types.ObjectId, ref: User },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: User },
});

const Property = mongoose.model("Property", propertySchema);
module.exports = Property;
