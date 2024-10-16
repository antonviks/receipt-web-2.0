// client/src/components/AdditionalFilesForm.js

import React, { useState, useEffect } from 'react';
import { useCookies } from 'react-cookie';

function AdditionalFilesForm({ onNext, onBack, onFilesChange }) {
  const [cookies, setCookie] = useCookies(['additionalFiles']); // Removed 'removeCookie'
  const [files, setFiles] = useState([]);
  const [fileNames, setFileNames] = useState(cookies.additionalFiles || []);

  useEffect(() => {
    if (fileNames.length > 0) {
      console.log('Existing file names detected. Resetting files and cookies.');
      setFileNames([]);
      setFiles([]);
      setCookie('additionalFiles', [], { path: '/' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this runs only once on mount

  const handleFileUpload = (e) => {
    const uploadedFiles = Array.from(e.target.files);
    // Append new files to existing files
    const newFiles = [...files, ...uploadedFiles];
    setFiles(newFiles);
    onFilesChange(newFiles);
    // Update file names in cookies
    const newFileNames = [...fileNames, ...uploadedFiles.map(file => file.name)];
    setFileNames(newFileNames);
    setCookie('additionalFiles', newFileNames, { path: '/' });
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
            accept="image/*,application/pdf"
            onChange={handleFileUpload}
            className="form-control"
          />
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
          <button type="submit" className="btn btn-primary">
            Nästa
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdditionalFilesForm;
