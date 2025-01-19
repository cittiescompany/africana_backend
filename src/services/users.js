import UserDao from '../dao/users.js';

const UserService = {
  async create(body) {
    return UserDao.create(body);
  },
  async getOne(args, { returnPassword = false } = {}) {
    return UserDao.getOne(args, { returnPassword });
  },
  async updateUserLastLogin(user) {
    user.lastlogin = new Date();
    await user.save();
  },
};
export default UserService;
