// server/routes/receipts.js

const express = require('express');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const generatePDF = require('../utils/pdfGenerator');
const sendEmail = require('../utils/emailSender');
const { createRateLimiter } = require('../middleware/auth');

const router = express.Router();

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB per file
const MAX_FILES = 30;

// HEIC/HEIF photos are converted to JPEG in the browser before upload,
// so the server only needs to accept formats the PDF generator can embed.
const FILE_EXTENSIONS = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'application/pdf': '.pdf',
};

// Every request gets its own temporary folder. Uploads and the generated PDF
// live there, and the whole folder is deleted when the response ends,
// whether the request succeeded, failed or was aborted.
async function createWorkDir(req, res, next) {
  try {
    req.workDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'korsredo-'));
    res.on('close', () => {
      fs.promises
        .rm(req.workDir, { recursive: true, force: true })
        .catch((err) => console.error('Failed to delete temp folder:', err));
    });
    next();
  } catch (err) {
    next(err);
  }
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, req.workDir),
    filename: (req, file, cb) => cb(null, `${crypto.randomUUID()}${FILE_EXTENSIONS[file.mimetype]}`),
  }),
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES },
  fileFilter: (req, file, cb) => {
    if (FILE_EXTENSIONS[file.mimetype]) return cb(null, true);
    const err = new Error('Endast JPEG, PNG, HEIC eller PDF-filer är tillåtna.');
    err.isUserError = true;
    return cb(err);
  },
});

// Turn upload errors into clear 400 responses instead of a generic 500
function handleUpload(req, res, next) {
  upload.array('files', MAX_FILES)(req, res, (err) => {
    if (!err) return next();
    let message = 'Uppladdningen misslyckades. Försök igen.';
    if (err.code === 'LIMIT_FILE_SIZE') message = 'En av filerna är större än 10 MB.';
    else if (err.code === 'LIMIT_FILE_COUNT') message = `Max ${MAX_FILES} filer per inlämning.`;
    else if (err.isUserError) message = err.message;
    else console.error('Upload error:', err);
    return res.status(400).json({ error: message });
  });
}

// Max 60 previews/submissions per hour per IP
const processLimiter = createRateLimiter({ windowMs: 60 * 60 * 1000, limit: 60 });
function limitProcessing(req, res, next) {
  if (processLimiter.isLimited(req.ip)) {
    return res.status(429).json({ error: 'För många förfrågningar. Försök igen senare.' });
  }
  processLimiter.hit(req.ip);
  return next();
}

// Format dates as YYYY-MM-DD
function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Make a name safe for a file name: "Anna-Karin Ö'Berg" -> "Anna-Karin_Ö'Berg".
// Keeps letters (incl. åäö), digits, - and '; everything else becomes _.
function safeFilenamePart(value) {
  const cleaned = String(value)
    .normalize('NFC')
    .replace(/[^\p{L}\p{N}'-]+/gu, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60);
  return cleaned || 'okänd';
}

// Unified route for preview and finalization
router.post('/process', limitProcessing, createWorkDir, handleUpload, async (req, res) => {
  try {
    const { personalInfo, paymentInfo, action, receipts: receiptsJSON } = req.body;
    if (!personalInfo || !paymentInfo || !action) {
      return res.status(400).json({ error: 'Obligatoriska fält saknas.' });
    }
    if (action !== 'preview' && action !== 'finalize') {
      return res.status(400).json({ error: 'Ogiltig åtgärd.' });
    }

    let parsedPersonalInfo;
    let parsedPaymentInfo;
    let receipts;
    try {
      parsedPersonalInfo = JSON.parse(personalInfo);
      parsedPaymentInfo = JSON.parse(paymentInfo);
      receipts = JSON.parse(receiptsJSON);
    } catch (err) {
      return res.status(400).json({ error: 'Ogiltig data.' });
    }

    if (!parsedPersonalInfo.date || !parsedPersonalInfo.name) {
      return res.status(400).json({ error: 'Datum och Namn krävs.' });
    }
    if (!Array.isArray(receipts) || receipts.length === 0) {
      return res.status(400).json({ error: 'Minst en redovisning krävs.' });
    }
    for (let i = 0; i < receipts.length; i++) {
      const r = receipts[i];
      if (!r.date || !r.purpose || !r.costCenter || !r.totalCost) {
        return res.status(400).json({ error: `Saknas fält för redovisning ${i + 1}.` });
      }
    }

    // Match uploaded files to receipts using the per-receipt count from the client
    const uploadedFiles = req.files || [];
    const counts = receipts.map((r) =>
      Number.isInteger(r.filesCount) && r.filesCount > 0 ? r.filesCount : 0
    );
    if (counts.reduce((a, b) => a + b, 0) !== uploadedFiles.length) {
      return res.status(400).json({ error: 'Filerna matchar inte redovisningarna. Försök igen.' });
    }

    let fileIndex = 0;
    receipts = receipts.map((r, i) => {
      const subset = uploadedFiles.slice(fileIndex, fileIndex + counts[i]);
      fileIndex += counts[i];
      return {
        date: r.date,
        purpose: r.purpose,
        costCenter: r.costCenter,
        customCostCenter: r.customCostCenter,
        comment: r.comment,
        totalCost: parseFloat(r.totalCost) || 0,
        files: subset.map((f) => ({ path: f.path, mimetype: f.mimetype })),
      };
    });

    const totalAmount = receipts.reduce((sum, r) => sum + r.totalCost, 0);

    // Nothing is stored: the data only goes into the PDF
    const pdfInput = {
      date: parsedPersonalInfo.date,
      name: parsedPersonalInfo.name,
      receipts,
      totalAmount,
      bankName: parsedPaymentInfo.bankName,
      clearingNumber: parsedPaymentInfo.clearingNumber,
      accountNumber: parsedPaymentInfo.accountNumber,
    };

    // On disk the PDF gets a random name; the email attachment gets a readable one
    const pdfPath = path.join(req.workDir, `${crypto.randomUUID()}.pdf`);
    const pdfFilename = `Utläggsblankett_${formatDate(parsedPersonalInfo.date)}_${safeFilenamePart(parsedPersonalInfo.name)}.pdf`;
    await generatePDF(pdfInput, pdfPath);

    if (action === 'preview') {
      // Send the PDF itself; it is never stored or served from a public URL
      const pdf = await fs.promises.readFile(pdfPath);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="forhandsgranskning.pdf"',
        'Cache-Control': 'no-store',
      });
      return res.send(pdf);
    }

    await sendEmail(parsedPersonalInfo.name, pdfPath, pdfFilename, parsedPersonalInfo.email);
    console.log('Utläggsblankett sent by email.');
    return res.json({ message: 'PDF genererad och skickad via e-post.' });
  } catch (error) {
    console.error('Error in /process:', error);
    return res
      .status(500)
      .json({ error: 'Något gick fel när blanketten skulle skapas. Försök igen.' });
  }
});

module.exports = router;
