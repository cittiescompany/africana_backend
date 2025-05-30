const express = require('express');
const rateLimit = require('express-rate-limit');
const validate = require('../middlewares/validate.js');
const { signupbodySchema,verifybodySchema,resendMailbodySchema } = require('../schemas/auth.js');
const authController = require('../controllers/auth.js');
const authenticate = require('../middlewares/authenticate.js');
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
  '/verify',
  validate(verifybodySchema),
  authController.verification,
);
router.post(
  '/resendmail',
  validate(resendMailbodySchema),
  authController.resendMail,
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
router.get('/merchants', authController.getMerchants);

module.exports=router;
