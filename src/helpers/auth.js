const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotEnv = require('dotenv');
dotEnv.config()

exports.hashpassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

exports.comparepassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

exports.signjwt = async (payload,expiresIn='1d',secret=process.env.JWTSECRETTOKEN) => {
  return jwt.sign(payload, secret, {expiresIn});
}

exports.jwtverify = async (token,secret=process.env.JWTSECRETTOKEN) => {
  return jwt.verify(token,secret);
}