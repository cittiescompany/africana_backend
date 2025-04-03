const mongoose = require("mongoose");

const investmentShareSchema = new mongoose.Schema({
  investor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  investment: { type: mongoose.Schema.Types.ObjectId, ref: "Investment" },
  sharesBought: Number, // Number of shares purchased
  amountInvested: Number, // Total amount paid
  datePurchased: { type: Date, default: Date.now }
});

module.exports = mongoose.model("InvestmentShare", investmentShareSchema);
