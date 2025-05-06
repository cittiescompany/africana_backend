const express = require('express');
const { createTransaction, getUserTransactions, getActiveRecurringTransactions, cancelRecurringTransaction, confirmPayment, createStripePayment } = require('../controllers/transactionController');
const router = express.Router();

router.post('/', createTransaction);
router.post('/stripe-payment', createStripePayment);
router.get('/active-subscriptions/:userId', getActiveRecurringTransactions);
router.get('/by-email/:email', getUserTransactions);
router.post('/confirm-payment/:id', confirmPayment);
router.put('/cancel-subscription/:id', cancelRecurringTransaction);


module.exports= router;