// client/src/components/ReceiptDetailsForm.js

import React, { useEffect } from 'react';
import { useCookies } from 'react-cookie';
import heic2any from 'heic2any';

function ReceiptDetailsForm({ receipts, setReceipts, onNext, onBack }) {
  const [cookies, setCookie] = useCookies(['receipts']);

  useEffect(() => {
    // Load receipts from cookies if available
    if (cookies.receipts && Array.isArray(cookies.receipts)) {
      setReceipts(cookies.receipts);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const receiptsWithoutFiles = receipts.map(({ file, ...rest }) => rest);
    setCookie('receipts', receiptsWithoutFiles, { path: '/' });
  }, [receipts, setCookie]);

  const handleAddReceipt = () => {
    setReceipts([
      ...receipts,
      { date: '', purpose: '', costCenter: '', customCostCenter: '', comment: '', totalCost: '', vat: '', file: null },
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

  const handleFileChange = async (index, file) => {
    let processedFile = file;

    // Convert HEIC/HEIF to JPEG if necessary
    if (file && (file.type === 'image/heic' || file.type === 'image/heif')) {
      try {
        const convertedBlob = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.8,
        });
        const convertedFile = new File([convertedBlob], `${file.name.split('.')[0]}.jpg`, { type: 'image/jpeg' });

        const updatedReceipts = receipts.map((receipt, i) => {
          if (i === index) {
            return { ...receipt, file: convertedFile };
          }
          return receipt;
        });
        setReceipts(updatedReceipts);
      } catch (error) {
        console.error('Error converting HEIC/HEIF:', error);
        alert('Ett fel inträffade vid konvertering av bilden. Försök igen.');
        return;
      }
    } else {
      const updatedReceipts = receipts.map((receipt, i) => {
        if (i === index) {
          return { ...receipt, file: file };
        }
        return receipt;
      });
      setReceipts(updatedReceipts);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Basic Validation
    for (let i = 0; i < receipts.length; i++) {
      const receipt = receipts[i];
      if (!receipt.date || !receipt.purpose || !receipt.costCenter || !receipt.totalCost || !receipt.vat) {
        alert(`Vänligen fyll i alla obligatoriska fält för redovisning ${i + 1}.`);
        return;
      }
      if (receipt.costCenter === 'Annat' && !receipt.customCostCenter.trim()) {
        alert(`Ange kostnadsställe för redovisning ${i + 1}.`);
        return;
      }
    }

    // Pass data to parent component
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

              {/* Purpose Field */}
              <div className="mb-3">
                <label htmlFor={`purpose-${index}`} className="form-label">Ändamål</label>
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
                  <option value="Fastighet /41">Fastighet /41</option>
                  {/* <option value="Annat">Annat</option> */}
                </select>
              </div>

              {/* Custom Cost Center Field (Conditional) */}
              {receipt.costCenter === 'Annat' && (
                <div className="mb-3">
                  <label htmlFor={`customCostCenter-${index}`} className="form-label">Ange kostnadsställe</label>
                  <input
                    type="text"
                    id={`customCostCenter-${index}`}
                    className="form-control"
                    value={receipt.customCostCenter}
                    onChange={(e) => handleChange(index, 'customCostCenter', e.target.value)}
                    placeholder="Ange kostnadsställe"
                    required
                  />
                </div>
              )}

              {/* Comment Field */}
              <div className="mb-3">
                <label htmlFor={`comment-${index}`} className="form-label">Valfri kommentar (bokföringskonto)</label>
                <input
                  type="text"
                  id={`comment-${index}`}
                  className="form-control"
                  value={receipt.comment}
                  onChange={(e) => handleChange(index, 'comment', e.target.value)}
                  placeholder="Ange kommentar"
                />
              </div>

              {/* Total Cost Field */}
              <div className="mb-3">
                <label htmlFor={`totalCost-${index}`} className="form-label">Totalkostnad (SEK)</label>
                <input
                  type="number"
                  id={`totalCost-${index}`}
                  className="form-control"
                  value={receipt.totalCost}
                  onChange={(e) => handleChange(index, 'totalCost', e.target.value)}
                  placeholder="Ange totalkostnad"
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              {/* VAT Field */}
              <div className="mb-3">
                <label htmlFor={`vat-${index}`} className="form-label">Moms (SEK)</label>
                <input
                  type="number"
                  id={`vat-${index}`}
                  className="form-control"
                  value={receipt.vat}
                  onChange={(e) => handleChange(index, 'vat', e.target.value)}
                  placeholder="Ange moms"
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              {/* File Upload Field */}
              <div className="mb-3">
                <label htmlFor={`file-${index}`} className="form-label">Ladda upp bildfil (Valfritt)</label>
                <input
                  type="file"
                  id={`file-${index}`}
                  className="form-control"
                  accept="image/jpeg, image/png, image/heic, image/heif, application/pdf"
                  onChange={async (e) => {
                    await handleFileChange(index, e.target.files[0] || null);
                  }}
                />
                {receipt.file && (
                  <div className="mt-2">
                    <strong>Vald fil:</strong> {receipt.file.name}
                    <button
                      type="button"
                      className="btn btn-link text-danger"
                      onClick={() => handleFileChange(index, null)}
                    >
                      Ta bort
                    </button>
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

export default ReceiptDetailsForm;
