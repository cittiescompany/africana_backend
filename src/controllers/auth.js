const UserService = require('../services/users.js');
const {
  signjwt,
  registerVerification,
  loginVerification,
  generateOtp,
  isExpired,
} = require('../helpers/auth.js');
const sendEmail = require('../helpers/mail.js');
const User = require('../models/users.js');
const Notification = require('../models/Notification.js');

const AuthController = {
  async signup(req, res, next) {
    const referralCode = Math.floor(1000 + Math.random() * 9000);
    try {
      const code = generateOtp();
      const user = await UserService.create({
        ...req.body,
        referralCode,
        verificationOtp: {
          otp: code,
          expiresAt: Date.now() + 60 * 60 * 1000,
        },
      });
      await sendEmail({
        to: user.email,
        subject: 'Welcome And account verification ',
        html: registerVerification({ code, user: `${user.firstName}` }),
      });

      res.status(201).json({
        success: true,
        user: user,
        message: 'success created an account',
      });
    } catch (err) {
      console.log(err.message);
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
  async verification(req, res, next) {
    try {
      const { email, code, type } = req.body;
      const options =
        type === 'register'
          ? '+verificationOtp.otp +verificationOtp.expiresAt'
          : '+loginOtp.otp +loginOtp.expiresAt';
      const user = await UserService.getOne({ email }, options);
      if (!user) {
        return res
          .status(400)
          .json({ success: false, message: 'Account does not exist.' });
      }

      const expiredAt =
        type === 'register'
          ? user.verificationOtp.expiresAt
          : user?.loginOtp?.expiresAt;
      if (type === 'register' && user?.verificationOtp?.otp !== code) {
        return res
          .status(400)
          .json({ success: false, message: 'Invalid verification code.' });
      }
      if (type === 'login' && user?.loginOtp?.otp !== code) {
        return res
          .status(400)
          .json({ success: false, message: 'Invalid login code.' });
      }
      if (isExpired(expiredAt)) {
        return res.status(400).json({
          success: false,
          message: 'Verification code has expired.',
        });
      }
      if (type === 'register') {
        user.verificationOtp.otp = null;
        user.verification.email = true;
        user.isVerified = true;
      } else {
        user.verificationOtp.otp = null;
        user.loginOtp.otp = null;
        // user.isVerified = true;
      }
      await user.save();
      const token = await signjwt({ id: user.id });

      res.status(201).json({
        success: true,
        user: user,
        token,
        message:
          type == 'login'
            ? 'Account verified successfully'
            : 'Login successfully',
      });
    } catch (err) {
      console.log(err.message);
      next(err);
    }
  },
  async resendMail(req, res, next) {
    try {
      const { email, type } = req.body;
      const code = generateOtp();
      const options =
        type === 'register'
          ? '+verificationOtp.otp +verificationOtp.expiresAt'
          : '+loginOtp.otp +loginOtp.expiresAt';
      const user = await UserService.getOne({ email }, options);
      if (!user) {
        return res
          .status(400)
          .json({ success: false, message: 'Account does not exist.' });
      }
      if (type === 'register') {
        user.verificationOtp.otp = code;
        user.verificationOtp.expiresAt = Date.now() + 300 * 60 * 60 * 1000;
      } else {
        user.loginOtp.otp = code;
        user.loginOtp.expiresAt = Date.now() + 20 * 60 * 1000;
      }
      await user.save();
      const mailBody = {
        to: user.email,
        subject:
          type === 'register'
            ? 'Welcome And account verification'
            : 'Login verification',
        html:
          type === 'register'
            ? registerVerification({ code, user: `${user.firstName}` })
            : loginVerification({ code, user: `${user.firstName}` }),
      };
      await sendEmail(mailBody);

      res.status(201).json({
        success: true,
        message: 'Mail has been resent successfully',
      });
    } catch (err) {
      console.log(err.message);
      next(err);
    }
  },
  
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const user = await UserService.getOne({ email }, '+password +isVerified');
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

      user.lastLogin = new Date();

      if (['admin', 'super admin'].includes(user.role)) {
        await user.save()
        const token = await signjwt({ id: user.id });
        const userObj = user.toObject();
delete userObj.password;
        return res.status(200).json({
          success: true,
          message: 'Login successfully',
          token,
          user: userObj,
        });
      }

      if (!user.isVerified) {
        return res
          .status(400)
          .json({ message: 'Please verify your account', success: false });
      }
      const code = generateOtp();
      user.loginOtp.otp = code;
      user.loginOtp.expiresAt = Date.now() + 20 * 60 * 1000;
      user.lastLogin = new Date();
      await user.save();
      await sendEmail({
        to: user.email,
        subject: 'Login verification',
        html: loginVerification({ code, user: `${user.firstName}` }),
      });
      user.password = undefined;
      res.status(200).json({ message: 'success login', success: true });
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
  // async getUsers(req, res, next) {
  //   try {
  //     const users = await UserService.getAll();
  //     return res.status(200).json({
  //       success: true,
  //       users: users.length > 0 ? users : 'No registered users yet',
  //     });
  //   } catch (err) {
  //     next(err);
  //   }
  // },

  async getUsers(req, res, next) {
    console.log(res.locals.user.id);
    try {
      const currentUserId = res.locals.user.id; // assuming user is authenticated and ID is set in req.user
  
      const users = await User.find({ _id: { $ne: currentUserId } }) // exclude current user
        .sort({ lastLogin: -1 })                                      // sort by earliest lastLogin
        .select('-password');                                        // exclude password field
  
      return res.status(200).json({
        success: true,
        users: users.length > 0 ? users : 'No registered users yet',
      });
    } catch (err) {
      next(err);
    }
  },
  

  async getUserNotifications(req, res) {
    try {
      const userId = res.locals.user.id;

      console.log('userId: ' + userId);

      const notifications = await Notification.find({ recipient: userId })
        .populate('sender', 'firstName lastName email')
        .populate('recipient', 'firstName lastName email')
        .sort({ createdAt: -1 });

      res.status(200).json({ success: true, notifications });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  async markNotificationsAsRead(req, res) {
    try {
      const userId = res.locals.user.id;

      await Notification.updateMany(
        { recipient: userId, isRead: false },
        { isRead: true },
      );

      res
        .status(200)
        .json({ success: true, message: 'Notifications marked as read' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },
  async deleteNotification(req, res) {
    try {
      const notificationId = req.params.id;
      const userId = res.locals.user.id;

      const notification = await Notification.findOne({
        _id: notificationId,
        recipient: userId,
      });

      if (!notification) {
        return res
          .status(404)
          .json({ success: false, message: 'Notification not found' });
      }

      await Notification.deleteOne({ _id: notificationId });

      res.status(200).json({ success: true, message: 'Notification deleted' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server error' });
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
