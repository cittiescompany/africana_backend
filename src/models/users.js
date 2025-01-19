import mongoose from 'mongoose';
import {hashpassword, comparepassword} from '../helpers/auth.js';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
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
    enum: ['user', 'admin'],
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

export default mongoose.model('users', userSchema);