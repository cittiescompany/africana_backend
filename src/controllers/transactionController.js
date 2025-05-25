// controllers/transactionController.js
const { senderNotification } = require("../helpers/auth");
const sendEmail = require("../helpers/mail");
const Stripe = require('stripe');
const Transaction = require("../models/Transaction");
const User=require('../models/users')
const cron = require('node-cron')
const scheduledJobs = new Map();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
exports.createStripePayment = async (req, res) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(req.body.amount*100), // e.g., $10.99
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
    });

    res.send({ client_secret: paymentIntent.client_secret });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Failed to create PaymentIntent' });
  }
};

exports.createTransaction = async (req, res) => {
  try {
    const {
      recipient_accountDetails,
      senderDetails,
      plan,
      bvn,
      idCard,
      startDate,
      period,
    } = req.body;

    // Update user info if provided
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

    // const start = new Date(startDate);
    // const dueDate = new Date(start);
    // dueDate.setMonth(dueDate.getMonth() + 1);

    // const transaction = new Transaction({
    //   ...req.body,
    //   isRecurringActive: plan === 'recurrence',
    //   senderEmail: senderDetails?.email,
    //   recipientEmail: recipient_accountDetails?.email,
    //   isFirstCharge: true,
    //   charge: 0,
    //   convertedCharge: 0,
    //   status: 'pending',
    //   dueDate,
    // });

    const transactionPayload = {
      ...req.body,
      isRecurringActive: plan === 'recurrence',
      senderEmail: senderDetails?.email,
      recipientEmail: recipient_accountDetails?.email,
      isFirstCharge: true,
      charge: 0,
      convertedCharge: 0,
      status: 'pending',
    };

    // Conditionally add dueDate if startDate exists
    if (startDate) {
      const start = new Date(startDate);
      const dueDate = new Date(start);
      dueDate.setMonth(dueDate.getMonth() + 1);
      transactionPayload.dueDate = dueDate;
    }

    const transaction = new Transaction(transactionPayload);

    const savedTransaction = await transaction.save();
    await handleEmail(savedTransaction);

    if (plan === 'recurrence' && period && Number(period) > 0) {
      scheduleRecurringTransaction(savedTransaction.toObject(), start, Number(period));
    }

    res.status(201).json({ success: true, transaction: savedTransaction });
  } catch (error) {
    console.error('Create Transaction Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error });
  }
};


exports.confirmPayment = async (req, res) => {
  const id = req.params.id;

  try {
    const transaction = await Transaction.findByIdAndUpdate(
      id,
      { status: req.body.status },
      { new: true }
    );

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    await handleEmail(transaction);

    res.status(200).json({ success: true, message: 'The payment is confirmed' });
  } catch (error) {
    console.error('Confirm Payment Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error });
  }
};



const scheduleRecurringTransaction = (transactionData, startDate, period) => {
  const { _id } = transactionData;
  let executionCount = 1;

  const job = cron.schedule('0 0 * * *', async () => {
    const today = new Date();
    const startDay = startDate.getDate();

    // Only run on the same day of the month as startDate
    if (today.getDate() !== startDay || executionCount >= period) return;

    const original = await Transaction.findById(_id);
    if (!original || !original.isRecurringActive) return;

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
          ...(original.chargeHistory || []),
          {
            date: new Date(),
            amount: originalAmount + serviceFee,
            convertedAmount: convertedAmount + convertedServiceFee,
            status: 'success',
          },
        ],
        dueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      });

      const savedTransaction = await newTransaction.save();
      await handleEmail(savedTransaction);

      executionCount++;
      if (executionCount >= period) {
        job.stop();
        scheduledJobs.delete(_id.toString());
      }
    } catch (err) {
      console.error('Failed to process recurring transaction:', err);
    }
  });

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

  const handleEmail=async(savedTransaction)=>{
    const transactionId=await generateTransactionId()
    const reference=await generateReference(savedTransaction.recipient_accountDetails.account_name)
    const title=savedTransaction.status=='pending'?"Awaiting payment confirmation":savedTransaction.status=='success'?'Payment Successful':'Payment Failed'
    const subtitle=savedTransaction.status=='pending'?"Please wait for the confirmation of your payment":savedTransaction.status=='success'?'Your payment has been successfully confirmed':'Your payment was not successful, please try again or contact your bank for more information'
    const mailBody = {
        to: savedTransaction.senderEmail,
        subject:savedTransaction.status=='pending'?"Payment is pending":savedTransaction.status=='success'?'Payment Successful':'Payment Failed',
        html:senderNotification({transactionId,title, subtitle, reference, amount:savedTransaction.convertedAmount.toFixed(2), status:savedTransaction.status, paymentMethod:savedTransaction.paymentMethod, fee:savedTransaction.convertedCharge.toFixed(2), totalAmount:(savedTransaction.convertedAmount+savedTransaction.convertedCharge).toFixed(2),recipient_accountDetails:savedTransaction.recipient_accountDetails,createdAt:savedTransaction.createdAt})
      };
      await sendEmail(mailBody);
  }

  const generateTransactionId=async()=> {
    const timestamp = Date.now().toString(36); 
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `TXN-${timestamp}-${randomStr}`.toUpperCase();
}

const generateReference=async(userName) => {
  const initials = userName?.split(' ').map(name => name[0]).join('').toUpperCase();
  const timestamp = Date.now().toString().slice(-6);
  return `${initials}${timestamp}`;
}


  // function (){
  //   "67fbf05e237d0141a9eef5e5"
  // }

  //     (async () => {
  //   try {
  //       await Transaction.deleteMany();
  //     const transactions = await Transaction.find({'senderDetails._id':"67fbf05e237d0141a9eef5e5"});
  //     console.log("All Transactions:", transactions);
  //   } catch (error) {
  //     console.error("Error fetching investments:", error.message);
  //   }
  // })();