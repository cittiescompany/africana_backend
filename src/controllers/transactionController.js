// controllers/transactionController.js
const Transaction = require("../models/Transaction");

// Create Transaction
exports.createTransaction = async (req, res) => {
  try {
    const {
      recipient_accountDetails,
      senderDetails,
    } = req.body;

    const transaction = new Transaction({
    ...req.body,
      senderEmail:senderDetails?.email,
      recipientEmail: recipient_accountDetails?.email,
    });

    await transaction.save();

    res.status(201).json({ success: true, transaction });
  } catch (error) {
    console.error('Create Transaction Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error });
  }
};

exports.getUserTransactions = async (req, res) => {
    try {
      const userEmail = req.params.email;
  
      const transactions = await Transaction.find({
        $or: [
          { senderEmail: userEmail },
          { recipientEmail: userEmail },
        ],
      }).sort({ createdAt: -1 });
  
      return res.status(200).json({ success: true, transactions });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  };
