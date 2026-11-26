// client/src/components/ReceiptDetailsForm.js

import React, { useEffect, useState } from 'react';
import { useCookies } from 'react-cookie';
import compressImage from '../utils/compressImage';

// Some browsers (e.g. Chrome on Windows/Android) report HEIC files with an
// empty type, so check the file extension too.
function isHeicFile(file) {
  return /^image\/hei[cf]/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
}

// The HEIC decoder is large, so it is only downloaded when someone picks a HEIC photo
async function convertHeicToJpeg(file) {
  const { heicTo } = await import('heic-to');
  const blob = await heicTo({ blob: file, type: 'image/jpeg', quality: 0.9 });
  const newName = file.name.replace(/\.(heic|heif)$/i, '') + '.jpg';
  return new File([blob], newName, { type: 'image/jpeg', lastModified: Date.now() });
}

function ReceiptDetailsForm({ receipts, setReceipts, onNext, onBack }) {
  const [, setCookie] = useCookies(['receipts']);
  const [processingFiles, setProcessingFiles] = useState(false);

  useEffect(() => {
    // Save receipts minus the actual file objects to cookies (to avoid huge cookie size)
    const receiptsWithoutFiles = receipts.map(({ files, ...rest }) => rest);
    setCookie('receipts', receiptsWithoutFiles, { path: '/' });
  }, [receipts, setCookie]);

  // Main function to handle multiple file uploads (HEIC conversion + photo compression)
  const handleFileChangeMulti = async (index, newFiles) => {
    // Convert FileList to array
    const incomingFiles = Array.from(newFiles);
    const processedFiles = [];
    setProcessingFiles(true);

    for (const file of incomingFiles) {
      if (isHeicFile(file)) {
        try {
          // iPhone photos: convert to JPEG, then shrink like any other photo
          const jpegFile = await convertHeicToJpeg(file);
          processedFiles.push(await compressImage(jpegFile));
        } catch (err) {
          console.error('Error converting HEIC file:', err);
          alert(`Kunde inte läsa bilden ${file.name}. Prova att spara den som JPEG och ladda upp igen.`);
        }
      } else {
        // JPEG/PNG photos are shrunk; PDFs are passed through unchanged
        processedFiles.push(await compressImage(file));
      }
    }
    setProcessingFiles(false);

    // Merge them with the latest state (the user may have edited other fields meanwhile)
    setReceipts((current) =>
      current.map((receipt, i) =>
        i === index
          ? { ...receipt, files: [...(receipt.files || []), ...processedFiles] }
          : receipt
      )
    );
  };

  const handleAddReceipt = () => {
    setReceipts([
      ...receipts,
      {
        date: '',
        purpose: '',
        costCenter: '',
        customCostCenter: '',
        comment: '',
        totalCost: '',
        files: [],
      },
    ]);
  };

  const handleRemoveReceipt = (index) => {
    const updatedReceipts = receipts.filter((_, i) => i !== index);
    setReceipts(updatedReceipts);
  };

  const handleChange = (index, field, value) => {
    const updatedReceipts = receipts.map((receipt, i) => {
      if (i === index) {
        return { ...receipt, [field]: value };
      }
      return receipt;
    });
    setReceipts(updatedReceipts);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Basic Validation
    for (let i = 0; i < receipts.length; i++) {
      const receipt = receipts[i];
      if (!receipt.date || !receipt.purpose || !receipt.costCenter || !receipt.totalCost) {
        alert(`Vänligen fyll i alla obligatoriska fält för redovisning ${i + 1}.`);
        return;
      }
      if (receipt.costCenter === 'Annat' && !receipt.customCostCenter.trim()) {
        alert(`Ange kostnadsställe för redovisning ${i + 1}.`);
        return;
      }
    }

    // Pass data to parent
    onNext(receipts);
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">Redovisning</h2>
      <form onSubmit={handleSubmit}>
        {receipts.map((receipt, index) => (
          <div key={index} className="card mb-3">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span>Redovisning {index + 1}</span>
              {receipts.length > 1 && (
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => handleRemoveReceipt(index)}
                >
                  Ta bort
                </button>
              )}
            </div>
            <div className="card-body">
              {/* Date Field */}
              <div className="mb-3">
                <label htmlFor={`date-${index}`} className="form-label">Datum</label>
                <input
                  type="date"
                  id={`date-${index}`}
                  className="form-control"
                  value={receipt.date}
                  onChange={(e) => handleChange(index, 'date', e.target.value)}
                  required
                />
              </div>

              {/* Purpose Field (Ändamål) */}
              <div className="mb-3">
                <label htmlFor={`purpose-${index}`} className="form-label">Ändamål - Beskriv vad, vem och varför</label>
                <input
                  type="text"
                  id={`purpose-${index}`}
                  className="form-control"
                  value={receipt.purpose}
                  onChange={(e) => handleChange(index, 'purpose', e.target.value)}
                  required
                />
              </div>

              {/* Cost Center Field */}
              <div className="mb-3">
                <label htmlFor={`costCenter-${index}`} className="form-label">Kostnadsställe</label>
                <select
                  id={`costCenter-${index}`}
                  className="form-select"
                  value={receipt.costCenter}
                  onChange={(e) => handleChange(index, 'costCenter', e.target.value)}
                  required
                >
                  <option value="">Välj kostnadsställe</option>
                  <option value="Missionen /11">Missionen /11</option>
                  <option value="Församlingen /21">Församlingen /21</option>
                  <option value="Barn /22">Barn /22</option>
                  <option value="Ungdom /23">Ungdom /23</option>
                  <option value="UngaVuxna /24">UngaVuxna /24</option>
                  <option value="Musik /25">Musik /25</option>
                  <option value="Teknik /26">Teknik /26</option>
                  <option value="Service /29">Service /29</option>
                  <option value="Fastighet /41">Fastighet /41</option>
                  <option value="Annat">Annat</option>
                </select>
              </div>

              {receipt.costCenter === 'Annat' && (
                <div className="mb-3">
                  <label className="form-label">Ange kostnadsställe</label>
                  <input
                    type="text"
                    className="form-control"
                    value={receipt.customCostCenter}
                    onChange={(e) => handleChange(index, 'customCostCenter', e.target.value)}
                    required
                  />
                </div>
              )}

              {/* Comment Field */}
              <div className="mb-3">
                <label className="form-label">Valfri kommentar (t.ex. bokföringskonto)</label>
                <input
                  type="text"
                  className="form-control"
                  value={receipt.comment}
                  onChange={(e) => handleChange(index, 'comment', e.target.value)}
                />
              </div>

              {/* Total Cost Field */}
              <div className="mb-3">
                <label className="form-label">Totalkostnad (SEK)</label>
                <input
                  type="number"
                  className="form-control"
                  value={receipt.totalCost}
                  onChange={(e) => handleChange(index, 'totalCost', e.target.value)}
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Multiple File Upload Field (includes HEIC) */}
              <div className="mb-3">
                <label htmlFor={`files-${index}`} className="form-label">Ladda upp filer (bilder eller PDF)</label>
                <input
                  type="file"
                  id={`files-${index}`}
                  className="form-control"
                  accept="image/jpeg, image/png, image/heic, image/heif, application/pdf"
                  multiple
                  onChange={(e) => handleFileChangeMulti(index, e.target.files)}
                />
                {processingFiles && (
                  <div className="form-text">Förbereder bilder…</div>
                )}
                {receipt.files && receipt.files.length > 0 && (
                  <div className="mt-2">
                    <strong>Valda filer:</strong>
                    <ul>
                      {receipt.files.map((f, fileIndex) => (
                        <li key={fileIndex}>
                          {f.name}
                          <button
                            type="button"
                            className="btn btn-link text-danger"
                            onClick={() => {
                              const updatedReceipts = receipts.map((r, rIndex) => {
                                if (rIndex === index) {
                                  const newFileList = [...r.files];
                                  newFileList.splice(fileIndex, 1);
                                  return { ...r, files: newFileList };
                                }
                                return r;
                              });
                              setReceipts(updatedReceipts);
                            }}
                          >
                            Ta bort
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        <button type="button" className="btn btn-secondary mb-3" onClick={handleAddReceipt}>
          Lägg till redovisning
        </button>
        <br />
        <div className="d-flex justify-content-between mb-4">
          {onBack && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onBack}
            >
              Tillbaka
            </button>
          )}
          <button type="submit" className="btn btn-primary" disabled={processingFiles}>
            Nästa
          </button>
        </div>
      </form>
    </div>
  );
}

export default ReceiptDetailsForm;
