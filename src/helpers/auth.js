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

// generateVerificationEmail.js

exports.registerVerification= (data) => {
  return `
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>OTP Verification</title>
</head>
<body style="margin:0; padding:0; font-family:Arial, sans-serif; background-color:#f5f7fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f7fa; padding:40px 0;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:600px; background:#ffffff; border-radius:8px; overflow:hidden;">
          <tr>
            <td style="background-color:#0047ab; padding:20px; text-align:center;">
              <h1 style="color:#ffffff; font-size:24px; margin:0;">Welcome to Moniclan</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:30px; text-align:left; color:#333333;">
              <p style="font-size:16px; margin-bottom:20px;">Hi <strong>${data.user}</strong>,</p>
              <p style="font-size:16px; margin-bottom:20px;">
                Thank you for signing up. Please use the OTP code below to verify your email address:
              </p>
              <p style="font-size:32px; font-weight:bold; color:#0047ab; text-align:center; margin:30px 0;">
               ${data.code}
              </p>
              <p style="font-size:14px; color:#777777; margin-bottom:20px; text-align:center;">
                This code will expire in 10 minutes.
              </p>
              <p style="font-size:16px;">
                If you didn't request this code, please ignore this email.
              </p>
              <p style="font-size:16px; margin-top:30px;">Cheers,<br>The Moniclan Team</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f0f0f0; text-align:center; padding:20px; font-size:12px; color:#888888;">
              &copy; 2025 Moniclan. All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>

  `;
};

exports.generateOtp=()=>Math.floor(100000 + Math.random() * 900000); // Generates a 6-digit number



exports.loginVerification=(data)=> {
  return `
    <!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto;">
        <tr>
            <td style="padding: 30px 20px; text-align: center; background-color: #ffffff;">
                <h1 style="color: #333333; margin: 0;">Your Verification Code</h1>
            </td>
        </tr>
        <tr>
            <td style="padding: 30px 20px; background-color: #ffffff;">
                <p style="color: #666666; font-size: 16px; line-height: 1.5; margin-top: 0;">
                    Hello, ${data.user}
                </p>
                <p style="color: #666666; font-size: 16px; line-height: 1.5;">
                    Please use the following One-Time Password (OTP) to verify your identity:
                </p>
                <div style="background-color: #f0f7ff; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
                    <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #0066cc;">
                        ${data.code}
                    </div>
                </div>
                
                <p style="color: #666666; font-size: 16px; line-height: 1.5;">
                    This code will expire in <strong>20 minutes</strong>. Please do not share this code with anyone.
                </p>
                
                <p style="color: #666666; font-size: 16px; line-height: 1.5;">
                    If you didn't request this code, please ignore this email.
                </p>
            </td>
        </tr>
        <tr>
            <td style="padding: 20px; text-align: center; background-color: #f0f0f0; font-size: 14px; color: #999999;">
                <p style="margin: 0;">
                    © 2025 Moniclan. All rights reserved.
                </p>
                <p style="margin: 10px 0 0 0;">
                    <a href="#" style="color: #999999; text-decoration: none;">Privacy Policy</a> | 
                    <a href="#" style="color: #999999; text-decoration: none;">Terms of Service</a>
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
  `;
}


exports.isExpired=(date) =>{
  return Date.now() > date;
}