const UserDao = require('../dao/users.js');

const UserService = {
  async create(body) {
    return UserDao.create(body);
  },
  async getOne(args, options) {
    return UserDao.getOne(args, options);
  },
  async getAll() {
    return UserDao.getAll();
  },
  async updateUserLastLogin(user) {
    user.lastlogin = new Date();
    await user.save();
  },
};
module.exports = UserService;
