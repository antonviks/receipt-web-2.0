const nodemailer = require('nodemailer');
const { google } = require('googleapis');
require('dotenv').config();

const {
  EMAIL_USER,
  OAUTH_CLIENT_ID,
  OAUTH_CLIENT_SECRET,
  OAUTH_REFRESH_TOKEN,
  OAUTH_REDIRECT_URI,
} = process.env;

console.log('EMAIL_USER:', EMAIL_USER);
console.log('OAUTH_CLIENT_ID:', OAUTH_CLIENT_ID);
console.log('OAUTH_CLIENT_SECRET:', OAUTH_CLIENT_SECRET);
console.log('OAUTH_REFRESH_TOKEN:', OAUTH_REFRESH_TOKEN);
console.log('OAUTH_REDIRECT_URI:', OAUTH_REDIRECT_URI);

const oauth2Client = new google.auth.OAuth2(
  OAUTH_CLIENT_ID,
  OAUTH_CLIENT_SECRET,
  OAUTH_REDIRECT_URI
);

oauth2Client.setCredentials({
  refresh_token: OAUTH_REFRESH_TOKEN,
});

async function sendTestEmail() {
  try {
    const accessToken = await oauth2Client.getAccessToken();

    console.log('Access Token:', accessToken.token);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: EMAIL_USER,
        clientId: OAUTH_CLIENT_ID,
        clientSecret: OAUTH_CLIENT_SECRET,
        refreshToken: OAUTH_REFRESH_TOKEN,
        accessToken: accessToken.token,
      },
    });

    const mailOptions = {
      from: `Your Name <${EMAIL_USER}>`,
      to: 'anton@vksmedia.com', // Replace with your email for testing
      subject: 'Test Email from Nodemailer',
      text: 'This is a test email sent using Nodemailer and Gmail OAuth2!',
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent:', result.response);
  } catch (error) {
    console.error('Error sending test email:', error);
  }
}

sendTestEmail();
