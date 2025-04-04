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
  password: {
    type: String,
    required: true,
    trim: true,
    select: false,
  },
  googleId: { type: String, select: false },
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
  lastlogin: {
    type: Date,
    default: () => Date.now(),
  },
  role: {
    type: String,
    default: 'user',
    enum: ['user', 'realtor'],
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