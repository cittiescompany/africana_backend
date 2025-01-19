import { jwtverify } from '../helpers/auth.js';

const authenticate = async (req, res, next) => {
  try {
    if (!req.headers.authorization)
      return res.status(401).json({ success: false, message: 'No Authorized' });
    const token = req.headers.authorization.replace(/Bearer /gi, '');
    res.locals.user = await jwtverify(token);
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'No Authorized' });
  }
};

export default authenticate;
