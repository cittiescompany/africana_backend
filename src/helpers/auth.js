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


exports.senderNotification = (data) => {
  return `
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Transaction Confirmation</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 20px;
            background-color: #f9f9f9;
            display: flex;
            justify-content: center;
            min-height: 100vh;
        }
        .header {
            text-align: center;
            padding: 20px 0;
            border-bottom: 1px solid #eee;
            margin-bottom: 30px;
        }
        .logo {
            max-width: 150px;
            margin-bottom: 20px;
        }
        .receipt-container {
            background-color: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
            width: 100%;
            max-width: 600px; 
            margin:0 auto;
        }
        .transaction-header {
            color: #2c3e50;
            margin-bottom: 25px;
            text-align: center;
        }
        .transaction-details {
            margin-bottom: 30px;
            width: 100%;
        }
        .detail-row {
            display: flex;
            flex-wrap: wrap;
            padding: 10px 0;
            border-bottom: 1px solid #f0f0f0;
            gap: 10px;
            width:100%;
        }
        .detail-label {
            font-weight: 600;
            color: #7f8c8d;
            min-width: 120px;
        }
        .detail-value {
            font-weight: 500;
            flex: 1;
            min-width: 150px;
            text-align: right;
        }
        .amount {
            font-size: 24px;
            font-weight: 700;
            color: #e74c3c;
            text-align: center;
            margin: 25px 0;
        }
        .status-badge {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            background-color:${data?.status=='success'?"rgb(60, 241, 15)":data?.status=='pending'?'#f1c40f':'rgb(199, 24, 11)'};
            color: white;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #95a5a6;
        }
        .note {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-top: 20px;
            font-size: 14px;
        }
        
        @media (max-width: 480px) {
            .receipt-container {
                padding: 20px;
            }
            .detail-label, .detail-value {
                min-width: 100%;
                text-align: left;
            }
            .detail-value {
                margin-top: 5px;
            }
        }
    </style>
</head>
<body>
    <div class="receipt-container">
        <div class="header">
            <img src="https://yourcompany.com/logo.png" alt="Company Logo" class="logo">
            <h1 class="transaction-header">Payment Sent Successfully</h1>
        </div>

        <div class="amount">
            -₦${data?.amount}
        </div>

        <div class="transaction-details">
            <div class="detail-row">
                <span class="detail-label">Transaction ID:</span>
                <span class="detail-value">${data?.transactionId}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Date & Time:</span>
                <span class="detail-value">${new Date(data.createdAt).toLocaleDateString()} ${new Date(data.createdAt).toLocaleTimeString()}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Account Name:</span>
                <span class="detail-value">${data?.recipient_accountDetails?.account_name || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Account Number:</span>
                <span class="detail-value">${data?.recipient_accountDetails?.account_number || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Bank:</span>
                <span class="detail-value">${data?.recipient_accountDetails?.bank_name || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Payment Method:</span>
                <span class="detail-value">${data?.paymentMethod || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value"><span class="status-badge">${data?.status}</span></span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Reference:</span>
                <span class="detail-value">${data?.reference || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Fee:</span>
                <span class="detail-value">₦${data?.fee || '0.00'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Total Amount:</span>
                <span class="detail-value">₦${data?.totalAmount || data?.amount}</span>
            </div>
        </div>

        <div class="note">
            <p>This transaction has been processed successfully. The amount has been deducted from your account balance. If you didn't authorize this transaction, please contact our support team immediately.</p>
        </div>

        <div class="footer">
            <p>© ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
            <p>Need help? Contact our support team at support@yourcompany.com</p>
        </div>
    </div>
</body>
</html>
  `;
};
