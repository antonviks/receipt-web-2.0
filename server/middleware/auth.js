// server/middleware/auth.js

require('dotenv').config(); // Ensure environment variables are loaded
const basicAuth = require('basic-auth');

// Middleware function for basic authentication
function passwordProtection(req, res, next) {
  const user = basicAuth(req);
  const password = process.env.ADMIN_PASSWORD || 'kors2024'; // Default password if not set

  if (!user || user.name !== 'admin' || user.pass !== password) {
    res.set('WWW-Authenticate', 'Basic realm="401"'); // Prompt for credentials
    return res.status(401).send('Authentication required.');
  }

  return next(); // Proceed to the next middleware or route handler
}

module.exports = passwordProtection;
