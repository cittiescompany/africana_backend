// models/Transaction.js
const mongoose = require('mongoose');
const {Schema} = mongoose;

const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
  },
  amount: {
    type: String,
    required: true,
  },
  convertedAmount: {
    type: Number,
    required: false,
  },
  exchangeRate: {
    type: Number,
    required: false,
  },
  from: {
    type: String,
    required: false,
  },
  to: {
    type: String,
    required: false,
  },
  paymentMethod: {
    type: String,
    required: false,
  },
  service: {
    type: String,
    required: false,
  },
  reason: {
    type: String,
    required: false,
  },
  senderEmail: {
    type: String,
    required: true,
  },
  recipientEmail: {
    type: String,
    required: true,
  },
  recipient_accountDetails: {type:Schema.Types.Mixed,required: false},
  senderDetails: {type:Schema.Types.Mixed,required: false},
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction
