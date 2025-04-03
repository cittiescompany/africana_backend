const UserDao = require('../dao/users.js');

const UserService = {
  async create(body) {
    return UserDao.create(body);
  },
  async getOne(args, { returnPassword = false } = {}) {
    return UserDao.getOne(args, { returnPassword });
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
