const express = require('express');
const { createTransaction, getUserTransactions, getActiveRecurringTransactions, cancelRecurringTransaction } = require('../controllers/transactionController');
const router = express.Router();

router.post('/', createTransaction);
router.get('/active-subscriptions/:userId', getActiveRecurringTransactions);
router.get('/by-email/:email', getUserTransactions);
router.put('/cancel-subscription/:id', cancelRecurringTransaction);


module.exports= router;