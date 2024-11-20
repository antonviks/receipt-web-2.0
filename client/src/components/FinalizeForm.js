// client/src/components/FinalizeForm.js

import React, { useState } from 'react';

function FinalizeForm({ onFinalize, onBack, onReset }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showEmbeddedPDF, setShowEmbeddedPDF] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);

  // Handle Preview Button Click
  const handlePreview = async () => {
    try {
      setLoading(true);
      const blobUrl = await onFinalize('preview'); // Call parent handler with 'preview' action
      setLoading(false);

      if (!blobUrl) {
        throw new Error('Failed to generate PDF URL.');
      }

      // Use window.location.href to navigate to the PDF Blob URL
      window.location.href = blobUrl;

      // Optional: Uncomment the lines below to use embedded PDF instead
      /*
      setPdfBlobUrl(blobUrl);
      setShowEmbeddedPDF(true);
      */
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Ett fel uppstod vid förhandsgranskning av PDF. Försök igen.');
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
      alert('Ett fel uppstod vid generering av utläggsblankett. Försök igen.');
      setLoading(false);
    }
  };

  // Handle Closing the Embedded PDF
  const handleCloseEmbeddedPDF = () => {
    setShowEmbeddedPDF(false);
    setPdfBlobUrl(null);
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

          {/* Optionally, embed the PDF using an iframe */}
          {showEmbeddedPDF && pdfBlobUrl && (
            <div className="mb-4">
              <button className="btn btn-danger mb-2" onClick={handleCloseEmbeddedPDF}>
                Stäng förhandsgranskning
              </button>
              <iframe
                src={pdfBlobUrl}
                title="PDF Preview"
                width="100%"
                height="600px"
              />
            </div>
          )}

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
