const express = require('express');
const { createTransaction, getUserTransactions } = require('../controllers/transactionController');
const router = express.Router();

router.post('/', createTransaction);
router.get('/:email', getUserTransactions);

module.exports= router;