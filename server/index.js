// server/index.js

// 1. At the very top, conditionally load .env files
if (process.env.NODE_ENV === 'development') {
  require('dotenv').config({ path: './.env.development' });
} else {
  require('dotenv').config(); // loads .env (production)
}

console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MONGO_URI:', process.env.MONGO_URI);

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const receiptRoutes = require('./routes/receipts');

const app = express();

// 2. Define the allowed origins based on environment
let allowedOrigins = [];
if (process.env.NODE_ENV === 'development') {
  allowedOrigins.push('http://localhost:3000');
} else {
  // If you have a production URL, put it here
  // e.g. 'https://korsredo.onrender.com'
  allowedOrigins.push(process.env.FRONTEND_URL || 'https://korsredo.onrender.com');
}

// 3. Configure CORS
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// 4. Other server config
const secretKey = process.env.SECRET_KEY || 'your-secret-key';
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/test';

// Connect Mongo
mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// 5. Session middleware
app.use(session({
  secret: secretKey,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: mongoURI }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  },
}));

app.use(bodyParser.json());

// 6. Ensure directories exist (uploads, output)
const uploadsDir = path.join(__dirname, 'uploads');
const outputDir = path.join(__dirname, 'output');
function ensureDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
}
ensureDirectory(uploadsDir);
ensureDirectory(outputDir);

// 7. Serve static files from the output directory
app.use('/output', express.static(outputDir));

// 8. Serve static React build
app.use(express.static(path.join(__dirname, '../client/build')));

// 9. API Routes
app.use('/api/receipts', receiptRoutes);

// 10. Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
