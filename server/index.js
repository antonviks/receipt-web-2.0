// server/index.js

require('dotenv').config(); // Load environment variables
const express = require('express');
const app = express();
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const receiptRoutes = require('./routes/receipts');

const secretKey = process.env.SECRET_KEY || 'your-secret-key';
const mongoURI = process.env.MONGO_URI;

// Debugging: Log the environment variables to ensure they're loaded
console.log('MongoDB URI:', mongoURI);
console.log('Secret Key:', secretKey);

// Connect to MongoDB without deprecated options
mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Configure session middleware
app.use(session({
  secret: secretKey,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: mongoURI }),
  cookie: { 
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    httpOnly: true, // Prevents client-side JS from accessing the cookie
    secure: process.env.NODE_ENV === 'production', // Ensures cookies are sent over HTTPS
    sameSite: 'lax', // Protects against CSRF
  },
}));

// Configure CORS to allow credentials
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

app.use(bodyParser.json());

// Routes
app.use('/api/receipts', receiptRoutes);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
