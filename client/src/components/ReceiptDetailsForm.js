// client/src/components/ReceiptDetailsForm.js

import React, { useState, useEffect } from 'react';
import { useCookies } from 'react-cookie';

function ReceiptDetailsForm({ onNext, onBack }) {
  const [cookies, setCookie] = useCookies(['receipts']);
  const [receipts, setReceipts] = useState(cookies.receipts || [
    { date: '', purpose: '', costCenter: '', customCostCenter: '', comment: '', totalCost: '', vat: '', imagePath: '' },
  ]);

  useEffect(() => {
    // Load receipts from cookies if available
    if (cookies.receipts) {
      setReceipts(cookies.receipts);
    }
  }, [cookies.receipts]);

  const handleChange = (index, field, value) => {
    const updatedReceipts = [...receipts];
    updatedReceipts[index][field] = value;

    // If costCenter is not 'Annat', clear customCostCenter
    if (field === 'costCenter' && value !== 'Annat') {
      updatedReceipts[index].customCostCenter = '';
    }

    setReceipts(updatedReceipts);
  };

  const handleAddReceipt = () => {
    const newReceipt = { date: '', purpose: '', costCenter: '', customCostCenter: '', comment: '', totalCost: '', vat: '', imagePath: '' };
    const updatedReceipts = [...receipts, newReceipt];
    setReceipts(updatedReceipts);
  };

  const handleRemoveReceipt = (index) => {
    const updatedReceipts = receipts.filter((_, i) => i !== index);
    setReceipts(updatedReceipts);
  };

  const handleCustomCostCenterChange = (index, value) => {
    const updatedReceipts = [...receipts];
    updatedReceipts[index].customCostCenter = value;
    setReceipts(updatedReceipts);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Basic Validation
    for (let i = 0; i < receipts.length; i++) {
      const receipt = receipts[i];
      if (!receipt.date || !receipt.purpose || !receipt.costCenter || !receipt.totalCost || !receipt.vat) {
        alert(`Vänligen fyll i alla obligatoriska fält för kvitto ${i + 1}.`);
        return;
      }
      if (receipt.costCenter === 'Annat' && !receipt.customCostCenter.trim()) {
        alert(`Ange kostnadsställe för kvitto ${i + 1}.`);
        return;
      }
    }

    // Save data to cookies
    setCookie('receipts', receipts, { path: '/' });

    // Pass data to parent component
    onNext(receipts);
  };

  return (
    <div className="custom-container mt-5">
      <h2 className="text-center mb-4">Kvitto Detaljer</h2>
      <form onSubmit={handleSubmit}>
        {receipts.map((receipt, index) => (
          <div key={index} className="card mb-3">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span>Kvitto {index + 1}</span>
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
              <div className="mb-3">
                <label className="form-label">Datum:</label>
                <input
                  type="date"
                  className="form-control"
                  value={receipt.date}
                  onChange={(e) => handleChange(index, 'date', e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Ändamål</label>
                <input
                  type="text"
                  className="form-control"
                  value={receipt.purpose}
                  onChange={(e) => handleChange(index, 'purpose', e.target.value)}
                  placeholder="Ange ändamål"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Kostnadsställe</label>
                <select
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
                    onChange={(e) => handleCustomCostCenterChange(index, e.target.value)}
                    placeholder="Ange kostnadsställe"
                    required
                  />
                </div>
              )}
              <div className="mb-3">
                <label className="form-label">Kommentar (valfri)</label>
                <input
                  type="text"
                  className="form-control"
                  value={receipt.comment}
                  onChange={(e) => handleChange(index, 'comment', e.target.value)}
                  placeholder="Ange kommentar"
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Totalkostnad (SEK)</label>
                <input
                  type="text"
                  className="form-control"
                  value={receipt.totalCost}
                  onChange={(e) => handleChange(index, 'totalCost', e.target.value)}
                  placeholder="Ange totalkostnad"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Moms (SEK)</label>
                <input
                  type="text"
                  className="form-control"
                  value={receipt.vat}
                  onChange={(e) => handleChange(index, 'vat', e.target.value)}
                  placeholder="Ange moms"
                  required
                />
              </div>
              {/* Removed file upload */}
            </div>
          </div>
        ))}
        <button type="button" className="btn btn-secondary mb-3" onClick={handleAddReceipt}>
          Lägg till Kvitto
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
