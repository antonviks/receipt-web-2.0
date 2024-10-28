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

// Multer instance with limits and file filtering
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/heic',
      'image/heif',
      'application/pdf'
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

    // Delete each uploaded file (additionalFiles)
    const deletePromises = uploadedFiles.map(async (file) => {
      const filePath = file.path;
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        console.log(`Deleted uploaded file: ${filePath}`);
      } else {
        console.warn(`Uploaded file not found for deletion: ${filePath}`);
      }
    });

    await Promise.all(deletePromises);
    console.log('All uploaded additional files have been deleted.');

    // Optionally, ensure 'uploads' and 'output' directories are empty
    await deleteAllFilesInDirectory(uploadsDir);
    await deleteAllFilesInDirectory(outputDir);
    console.log('Uploads and Output directories are now empty.');
  } catch (cleanupError) {
    console.error('Error during file cleanup:', cleanupError);
    // Optionally, implement retry logic or notify administrators
  }
}

// Helper function to delete all files in a directory
async function deleteAllFilesInDirectory(directoryPath) {
  try {
    const files = await fs.promises.readdir(directoryPath);
    const deletePromises = files.map(file => fs.promises.unlink(path.join(directoryPath, file)));
    await Promise.all(deletePromises);
    console.log(`Deleted all files in directory: ${directoryPath}`);
  } catch (error) {
    // If the directory is already empty, ignore the error
    if (error.code === 'ENOENT') {
      console.warn(`Directory not found: ${directoryPath}`);
    } else if (error.code !== 'ENOENT' && error.code !== 'EISDIR') {
      console.error(`Error deleting files in directory ${directoryPath}:`, error);
    }
    // EISDIR error is thrown if trying to unlink a directory; ignore if that's the case
  }
}

