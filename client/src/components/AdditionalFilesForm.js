// client/src/components/AdditionalFilesForm.js

import React, { useState, useEffect } from 'react';
import { useCookies } from 'react-cookie';
import heic2any from 'heic2any';

function AdditionalFilesForm({ onNext, onBack, onFilesChange }) {
  const [cookies, setCookie] = useCookies(['additionalFiles']);
  const [files, setFiles] = useState([]);
  const [fileNames, setFileNames] = useState(cookies.additionalFiles || []);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (fileNames.length > 0) {
      console.log('Existing file names detected. Resetting files and cookies.');
      setFileNames([]);
      setFiles([]);
      setCookie('additionalFiles', [], { path: '/' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileUpload = async (e) => {
    const uploadedFiles = Array.from(e.target.files);
    const processedFiles = [];

    setProcessing(true);

    for (const file of uploadedFiles) {
      if (file.type === 'image/heic' || file.type === 'image/heif') {
        try {
          const convertedBlob = await heic2any({
            blob: file,
            toType: 'image/png',
            quality: 0.8, // Adjust quality as needed
          });
          const convertedFile = new File([convertedBlob], `${file.name}.png`, {
            type: 'image/png',
          });
          processedFiles.push(convertedFile);
          console.log(`Converted HEIC file: ${file.name}`);
        } catch (conversionError) {
          console.error(`Error converting HEIC file ${file.name}:`, conversionError);
          alert(`Kunde inte konvertera filen ${file.name}. Vänligen använd JPEG eller PNG.`);
        }
      } else {
        processedFiles.push(file);
      }
    }

    // Append new files to existing files
    const newFiles = [...files, ...processedFiles];
    setFiles(newFiles);
    onFilesChange(newFiles);

    // Update file names in cookies
    const newFileNames = [...fileNames, ...processedFiles.map(file => file.name)];
    setFileNames(newFileNames);
    setCookie('additionalFiles', newFileNames, { path: '/' });

    setProcessing(false);

    // Clear the input to allow selecting the same file again if needed
    e.target.value = null;
  };

  const handleRemoveFile = (index) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    onFilesChange(newFiles);
    // Update file names in cookies
    const newFileNames = [...fileNames];
    newFileNames.splice(index, 1);
    setFileNames(newFileNames);
    setCookie('additionalFiles', newFileNames, { path: '/' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (files.length === 0) {
      alert('Vänligen ladda upp minst en fil.');
      return;
    }
    onNext();
  };

  return (
    <div className="custom-container mt-5">
      <h2 className="text-center mb-4">Ytterligare Filer</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="additionalFiles" className="form-label">Ladda upp filer (bilder eller PDF):</label>
          <input
            type="file"
            id="additionalFiles"
            multiple
            accept="image/jpeg, image/png, image/heic, image/heif, application/pdf"
            onChange={handleFileUpload}
            className="form-control"
            disabled={processing}
          />
          {processing && <p className="mt-2">Konverterar HEIC-filer...</p>}
        </div>

        {/* Display Uploaded Files */}
        {files.length > 0 && (
          <div className="mb-3">
            <h5>Valda Filer:</h5>
            <ul className="list-group">
              {files.map((file, index) => (
                <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                  {file.name}
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => handleRemoveFile(index)}
                  >
                    Ta bort
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="d-flex justify-content-between">
          {onBack && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onBack}
            >
              Tillbaka
            </button>
          )}
          <button type="submit" className="btn btn-primary" disabled={processing}>
            Nästa
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdditionalFilesForm;
