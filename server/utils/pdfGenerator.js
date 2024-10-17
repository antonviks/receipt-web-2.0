// server/utils/pdfGenerator.js

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

async function generatePDF(receiptData, pdfPath) {
  return new Promise((resolve, reject) => {
    try {
      console.log('Starting PDF generation...');
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
      receiptData.additionalFiles.forEach((file, index) => {
        if (file.mimeType.startsWith('image/')) {
          const imagePath = path.join(__dirname, '../uploads', path.basename(file.path));
          if (fs.existsSync(imagePath)) {
            doc.addPage();
            doc.image(imagePath, {
              fit: [500, 600],
              align: 'center',
              valign: 'center',
            });
            console.log(`Embedded additional image: ${imagePath}`);
          } else {
            console.error(`Additional image path does not exist: ${imagePath}`);
          }
        }
      });

      doc.end();

      writeStream.on('finish', () => {
        console.log('PDF generation completed successfully.');
        resolve();
      });

      writeStream.on('error', (err) => {
        console.error('Error writing PDF:', err);
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
