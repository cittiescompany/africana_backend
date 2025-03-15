import UserService from '../services/users.js';
import { signjwt } from '../helpers/auth.js';

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
      if (!user.password) {
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
};
export default AuthController;
