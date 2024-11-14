// server/utils/emailSender.js

const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const fs = require('fs');
require('dotenv').config();

const {
  EMAIL_USER,
  EMAIL_RECIPIENT,
  OAUTH_CLIENT_ID,
  OAUTH_CLIENT_SECRET,
  OAUTH_REFRESH_TOKEN,
  OAUTH_REDIRECT_URI,
} = process.env;

const oauth2Client = new google.auth.OAuth2(
  OAUTH_CLIENT_ID,
  OAUTH_CLIENT_SECRET,
  OAUTH_REDIRECT_URI
);

oauth2Client.setCredentials({
  refresh_token: OAUTH_REFRESH_TOKEN,
});

async function sendEmail(recipientName, pdfPath, pdfFilename, userEmail) { // Added userEmail
  try {
    // Verify PDF file exists
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`PDF file not found at path: ${pdfPath}`);
    }

    // Get Access Token
    const accessTokenResponse = await oauth2Client.getAccessToken();
    const accessToken = accessTokenResponse?.token;

    if (!accessToken) {
      throw new Error('Failed to obtain access token');
    }

    // Create Nodemailer Transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: EMAIL_USER,
        clientId: OAUTH_CLIENT_ID,
        clientSecret: OAUTH_CLIENT_SECRET,
        refreshToken: OAUTH_REFRESH_TOKEN,
        accessToken: accessToken,
      },
    });

    // Define Mail Options
    const mailOptions = {
      from: `"Korskyrkans Redovisningsapp" <${EMAIL_USER}>`,
      to: EMAIL_RECIPIENT,
      subject: 'Kvittounderlag',
      text: `Hej,\n\nHär kommer bifogade kvitton för ${recipientName}.\n\nMvh,\nAnton`,
      attachments: [
        {
          filename: pdfFilename,
          path: pdfPath,
          contentType: 'application/pdf',
        },
      ],
    };

    // If userEmail is provided and valid, add it as CC
    if (userEmail && validateEmail(userEmail)) {
      mailOptions.cc = userEmail;
    }

    // Send Email
    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent:', result.response);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

// Helper function to validate email format
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

module.exports = sendEmail;
