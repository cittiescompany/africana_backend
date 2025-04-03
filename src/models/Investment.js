const mongoose = require("mongoose");
const User = require("./users.js") 
const investmentSchema = new mongoose.Schema({
  productName: String,
  amountPerUnit: Number,
  rate: { type: Number, default: null },
  period: { type: String, default: null },
  description: { type: String, default: null },
  pictures: [{ type: String, ref: "File", default: null }], 
  videos: [{ type: String, ref: "File", default: null }], 
  creator: { type: mongoose.Schema.Types.ObjectId, ref: User }, // Investment creator
  totalShares: Number, 
  sharesSold: { type: Number, default: 0 },
  investors: [
      {
          user: { type: mongoose.Schema.Types.ObjectId, ref: User }, // Investor
          sharesBought: Number, 
          amountInvested: Number, 
          date: { type: Date, default: Date.now },
      }
  ],

  // productName: String,
  // amountPerUnit: Number, // Price per share
  // rate: { type: Number, default: null }, // ROI percentage
  // period: { type: String, default: null }, // Duration (e.g., 6 months)
  // pictures: [{ type: String }], 
  // videos: [{ type: String }],
  // totalShares: Number, // Total available shares
  // sharesSold: { type: Number, default: 0 }, // Shares already sold
  // creator: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const Investment = mongoose.model("Investment", investmentSchema);
module.exports = Investment;
