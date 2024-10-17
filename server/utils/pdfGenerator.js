// server/utils/pdfGenerator.js

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { PDFDocument: PDFLibDocument } = require('pdf-lib'); // Import pdf-lib

async function generatePDF(receiptData, pdfPath) {
  try {
    console.log('Starting PDF generation...');
    
    // Separate additionalFiles into images and PDFs
    const additionalImages = receiptData.additionalFiles.filter(file => 
      ['image/jpeg', 'image/jpg', 'image/png'].includes(file.mimeType)
    );
    
    const additionalPDFs = receiptData.additionalFiles.filter(file => 
      ['application/pdf', 'application/x-pdf', 'application/octet-stream'].includes(file.mimeType)
    );
    
    console.log(`Found ${additionalImages.length} additional image(s) to embed.`);
    console.log(`Found ${additionalPDFs.length} additional PDF(s) to merge.`);
    
    // Step 1: Generate the main PDF using pdfkit, embedding additional images
    await generateMainPDF(receiptData, pdfPath, additionalImages);
    console.log('Main PDF generated with embedded images.');
    
    // Step 2: Merge additional PDFs
    if (additionalPDFs.length > 0) {
      // Read the main PDF
      const mainPdfBytes = fs.readFileSync(pdfPath);
      const mainPdf = await PDFLibDocument.load(mainPdfBytes, { ignoreEncryption: true }); // Added option
      console.log('Main PDF loaded for merging.');
      
      for (const file of additionalPDFs) {
        console.log(`Attempting to merge PDF: ${file.originalName} at path ${file.path}`);
        
        if (!fs.existsSync(file.path)) {
          console.error(`Additional PDF not found: ${file.path}`);
          continue; // Skip if file doesn't exist
        }
        
        try {
          const additionalPdfBytes = fs.readFileSync(file.path);
          const additionalPdf = await PDFLibDocument.load(additionalPdfBytes, { ignoreEncryption: true }); // Added option
          console.log(`Loaded additional PDF: ${file.originalName}`);
          
          const copiedPages = await mainPdf.copyPages(additionalPdf, additionalPdf.getPageIndices());
          copiedPages.forEach((page) => {
            mainPdf.addPage(page);
          });
          console.log(`Merged PDF: ${file.originalName} into main PDF.`);
        } catch (mergeError) {
          console.error(`Error merging PDF (${file.originalName}):`, mergeError);
          // Continue merging other PDFs despite the error
        }
      }
      
      // Serialize the merged PDF and overwrite the original main PDF
      const mergedPdfBytes = await mainPdf.save();
      fs.writeFileSync(pdfPath, mergedPdfBytes);
      console.log('All additional PDFs have been merged into the main PDF.');
    } else {
      console.log('No additional PDFs to merge.');
    }
    
    console.log('PDF generation process completed.');
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

async function generateMainPDF(receiptData, pdfPath, additionalImages) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const writeStream = fs.createWriteStream(pdfPath);
      doc.pipe(writeStream);
      
      // Insert logo in the top left
      const logoPath = path.join(__dirname, '../assets/logo.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 45, { width: 150 });
      } else {
        console.error('Logo file not found at:', logoPath);
      }
      
      // Top Right: "Utläggsblankett" with subtitle
      doc
        .fontSize(16)
        .text('Utläggsblankett', 400, 50, { align: 'right' })
        .fontSize(6)
        .text('Detta dokument kommer att godkännas digitalt.', 400, 70, { align: 'right' });
      
      // Personal Information Section
      doc
        .fontSize(10)
        .text(`Datum: ${formatDate(receiptData.date)}`, 50, 120)
        .text(`Namn: ${receiptData.name}`, 50, 140);
      
      // Spacer
      doc.moveDown();
      
      // Table Header
      const tableTop = 200;
      const itemX = 50;
      const itemY = tableTop;
      
      const columnWidths = {
        datum: 60,
        ändamål: 110,
        kostnadsställe: 90,
        kommentar: 120,
        totalkostnad: 70,
        moms: 60,
      };

      // Draw Table Header
      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .text('Datum', itemX, itemY)
        .text('Ändamål', itemX + columnWidths.datum, itemY)
        .text('Kostnadsställe', itemX + columnWidths.datum + columnWidths.ändamål, itemY)
        .text('Kommentar', itemX + columnWidths.datum + columnWidths.ändamål + columnWidths.kostnadsställe, itemY)
        .text('Totalkostnad', itemX + columnWidths.datum + columnWidths.ändamål + columnWidths.kostnadsställe + columnWidths.kommentar, itemY)
        .text('Moms', itemX + columnWidths.datum + columnWidths.ändamål + columnWidths.kostnadsställe + columnWidths.kommentar + columnWidths.totalkostnad, itemY);

      // Draw Line Below Header
      doc.moveTo(itemX, tableTop + 15).lineTo(550, tableTop + 15).stroke();

      // Populate Table Rows
      let rowY = tableTop + 25;
      receiptData.receipts.forEach((receipt) => {
        doc
          .font('Helvetica')
          .fontSize(8)
          .text(formatDate(receipt.date), itemX, rowY)
          .text(receipt.purpose, itemX + columnWidths.datum, rowY)
          .text(receipt.costCenter === 'Annat' ? receipt.customCostCenter : receipt.costCenter, itemX + columnWidths.datum + columnWidths.ändamål, rowY)
          .text(receipt.comment || '-', itemX + columnWidths.datum + columnWidths.ändamål + columnWidths.kostnadsställe, rowY, { width: columnWidths.kommentar })
          .text(`${parseFloat(receipt.totalCost).toFixed(2)} SEK`, itemX + columnWidths.datum + columnWidths.ändamål + columnWidths.kostnadsställe + columnWidths.kommentar, rowY)
          .text(`${parseFloat(receipt.vat).toFixed(2)} SEK`, itemX + columnWidths.datum + columnWidths.ändamål + columnWidths.kostnadsställe + columnWidths.kommentar + columnWidths.totalkostnad, rowY);

        rowY += 20;
      });

      // Summary Section
      const summaryY = rowY + 20;
      doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .text('Sammanfattning', 50, summaryY)
        .font('Helvetica')
        .fontSize(10)
        .text(`Totalt belopp: ${receiptData.totalAmount.toFixed(2)} SEK`, 50, summaryY + 25)
        .text(`Moms: ${receiptData.totalVAT.toFixed(2)} SEK`, 50, summaryY + 45);

      // Payment Information Section 
      const paymentY = summaryY + 80;
      doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .text('Betalningsinformation', 50, paymentY)
        .font('Helvetica')
        .fontSize(10)
        .text(`Bankens namn: ${receiptData.bankName || '-'}`, 50, paymentY + 25)
        .text(`Clearing nummer: ${receiptData.clearingNumber || '-'}`, 50, paymentY + 45)
        .text(`Kontonummer: ${receiptData.accountNumber || '-'}`, 50, paymentY + 65)
        .text(`Annat sätt: ${receiptData.otherMethod || '-'}`, 50, paymentY + 85);

      // Handle Additional Images
      additionalImages.forEach((file, index) => {
        if (fs.existsSync(file.path)) {
          doc.addPage();
          doc.image(file.path, {
            fit: [500, 600],
            align: 'center',
            valign: 'center',
          });
          console.log(`Embedded additional image: ${file.path}`);
        } else {
          console.error(`Additional image path does not exist: ${file.path}`);
        }
      });
      
      doc.end();

      writeStream.on('finish', () => {
        console.log('Main PDF writing completed.');
        resolve();
      });

      writeStream.on('error', (err) => {
        console.error('Error writing main PDF:', err);
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
}

// Function to format dates in YYYY-MM-DD format
function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

module.exports = generatePDF;
