import express from 'express';
import rateLimit from 'express-rate-limit';
import validate from '../middlewares/validate.js';
import { signupbodySchema } from '../schemas/auth.js';
import authController from '../controllers/auth.js';
import authenticate from '../middlewares/authenticate.js';
const router = express.Router();

router.post(
  '/register',
  rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 10,
    message:
      'Too many accounts created from this IP, please try again after an hour',
    standardHeaders: true,
    legacyHeaders: false,
  }),
  validate(signupbodySchema),
  authController.signup,
);
router.post(
  '/login',
    rateLimit({
      windowMs: 60 * 60 * 1000,
      limit: 10,
      message:
        'Too many login attempts from this IP, please try again after an hour',
      standardHeaders: true,
      legacyHeaders: false,
    }),
  validate(signupbodySchema),
  authController.login,
);
router.get('/profile', authenticate, authController.getProfile);

export default router;
