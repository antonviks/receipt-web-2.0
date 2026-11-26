// client/src/components/FinalizeForm.js

import React, { useState } from 'react';

function FinalizeForm({ onFinalize, onBack, onReset }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Handle Preview Button Click
  const handlePreview = async () => {
    // Open the tab right away, inside the click. Phones block tabs opened
    // after waiting for the server.
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      try {
        previewWindow.document.write(
          '<p style="font-family:sans-serif;padding:1rem">Skapar förhandsgranskning…</p>'
        );
      } catch {
        // not important
      }
    }

    setLoading(true);
    try {
      const pdfUrl = await onFinalize('preview');
      if (previewWindow) {
        previewWindow.location.href = pdfUrl;
      } else {
        // Popup blocked: download the preview instead
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = 'forhandsgranskning.pdf';
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 60 * 1000);
    } catch (error) {
      console.error('Error generating PDF:', error);
      if (previewWindow) previewWindow.close();
      if (!error.handled) alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onFinalize('finalize');
      setSuccess(true);
    } catch (error) {
      console.error('Error sending email:', error);
      if (!error.handled) alert(error.message);
    } finally {
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

          {/* Send Email Button */}
          <div className="d-flex justify-content-center mb-4">
            <button 
              className="btn btn-primary" 
              onClick={handleConfirm} 
              disabled={loading}
            >
              {loading ? 'Skickar...' : 'Skicka via e-post till ekonomirådet'}
            </button>
          </div>
        </>
      ) : (
        // Success Message and Reset Button
        <div className="text-center">
          <h4 className="text-success mb-4">Utläggsblankett har skickats!</h4>
          <p>Tack för din redovisning!</p>
          <button
            className="btn btn-primary"
            onClick={() => {
              onReset();
            }}
          >
            Gå tillbaka till början
          </button>
        </div>
      )}
    </div>
  );
}

export default FinalizeForm;