// Unified Route for Processing (Preview and Finalization)
router.post('/process', upload.array('files'), async (req, res) => {
  try {
    const { personalInfo, paymentInfo, action } = req.body;
    let { receipts } = req.body;

    // Parse receipts if it's a JSON string
    if (typeof receipts === 'string') {
      try {
        receipts = JSON.parse(receipts);
      } catch (parseError) {
        return res.status(400).json({ error: 'Receipts must be a valid JSON string.' });
      }
    }

    // Input Validation
    if (!personalInfo || typeof personalInfo !== 'string') {
      return res.status(400).json({ error: 'Personal information is required and must be a JSON string.' });
    }

    if (!paymentInfo || typeof paymentInfo !== 'string') {
      return res.status(400).json({ error: 'Payment information is required and must be a JSON string.' });
    }

    if (!action || (action !== 'preview' && action !== 'finalize')) {
      return res.status(400).json({ error: 'Invalid action specified.' });
    }

    // Further parse personalInfo and paymentInfo
    let parsedPersonalInfo, parsedPaymentInfo;
    try {
      parsedPersonalInfo = JSON.parse(personalInfo);
      parsedPaymentInfo = JSON.parse(paymentInfo);
    } catch (parseError) {
      return res.status(400).json({ error: 'PersonalInfo and PaymentInfo must be valid JSON strings.' });
    }

    // Enhanced Data Validation
    if (!parsedPersonalInfo.date || !parsedPersonalInfo.name) {
      return res.status(400).json({ error: 'Datum och Namn krävs.' });
    }

    if (!receipts || !Array.isArray(receipts) || receipts.length === 0) {
      return res.status(400).json({ error: 'Minst ett kvitto krävs.' });
    }

    for (let i = 0; i < receipts.length; i++) {
      const receipt = receipts[i];
      if (!receipt.date) {
        return res.status(400).json({ error: `Datum krävs för kvitto ${i + 1}.` });
      }
      if (!receipt.totalCost || isNaN(parseFloat(receipt.totalCost))) {
        return res.status(400).json({ error: `Totalkostnad krävs och måste vara ett nummer för kvitto ${i + 1}.` });
      }
      if (!receipt.vat || isNaN(parseFloat(receipt.vat))) {
        return res.status(400).json({ error: `Moms krävs och måste vara ett nummer för kvitto ${i + 1}.` });
      }

      // Additional Validation: Ensure date is a valid date
      const dateObj = new Date(receipt.date);
      if (isNaN(dateObj.getTime())) {
        return res.status(400).json({ error: `Ogiltigt datum format för kvitto ${i + 1}.` });
      }

      // If costCenter is "Annat", ensure customCostCenter is provided
      if (receipt.costCenter === 'Annat' && !receipt.customCostCenter) {
        return res.status(400).json({ error: `Ange kostnadsställe för "Annat" alternativet för kvitto ${i + 1}.` });
      }
    }

    // Calculate summary
    const totalAmount = receipts.reduce((sum, receipt) => {
      const cost = parseFloat(receipt.totalCost);
      return sum + (isNaN(cost) ? 0 : cost);
    }, 0);

    const totalVAT = receipts.reduce((sum, receipt) => {
      const vat = parseFloat(receipt.vat);
      return sum + (isNaN(vat) ? 0 : vat);
    }, 0);

    // Ensure totalAmount and totalVAT are valid
    if (isNaN(totalAmount)) {
      return res.status(400).json({ error: 'Totalt belopp är ogiltigt.' });
    }

    if (isNaN(totalVAT)) {
      return res.status(400).json({ error: 'Total moms är ogiltig.' });
    }

    // Handle additional files
    const additionalFiles = req.files || [];

    console.log(`Received ${additionalFiles.length} additional file(s):`);
    additionalFiles.forEach((file, index) => {
      console.log(`File ${index + 1}:`);
      console.log(`  Original Name: ${file.originalname}`);
      console.log(`  Stored Path: ${file.path}`);
      console.log(`  MIME Type: ${file.mimetype}`);
    });

    // Create new Receipt document
    const newReceipt = new Receipt({
      date: parsedPersonalInfo.date,
      name: parsedPersonalInfo.name,
      receipts: receipts.map((receipt) => ({
        ...receipt,
        totalCost: parseFloat(receipt.totalCost) || 0,
        vat: parseFloat(receipt.vat) || 0,
      })),
      totalAmount,
      totalVAT,
      bankName: parsedPaymentInfo.bankName,
      clearingNumber: parsedPaymentInfo.clearingNumber,
      accountNumber: parsedPaymentInfo.accountNumber,
      otherMethod: parsedPaymentInfo.otherMethod,
      additionalFiles: additionalFiles.map(file => ({
        path: file.path,
        originalName: file.originalname,
        mimeType: file.mimetype,
      })),
      sessionID: req.session ? req.session.id : '', // Associate with session
    });

    await newReceipt.save();
    console.log('Receipt saved to database with ID:', newReceipt._id);
    console.log('Additional Files:', newReceipt.additionalFiles);

    // Format date for the PDF filename
    const formattedDate = formatDate(parsedPersonalInfo.date);
    const pdfFilename = `Utläggsblankett_${formattedDate}_${uuidv4()}.pdf`;
    const pdfPath = path.join(outputDir, pdfFilename);

    console.log(`PDF will be saved at: ${pdfPath}`);

    // Call the generatePDF function from pdfGenerator.js
    await generatePDF(newReceipt, pdfPath);
    console.log('PDF generated at:', pdfPath);

    if (action === 'preview') {
      // Read the generated PDF and send it as a buffer
      const pdfBuffer = fs.readFileSync(pdfPath);
      res.setHeader('Content-Type', 'application/pdf');
      res.send(pdfBuffer);
    } else if (action === 'finalize') {
      // Send Email
      await sendEmail(newReceipt.name, pdfPath, pdfFilename);
      console.log('Email sent successfully.');

      // Cleanup: Delete PDF and Uploaded Files
      await cleanupFiles(pdfPath, additionalFiles);
      console.log('Cleanup completed.');

      res.json({ message: 'PDF genererad och skickad via e-post.' });
    } else {
      res.status(400).json({ error: 'Ogiltig åtgärd.' });
    }
  } catch (error) {
    console.error('Error in /process:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

// Helper function to format dates in YYYY-MM-DD format
function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
