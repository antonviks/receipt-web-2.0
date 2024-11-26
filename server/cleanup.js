// server/cleanup.js

const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, 'output');

function cleanupOldFiles() {
  const now = Date.now();
  const expirationTime = 60 * 60 * 1000; // Files older than 1 hour

  fs.readdir(outputDir, (err, files) => {
    if (err) {
      console.error('Error reading output directory:', err);
      return;
    }

    files.forEach((file) => {
      const filePath = path.join(outputDir, file);
      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.error('Error stating file:', err);
          return;
        }

        if (now - stats.mtimeMs > expirationTime) {
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error('Error deleting file:', err);
            } else {
              console.log('Deleted old PDF:', filePath);
            }
          });
        }
      });
    });
  });
}

module.exports = cleanupOldFiles;
