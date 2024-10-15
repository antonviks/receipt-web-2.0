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
      vat: { type: Number, required: true },
      imagePath: { type: String }, // Path to the uploaded image
    },
  ],

  // Additional Files
  additionalFiles: [
    {
      path: { type: String, required: true },
      originalName: { type: String, required: true },
      mimeType: { type: String, required: true },
    },
  ],

  // Summary
  totalAmount: { type: Number, required: true },
  totalVAT: { type: Number, required: true },

  // Payment Information
  bankName: { type: String },
  clearingNumber: { type: String },
  accountNumber: { type: String },
  otherMethod: { type: String },

  // Session ID for association
  sessionID: { type: String, required: true },

  // Timestamp
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Receipt', receiptSchema);
