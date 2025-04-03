const UserService = require('../services/users.js');
const { signjwt } = require('../helpers/auth.js');
const User = require('../models/users.js');
const Notification = require('../models/Notification.js');

const AuthController = {
  async signup(req, res, next) {
    try {
      const user = await UserService.create(req.body);
      const token = await signjwt({ id: user.id });
      res.status(201).json({
        success: true,
        token: token,
        user: user,
        message: 'success created an account',
      });
    } catch (err) {
      console.log(err.message)
      if (err.code === 11000) {
        let message;
        if (err.keyPattern.email) message = 'Email address already in use';
        else if (err.keyPattern.phone) message = 'Phone number already in use';
        else if (err.keyPattern.username) message = 'Username already in use';
        if (message) {
          return res.status(400).json({ success: false, message });
        }
      }
      next(err);
    }
  },
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      
      const user = await UserService.getOne(
        { email },
        { returnPassword: true },
      );
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Account does not exist.',
        });
      }
      if (!user?.password) {
        return res.status(400).json({
          success: false,
          message: 'Username or password incorrect',
        });
      }
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Username or password incorrect',
        });
      }
      await UserService.updateUserLastLogin(user);
      const token = await signjwt({ id: user.id });
      user.password = undefined;
      res
        .status(200)
        .json({ message: 'success login', token, user, success: true });
    } catch (err) {
      next(err);
    }
  },
  async getProfile(req, res, next) {
    try {
      const user = await UserService.getOne({ _id: res.locals.user.id });
      if (!user)
        return res
          .status(400)
          .json({ success: false, message: 'User not found' });
      res.status(200).json({ success: true, user });
    } catch (err) {
      next(err);
    }
  },
  async getUsers(req, res, next) {
    try {
      const users = await UserService.getAll();
      return res.status(200).json({
        success: true,
        users: users.length > 0 ? users : 'No registered users yet',
      });
    } catch (err) {
      next(err);
    }
  },

  async getUserNotifications (req, res){
    try {
      const userId = res.locals.user.id;

      console.log("userId: " + userId);
      
  
      const notifications = await Notification.find({ "recipient": userId }).populate("sender", "firstName lastName email")
      .populate("recipient", "firstName lastName email").sort({ createdAt: -1 });
  
      res.status(200).json({ success: true, notifications });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },

async  markNotificationsAsRead (req, res) {
    try {
      const userId = res.locals.user.id;
  
      await Notification.updateMany({ recipient: userId, isRead: false }, { isRead: true });
  
      res.status(200).json({ success: true, message: "Notifications marked as read" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },
  async deleteNotification (req, res) {
    try {
      const notificationId = req.params.id;
      const userId = res.locals.user.id;
  
      const notification = await Notification.findOne({ _id: notificationId, recipient: userId });
  
      if (!notification) {
        return res.status(404).json({ success: false, message: "Notification not found" });
      }
  
      await Notification.deleteOne({ _id: notificationId });
  
      res.status(200).json({ success: true, message: "Notification deleted" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },
};

  // (async () => {
  //   try {
  //       // await User.deleteMany({});
  //     const users = await User.find();
  //     console.log("All users:", users);
  //   } catch (error) {
  //     console.error("Error fetching users:", error.message);
  //   }
  // })();

module.exports = AuthController;
