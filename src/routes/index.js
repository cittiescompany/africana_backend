const express = require('express');
const auth = require('./auth.js');
const user = require('./user.js');
const logger = require('../lib/logger.js');
const investmentRoutes = require('./investmentRoutes.js');
const propertyRoutes = require('./propertyRoutes.js');

const router = express.Router();

router.get('', (req, res, next) => {
  res.status(200).json({ message: 'Welcome to Africana Backend' });
});

router.use('/auth', auth);
router.use('/user', user);
router.use('/investments', investmentRoutes);
router.use('/properties', propertyRoutes);

router.use((req, res, next) => {
  res.status(404).json({ message: 'Route Not Found' });
});

router.use((err, req, res, next) => {
  logger.error(err.message);
  res.status(500).json({
    success: false,
    message: 'Something went wrong, kindly try again',
  });
});

module.exports = router;
