const mongoose = require('mongoose');
const {hashpassword, comparepassword} = require('../helpers/auth.js');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    trim: true,
  },
  lastName: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  phone: {
    type: String,
    required: false,
    unique: false,
    trim: true,
  },
  idCard: {
    type: String,
    required: false,
  },
  referralCode: {
    type: Number,
    required: false,
  },
  referredBy: {
    type: Number,
    required: false,
  },
  bvn: {
    type: String,
    required: false,
  },
  password: {
    type: String,
    required: true,
    trim: true,
    select: false,
  },
  isMerchant: {
    type: Boolean,
    default: false
  },
  merchantInfo: {
   type: mongoose.Schema.Types.Mixed,
   required: false,
   default: null,
  },
  googleId: { type: String, select: false },
  loginOtp:{ otp: { type: String, select: false }, expiresAt: { type: Date, select: false } },
  verificationOtp:{ otp: { type: String, select: false }, expiresAt: { type: Date, select: false } },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verification: {
    phone: {
      type: Boolean,
      default: false,
    },
    email: {
      type: Boolean,
      default: false,
    },
  },
  lastLogin: {
    type: Date,
    default: () => Date.now(),
  },
  role: {
    type: String,
    default: 'user',
    enum: ['user', 'realtor','admin','super admin'],
  },
});

userSchema.pre('save', async function (next) {
  const user = this;
  if (!user.isModified('password')) return next();
  if(user.password) user.password = await hashpassword(user.password);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await comparepassword(candidatePassword, this.password);
};  

module.exports = mongoose.model('users', userSchema);