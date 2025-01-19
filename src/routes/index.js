import express from 'express';
import auth from './auth.js';
import logger from '../lib/logger.js';

const router = express.Router();
router.get('', (req, res, next) => {
  res.status(200).json({ message: 'Welcome to Africana Backend' });
});

router.use('/auth', auth);

router.use((req, res, next) => {
  res.status(404).json({ message: 'Route Not Found' });
});

router.use((err, req, res, next) => {
  logger.error(err.message);
  res
    .status(500)
    .json({
      success: false,
      message: 'Something went wrong, kindly try again',
    });
});

export default router;
