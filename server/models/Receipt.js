// server/models/Receipt.js

const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema({
  // Personal Information
  date: { type: Date, required: true },
  name: { type: String, required: true },

  // Receipt Details
  receipts: [
    {
      date: { type: Date, required: true },
      purpose: { type: String, required: true },
      costCenter: { type: String, required: true },
      customCostCenter: { type: String }, // For "Annat" option
      comment: { type: String },
      totalCost: { type: Number, required: true },
      imagePath: { type: String }, // Path to the uploaded image or file
    },
  ],

  // Summary
  totalAmount: { type: Number, required: true },

  // Payment Information
  bankName: { type: String },
  clearingNumber: { type: String },
  accountNumber: { type: String },
  otherMethod: { type: String },

  // Optional user email
  userEmail: { type: String }, // New field

  // Session ID for association
  sessionID: { type: String, required: true },

  // Timestamp
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Receipt', receiptSchema);
