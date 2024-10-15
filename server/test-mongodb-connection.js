// test-mongodb-connection.js
require('dotenv').config(); // Load environment variables from .env
const mongoose = require('mongoose');

// Retrieve MongoDB URI from environment variables
const mongoURI = process.env.MONGO_URI;

// Debugging: Ensure that the URI is being read correctly
console.log('MongoDB URI:', mongoURI);

// Connect to MongoDB using Mongoose
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('MongoDB connected successfully');
    mongoose.disconnect(); // Disconnect immediately for testing purposes
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });
