const mongoose = require('mongoose');
const {hashpassword, comparepassword} = require('../helpers/auth.js');

// const userSchema = new mongoose.Schema({
//   firstName: {
//     type: String,
//     trim: true,
//   },
//   lastName: {
//     type: String,
//     trim: true,
//   },
//   email: {
//     type: String,
//     required: true,
//     unique: true,
//     trim: true,
//   },
//   phone: {
//     type: String,
//     required: false,
//     unique: false,
//     trim: true,
//   },
//   idCard: {
//     type: String,
//     required: false,
//   },
//   referralCode: {
//     type: Number,
//     required: true,
//   },
//   referredBy: {
//     type: Number,
//     required: false,
//   },
//   bvn: {
//     type: String,
//     required: false,
//   },
//   password: {
//     type: String,
//     required: true,
//     trim: true,
//     select: false,
//   },
//   googleId: { type: String, select: false },
//   loginOtp:{ otp: { type: String, select: false }, expiresAt: { type: Date, select: false } },
//   verificationOtp:{ otp: { type: String, select: false }, expiresAt: { type: Date, select: false } },
//   isVerified: {
//     type: Boolean,
//     default: false,
//   },
//   verification: {
//     phone: {
//       type: Boolean,
//       default: false,
//     },
//     email: {
//       type: Boolean,
//       default: false,
//     },
//   },
//   lastLogin: {
//     type: Date,
//     default: () => Date.now(),
//   },
//   role: {
//     type: String,
//     default: 'user',
//     enum: ['user', 'realtor','admin','super admin'],
//   },
// });

const merchantSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['Restaurant', 'Food items', 'African Attire', 'Herb', 'HairSaloon']
  },
  firstName: {
    type: String,
    trim: true,
  },
  lastName: {
    type: String,
    trim: true,
  },
  address: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true,
    match: [/^\d{10,15}$/, 'Invalid phone number']
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email']
  },
  country: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  businessProfile: {
    type: String,
    default: ''
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  createdAt: {
    type: Date,
    default: Date.now
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
});
merchantSchema.pre('save', async function (next) {
  const user = this;
  if (!user.isModified('password')) return next();
  if(user.password) user.password = await hashpassword(user.password);
  next();
});

merchantSchema.methods.comparePassword = async function (candidatePassword) {
  return await comparepassword(candidatePassword, this.password);
};  

module.exports = mongoose.model('Merchant', merchantSchema);