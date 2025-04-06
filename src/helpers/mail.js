// sendEmail.js
const {createTransport} = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config({ override: true });


const transporter = createTransport({
  port: 587,
  host:`${process.env.NODEMAILER_HOST}`,
  secure: false,
  debug: true,
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: `${process.env.NODEMAILER_PASSWORD}`,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

 const sendEmail = async ({ to, subject, html }) => {
  let mailOptions = {
    from: process.env.NODEMAILER_EMAIL,
    to,
    subject,
    html
  };
  try {
    const result=await transporter
    .sendMail(mailOptions)
    console.log('Email sent: ' + result.response);
    return result
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = sendEmail;

