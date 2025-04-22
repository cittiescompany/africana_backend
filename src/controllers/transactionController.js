// controllers/transactionController.js
const Transaction = require("../models/Transaction");
const User=require('../models/users')
const cron = require('node-cron')
const scheduledJobs = new Map();

// Create Transaction
// exports.createTransaction = async (req, res) => {
//   try {
//     const {
//       recipient_accountDetails,
//       senderDetails,
//     } = req.body;

//     const transaction = new Transaction({
//     ...req.body,
//       senderEmail:senderDetails?.email,
//       recipientEmail: recipient_accountDetails?.email,
//     });

//     await transaction.save();

//     res.status(201).json({ success: true, transaction });
//   } catch (error) {
//     console.error('Create Transaction Error:', error);
//     res.status(500).json({ success: false, message: 'Server error', error });
//   }
// };

// * * * * *
// 0 0 1 * *

exports.createTransaction = async (req, res) => {
  try {
    const {
      recipient_accountDetails,
      senderDetails,
      plan,
      bvn,
      idCard,
    } = req.body;
   
      if (senderDetails?._id && (bvn || idCard)) {
        await User.findOneAndUpdate(
          { _id: senderDetails._id },
          {
            ...(bvn && { bvn }),
            ...(idCard && { idCard }),
          },
          { new: true }
        );
      }


    const transaction = new Transaction({
      ...req.body,
      isRecurringActive: plan === 'recurrence',
      senderEmail: senderDetails?.email,
      recipientEmail: recipient_accountDetails?.email,
      isFirstCharge: true,
      charge: 0,
      convertedCharge: 0,
      dueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)), // One month from now
    });

    const savedTransaction = await transaction.save();

    if (plan&&plan === 'recurrence') {
      scheduleRecurringTransaction(savedTransaction.toObject());
    }

    res.status(201).json({ success: true, transaction: savedTransaction });
  } catch (error) {
    console.error('Create Transaction Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error });
  }
};


const scheduleRecurringTransaction = (transactionData) => {
  const { _id, senderEmail } = transactionData;

 const job = cron.schedule('0 0 * * *', async () => {
    const today = new Date();
    const day = today.getDate();
  
    const dueTransactions = await Transaction.find({
      isRecurringActive: true,
      dueDate: {
        $lte: today,
      },
    });
  
    for (const original of dueTransactions) {
      try {
        const originalAmount = parseFloat(original.amount);
        const convertedAmount = parseFloat(original.convertedAmount);
        const serviceFee = original.isFirstCharge ? 0 : originalAmount * 0.01;
        const convertedServiceFee = original.isFirstCharge ? 0 : convertedAmount * 0.01;
  
        const newTransaction = new Transaction({
          ...original.toObject(),
          _id: undefined,
          createdAt: new Date(),
          isFirstCharge: false,
          charge: serviceFee,
          convertedCharge: convertedServiceFee,
          chargeHistory: [
            {
              date: new Date(),
              amount: originalAmount + serviceFee,
              convertedAmount: convertedAmount + convertedServiceFee,
              status: 'success',
            },
          ],
          dueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)), // next due date
        });
  
        await newTransaction.save();
      } catch (err) {
        console.error('Failed to process recurring transaction:', err);
      }
    }
  })  

  job.start();
  scheduledJobs.set(_id.toString(), job);
};



exports.getActiveRecurringTransactions = async (req, res) => {
  try {
    const { userId } = req.params;

    const activeSubscriptions = await Transaction.find({
      'senderDetails._id': userId,
      plan: 'recurrence',
      isRecurringActive: true,
      isFirstCharge: true, // Only fetch the first/main active subscription
    });

    res.status(200).json({ success: true, subscriptions: activeSubscriptions });
  } catch (error) {
    console.error('Get Active Recurring Transactions Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


exports.cancelRecurringTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    // Stop the cron job
    const job = scheduledJobs.get(id);
    if (job) {
      job.stop();
      scheduledJobs.delete(id);
    }

    // Update the DB record
    const updatedTransaction = await Transaction.findByIdAndUpdate(
      id,
      { isRecurringActive: false },
      { new: true }
    );

    if (!updatedTransaction) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Subscription successfully cancelled',
      transaction: updatedTransaction,
    });
  } catch (error) {
    console.error('Cancel Subscription Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};



exports.getUserTransactions = async (req, res) => {
    try {
      const userEmail = req.params.email;
      console.log('email:',userEmail);
      
  
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


  // function (){
  //   "67fbf05e237d0141a9eef5e5"
  // }

  //     (async () => {
  //   try {
  //       await Transaction.deleteMany({'senderDetails._id':"67fbf05e237d0141a9eef5e5"});
  //     const transactions = await Transaction.find();
  //     console.log("All Transactions:", transactions);
  //   } catch (error) {
  //     console.error("Error fetching investments:", error.message);
  //   }
  // })();