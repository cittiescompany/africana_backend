const mongoose = require("mongoose");
const User = require('../models/users.js');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: User }, // The user receiving the notification
  sender: { type: mongoose.Schema.Types.ObjectId, ref: User }, // The user who triggered the notification
  type: { type: String, enum: ["new-investment", "new-purchase"], required: true }, // Type of notification
  title: { type: String, required: true }, // Notification message
  message: { type: String, required: true }, // Notification message
  isRead: { type: Boolean, default: false }, // Whether the user has read it
  createdAt: { type: Date, default: Date.now }, // Timestamp
});

const Notification = mongoose.model("Notification", notificationSchema);
module.exports = Notification;