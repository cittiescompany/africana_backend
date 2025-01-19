import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotEnv from 'dotenv'
dotEnv.config()

export const hashpassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

export const comparepassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

export const signjwt = async (payload,expiresIn='1d',secret=process.env.JWTSECRETTOKEN) => {
  return jwt.sign(payload, secret, {expiresIn});
}

export const jwtverify = async (token,secret=process.env.JWTSECRETTOKEN) => {
  return jwt.verify(token,secret);
}