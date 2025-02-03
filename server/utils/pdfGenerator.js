// server/utils/pdfGenerator.js

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { PDFDocument: PDFLib, StandardFonts } = require('pdf-lib');

async function generatePDF(receiptData, pdfPath) {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('Starting PDF generation...');
      const tempPdfPath = path.join(__dirname, '../output/temp.pdf');
      const doc = new PDFDocument({ margin: 50 });
      const writeStream = fs.createWriteStream(tempPdfPath);
      doc.pipe(writeStream);

      // Insert logo in the top left
      const logoPath = path.join(__dirname, '../assets/logo.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 45, { width: 150 });
      } else {
        console.error('Logo file not found at:', logoPath);
      }

      // Top Right: "Utläggsblankett"
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

      doc.moveDown(); // Spacer

      // Table Header
      const tableTop = 200;
      const itemX = 50;
      const itemY = tableTop;

      // Adjusted widths (bigger for ändamål, smaller for kommentar)
      const columnWidths = {
        datum: 60,
        ändamål: 160,
        kostnadsställe: 100,
        kommentar: 90,
        totalkostnad: 90,
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

      // Draw Line Below Header
      doc.moveTo(itemX, tableTop + 15).lineTo(550, tableTop + 15).stroke();

      let rowY = tableTop + 25;

      // For each receipt, measure heights for each column, then draw them
      receiptData.receipts.forEach((receipt) => {
        const datumStr = formatDate(receipt.date);
        const andamalStr = receipt.purpose;
        const kostnadStr = (receipt.costCenter === 'Annat')
          ? receipt.customCostCenter
          : receipt.costCenter;
        const kommentarStr = receipt.comment || '-';
        const totalStr = `${parseFloat(receipt.totalCost).toFixed(2)} SEK`;

        // 1) Measure each text’s height within its column width
        const datumHeight = doc.heightOfString(datumStr, { width: columnWidths.datum });
        const andamalHeight = doc.heightOfString(andamalStr, { width: columnWidths.ändamål });
        const kostnadHeight = doc.heightOfString(kostnadStr, { width: columnWidths.kostnadsställe });
        const kommentarHeight = doc.heightOfString(kommentarStr, { width: columnWidths.kommentar });
        const totalHeight = doc.heightOfString(totalStr, { width: columnWidths.totalkostnad });

        // 2) Determine max row height
        const rowHeight = Math.max(
          datumHeight,
          andamalHeight,
          kostnadHeight,
          kommentarHeight,
          totalHeight,
        );

        // 3) Print columns at rowY
        doc.fontSize(8).font('Helvetica')
          // Datum
          .text(datumStr, itemX, rowY, {
            width: columnWidths.datum,
            ellipsis: true,
          })
          // Ändamål
          .text(andamalStr, itemX + columnWidths.datum, rowY, {
            width: columnWidths.ändamål,
            ellipsis: true,
            align: 'left',
          })
          // Kostnadsställe
          .text(kostnadStr,
            itemX + columnWidths.datum + columnWidths.ändamål,
            rowY,
            {
              width: columnWidths.kostnadsställe,
              ellipsis: true,
              align: 'left',
            }
          )
          // Kommentar
          .text(kommentarStr,
            itemX + columnWidths.datum + columnWidths.ändamål + columnWidths.kostnadsställe,
            rowY,
            {
              width: columnWidths.kommentar,
              ellipsis: true,
              align: 'left',
            }
          )
          // Totalkostnad
          .text(totalStr,
            itemX + columnWidths.datum + columnWidths.ändamål + columnWidths.kostnadsställe + columnWidths.kommentar,
            rowY,
            {
              width: columnWidths.totalkostnad,
              ellipsis: true,
            }
          );

        // 4) Move rowY by rowHeight + some spacing
        rowY += rowHeight + 5;
      });

      // Summary Section
      const summaryY = rowY + 40;
      doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .text('Sammanfattning', 50, summaryY)
        .font('Helvetica')
        .fontSize(10)
        .text(`Totalt belopp: ${receiptData.totalAmount.toFixed(2)} SEK`, 50, summaryY + 25)

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
        .text(`Kontonummer: ${receiptData.accountNumber || '-'}`, 50, paymentY + 65);

      // Footer Section
      const footerY = doc.page.height - doc.page.margins.bottom - 60;
      const dividerY = footerY - 10;
      doc
        .moveTo(50, dividerY)
        .lineTo(550, dividerY)
        .lineWidth(1)
        .strokeColor('black')
        .stroke();

      doc
        .fontSize(8)
        .text('Korskyrkan Stockholm, Birger Jarlsgatan 66, 114 29 Stockholm', 50, footerY)
        .text('Tel: 08-411 50 04 | Org.nr: 802001-0636', 50, footerY + 15)
        .text('www.korskyrkanstockholm.se | info@korskyrkanstockholm.se', 50, footerY + 30)
        .text('Bankgiro: 829-6196 | Swish: 123 589 78 30', 50, footerY + 45);

      // Handle Additional Images and PDFs
      const uploadedPdfPaths = [];

      for (const receipt of receiptData.receipts) {
        if (receipt.imagePath) {
          const fileExtension = path.extname(receipt.imagePath).toLowerCase();

          if (fileExtension === '.pdf') {
            // If the uploaded file is a PDF, collect its path to merge later
            uploadedPdfPaths.push({ path: receipt.imagePath, purpose: receipt.purpose });
          } else {
            // It's an image, add a new page and embed the image
            doc.addPage();

            // Add 'ändamål' at the top of the page
            doc
              .font('Helvetica-Bold')
              .fontSize(12)
              .text(`Ändamål: ${receipt.purpose}`, 50, 50);

            // Add the image below the 'ändamål' text
            const imagePath = receipt.imagePath;

            if (fs.existsSync(imagePath)) {
              doc.image(imagePath, {
                fit: [500, 600],
                align: 'center',
                valign: 'center',
                y: 80,
              });
              console.log(`Embedded additional image: ${imagePath}`);
            } else {
              console.error(`Image path does not exist: ${imagePath}`);
            }
          }
        }
      }

      doc.end();

      writeStream.on('finish', async () => {
        console.log('PDF generation completed successfully.');

        if (uploadedPdfPaths.length > 0) {
          // Use pdf-lib to merge PDFs
          try {
            // Load the main PDF
            const mainPdfBytes = fs.readFileSync(tempPdfPath);
            const mainPdfDoc = await PDFLib.load(mainPdfBytes);

            // For each uploaded PDF
            for (const { path: pdfPath, purpose } of uploadedPdfPaths) {
              const pdfBytes = fs.readFileSync(pdfPath);
              const pdfDoc = await PDFLib.load(pdfBytes);

              // Create a new page with 'ändamål' header
              const newPage = mainPdfDoc.addPage();
              const { width, height } = newPage.getSize();

              const helveticaBoldFont = await mainPdfDoc.embedFont(StandardFonts.HelveticaBold); // Use StandardFonts
              newPage.drawText(`Ändamål: ${purpose}`, {
                x: 50,
                y: height - 50,
                size: 12,
                font: helveticaBoldFont,
              });

              // Copy pages from the uploaded PDF to the main PDF
              const copiedPages = await mainPdfDoc.copyPages(pdfDoc, pdfDoc.getPageIndices());
              copiedPages.forEach((page) => {
                mainPdfDoc.addPage(page);
              });
            }

            // Save the merged PDF
            const mergedPdfBytes = await mainPdfDoc.save();
            fs.writeFileSync(pdfPath, mergedPdfBytes);

            // Remove the temporary PDF
            fs.unlinkSync(tempPdfPath);

            console.log('PDFs merged successfully.');
            resolve();
          } catch (mergeError) {
            console.error('Error merging PDFs:', mergeError);
            reject(mergeError);
          }
        } else {
          // No PDFs to merge, just rename the temp PDF to the final path
          fs.renameSync(tempPdfPath, pdfPath);
          resolve();
        }
      });

      writeStream.on('error', (err) => {
        console.error('Error writing PDF:', err);
        reject(err);
      });

    } catch (error) {
      console.error('Error during PDF generation:', error);
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