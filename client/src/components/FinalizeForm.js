// client/src/components/FinalizeForm.js

import React, { useState } from 'react';

function FinalizeForm({ onFinalize, onBack, onReset }) {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Handle Preview Button Click
  const handlePreview = async () => {
    try {
      setLoading(true);
      const url = await onFinalize('preview'); // Call parent handler with 'preview' action
      setPdfUrl(url); // Set the PDF URL for the "Send Email" button
      window.open(url, '_blank'); // Open PDF in a new tab
      setLoading(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Ett fel uppstod vid förhandsgranskning av PDF.');
      setLoading(false);
    }
  };

  // Handle Confirm (Send Email) Button Click
  const handleConfirm = async () => {
    try {
      setLoading(true);
      const message = await onFinalize('finalize'); // Call parent handler with 'finalize' action
      console.log('Email sent successfully.');
      setSuccess(true); // Set success to true to display success message
      setLoading(false);
      // Clear all cookies after successful submission
      onReset();
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Ett fel uppstod vid generering av utläggsblankett.');
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5 text-center">
      <h2 className="mb-4">Bekräfta och Förhandsgranska</h2>

      {!success && <p>Kontrollera att all information är korrekt innan du skickar.</p>}

      {!success ? (
        <>
          {/* Buttons for Back and Preview */}
          <div className="d-flex justify-content-center mb-3">
            <button 
              className="btn btn-secondary me-3" 
              onClick={onBack} 
              disabled={loading}
            >
              Tillbaka
            </button>
            <button 
              className="btn btn-success" 
              onClick={handlePreview} 
              disabled={loading}
            >
              {loading ? 'Förhandsgranskar...' : 'Förhandsgranska PDF'}
            </button>
          </div>

          {/* Send Email Button - Always Visible After Preview */}
          {pdfUrl && (
            <div className="d-flex justify-content-center mb-4">
              <button 
                className="btn btn-primary" 
                onClick={handleConfirm} 
                disabled={loading}
              >
                {loading ? 'Skickar...' : 'Skicka via e-post till ekonomirådet'}
              </button>
            </div>
          )}
        </>
      ) : (
        // Success Message and Reset Button
        <div className="text-center">
          <h4 className="text-success mb-4">Utläggsblankett har skickats!</h4>
          <button 
            className="btn btn-primary"
            onClick={onReset}
          >
            Logga ut
          </button>
        </div>
      )}
    </div>
  );
}

export default FinalizeForm;
