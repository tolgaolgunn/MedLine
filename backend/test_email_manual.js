
require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.MY_GMAIL,
    pass: process.env.MY_PASSWORD,
  },
  secure: false, // true for 465, false for other ports
  tls: {
    rejectUnauthorized: false
  },
  debug: true,
  logger: true
});

console.log('Testing email configuration...');
console.log('HOST:', process.env.EMAIL_HOST);
console.log('PORT:', process.env.EMAIL_PORT);
console.log('USER:', process.env.MY_GMAIL); // Don't log password

async function sendTestEmail() {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER || process.env.MY_GMAIL,
      to: process.env.MY_GMAIL, // Send to yourself
      subject: 'Test Email form MedLine Debugger',
      text: 'If you receive this, your email configuration is correct!',
      html: '<b>If you receive this, your email configuration is correct!</b>'
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

sendTestEmail();
