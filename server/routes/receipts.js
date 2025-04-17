// server/routes/receipts.js
const express = require('express');
const router = express.Router();
const Receipt = require('../models/Receipt');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const generatePDF = require('../utils/pdfGenerator');
const sendEmail = require('../utils/emailSender');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Define directories
const uploadsDir = path.join(__dirname, '../uploads');
const outputDir = path.join(__dirname, '../output');

// Ensure directories exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`Created uploads directory at ${uploadsDir}`);
}
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`Created output directory at ${outputDir}`);
}

// Configure Multer with Disk Storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${uuidv4()}-${file.originalname}`;
    cb(null, uniqueSuffix);
  }
});

// Multer instance with limits and file filtering (allows HEIC, HEIF, PDF, JPEG, PNG)
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/heic',
      'image/heif',
      'application/pdf',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Endast JPEG, PNG, HEIC, HEIF eller PDF-filer är tillåtna.'));
    }
  }
});

// Function to clean up files (PDF and uploaded images/PDFs)
async function cleanupFiles(pdfPath, uploadedFiles) {
  try {
    // Delete the generated PDF
    if (fs.existsSync(pdfPath)) {
      await fs.promises.unlink(pdfPath);
      console.log(`Deleted PDF: ${pdfPath}`);
    } else {
      console.warn(`Generated PDF not found: ${pdfPath}`);
    }

    // Delete each uploaded file
    const deletePromises = uploadedFiles.map(async (file) => {
      const filePath = file.path;
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        console.log(`Deleted uploaded file: ${filePath}`);
      } else {
        console.warn(`Uploaded file not found: ${filePath}`);
      }
    });
    await Promise.all(deletePromises);

    console.log('All uploaded files have been deleted.');
  } catch (cleanupError) {
    console.error('Error during file cleanup:', cleanupError);
  }
}

// Helper function to format dates in YYYY-MM-DD
function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Unified Route for Processing (Preview and Finalization)
router.post('/process', upload.array('files'), async (req, res) => {
  try {
    const { personalInfo, paymentInfo, action, receipts: receiptsJSON } = req.body;
    if (!personalInfo || !paymentInfo || !action) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    // Parse personalInfo, paymentInfo, receipts
    let parsedPersonalInfo, parsedPaymentInfo, receipts;
    try {
      parsedPersonalInfo = JSON.parse(personalInfo);
      parsedPaymentInfo = JSON.parse(paymentInfo);
      receipts = JSON.parse(receiptsJSON);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid JSON data.' });
    }

    // Basic validation
    if (!parsedPersonalInfo.date || !parsedPersonalInfo.name) {
      return res.status(400).json({ error: 'Datum och Namn krävs.' });
    }
    if (!receipts || !Array.isArray(receipts) || receipts.length === 0) {
      return res.status(400).json({ error: 'Minst en redovisning krävs.' });
    }

    // Validate each receipt
    for (let i = 0; i < receipts.length; i++) {
      const r = receipts[i];
      if (!r.date || !r.purpose || !r.costCenter || !r.totalCost) {
        return res.status(400).json({ error: `Saknas fält för redovisning ${i + 1}.` });
      }
    }

    // Summation
    const totalAmount = receipts.reduce((sum, r) => {
      const val = parseFloat(r.totalCost) || 0;
      return sum + val;
    }, 0);

    // Associate the correct subset of files with each receipt
    const uploadedFiles = req.files || [];
    console.log(`Received ${uploadedFiles.length} files total.`);

    let fileIndex = 0;
    receipts = receipts.map((r) => {
      const count = r.filesCount || 0; // from the client
      const subset = uploadedFiles.slice(fileIndex, fileIndex + count);
      fileIndex += count;

      return {
        ...r,
        totalCost: parseFloat(r.totalCost) || 0,
        files: subset.map((f) => ({
          path: f.path,
          originalName: f.originalname,
          mimetype: f.mimetype,
        })),
      };
    });

    // Create a new Receipt doc (optional)
    const newReceipt = new Receipt({
      date: parsedPersonalInfo.date,
      name: parsedPersonalInfo.name,
      // 'receipts' here is optional to store in DB if your schema supports it,
      // but we definitely want it for the PDF. Some people store partial data, up to you.
      receipts,
      totalAmount,
      bankName: parsedPaymentInfo.bankName,
      clearingNumber: parsedPaymentInfo.clearingNumber,
      accountNumber: parsedPaymentInfo.accountNumber,
      userEmail: parsedPersonalInfo.email || null,
      sessionID: req.session ? req.session.id : '',
      createdAt: new Date(),
    });

    await newReceipt.save();
    console.log('Receipt saved to DB, ID:', newReceipt._id);

    // Generate PDF
    const formattedDate = formatDate(parsedPersonalInfo.date);
    const pdfFilename = `Utläggsblankett_${formattedDate}_${uuidv4()}.pdf`;
    const pdfPath = path.join(outputDir, pdfFilename);

    // ====== OPTION A Fix: Merge the in-memory 'receipts' with the Mongoose doc ======
    // Convert Mongoose doc to plain object, then override .receipts with our in-memory array
    const pdfInput = {
      ...newReceipt.toObject(),  // everything in the doc
      receipts,                 // override with the array that has .files
      totalAmount               // ensure the generator sees the correct sum
    };

    await generatePDF(pdfInput, pdfPath);
    console.log('PDF generated at:', pdfPath);

    if (action === 'preview') {
      // Return path so the client can open it in a new tab
      const pdfUrl = `/output/${pdfFilename}`;
      res.json({ pdfUrl });
    } else if (action === 'finalize') {
      // Email the PDF
      await sendEmail(newReceipt.name, pdfPath, pdfFilename, parsedPersonalInfo.email);
      console.log('Email sent.');

      // Cleanup
      await cleanupFiles(pdfPath, uploadedFiles);
      res.json({ message: 'PDF genererad och skickad via e-post.' });
    } else {
      return res.status(400).json({ error: 'Ogiltig åtgärd.' });
    }
  } catch (error) {
    console.error('Error in /process:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
