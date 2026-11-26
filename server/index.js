// server/index.js

const path = require('path');

// 1. Load environment variables (.env.development locally, .env otherwise)
const isDevelopment = process.env.NODE_ENV === 'development';
require('dotenv').config({
  path: path.join(__dirname, isDevelopment ? '.env.development' : '.env'),
});
const isProduction = process.env.NODE_ENV === 'production';

console.log('NODE_ENV:', process.env.NODE_ENV);

// 2. Refuse to start without the secrets the app depends on
const required = ['APP_PASSWORD', 'SESSION_SECRET'];
if (isProduction) {
  required.push(
    'EMAIL_USER',
    'EMAIL_RECIPIENT',
    'OAUTH_CLIENT_ID',
    'OAUTH_CLIENT_SECRET',
    'OAUTH_REFRESH_TOKEN'
  );
}
const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}
if (process.env.SESSION_SECRET.length < 32) {
  console.warn('SESSION_SECRET is shorter than 32 characters. Use a long random value.');
}

const express = require('express');
const cors = require('cors');
const { createAuth } = require('./middleware/auth');
const receiptRoutes = require('./routes/receipts');

const app = express();
app.disable('x-powered-by');
// Render runs the app behind one proxy: needed for the client IP (rate limiting)
app.set('trust proxy', 1);

// 3. CORS
const allowedOrigins = isDevelopment
  ? ['http://localhost:3000']
  : [process.env.FRONTEND_URL || 'https://korsredo.onrender.com'];
app.use(cors({ origin: allowedOrigins, credentials: true }));

app.use(express.json({ limit: '10kb' }));

// 4. Login and protected API routes
const auth = createAuth({
  password: process.env.APP_PASSWORD,
  secret: process.env.SESSION_SECRET,
  secureCookies: isProduction,
});
app.post('/api/login', auth.login);
app.post('/api/logout', auth.logout);
app.get('/api/session', auth.session);
app.use('/api/receipts', auth.requireAuth, receiptRoutes);

// 5. Serve the React build
app.use(express.static(path.join(__dirname, '../client/build')));

// 6. Last-resort error handler: log details, show a generic message
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  // Client errors from the JSON body parser (too large, malformed JSON)
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Förfrågan är för stor.' });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Ogiltig data.' });
  }
  console.error('Unhandled error:', err);
  return res.status(500).json({ error: 'Något gick fel. Försök igen.' });
});

// 7. Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
