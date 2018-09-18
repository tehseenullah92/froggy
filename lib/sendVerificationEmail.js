const bCrypt = require('bcryptjs');
const async    = require('async');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const SMTP_USER=process.env.SMTP_USER;
const SMTP_PASS=process.env.SMTP_PASS;
const SMTP_HOST=process.env.SMTP_HOST;
var smtpTransport = nodemailer.createTransport( {
  host:SMTP_HOST,
  port:465,
  secure:true,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  }
});
function sendVerificationEmail(token, email) {
  var mailOptions = {
    to: email,
    from: SMTP_USER,
    subject: 'Please Confirm Your Email Account',
    text: 'Hello, Please Click on the link to verify your email.<a href=http://localhost:3027/users/verify/'+token+'>Click here to verify</a>.'
  }
  smtpTransport.sendMail(mailOptions, function(err) {
    console.error(err);
  });
}
module.exports = sendVerificationEmail
