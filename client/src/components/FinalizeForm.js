// client/src/components/FinalizeForm.js

import React, { useState } from 'react';
import { Modal, Button } from 'react-bootstrap'; 

function FinalizeForm({ onFinalize, onBack, onReset }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showModal, setShowModal] = useState(false); 
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null); 

  // Handle Preview Button Click
  const handlePreview = async () => {
    try {
      setLoading(true);
      const blobUrl = await onFinalize('preview'); 
      setLoading(false);

      if (!blobUrl) {
        throw new Error('Failed to generate PDF URL.');
      }

      // Revoke previous Blob URL if exists to prevent memory leaks
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }

      setPdfBlobUrl(blobUrl); // Set the Blob URL
      setShowModal(true); // Show the modal
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
      const message = await onFinalize('finalize'); 
      console.log('Email sent successfully.');
      setSuccess(true); 
      setLoading(false);
      // Clear all cookies after successful submission
      onReset();
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Ett fel uppstod vid generering av utläggsblankett. Försök igen.');
      setLoading(false);
    }
  };

  // Handle Closing the Modal
  const handleCloseModal = () => {
    setShowModal(false);
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
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

          {/* PDF Preview Modal */}
          <Modal 
            show={showModal} 
            onHide={handleCloseModal} 
            size="lg" 
            centered
            backdrop="static" // Prevent closing by clicking outside
            keyboard={false}   // Prevent closing with keyboard
          >
            <Modal.Header closeButton>
              <Modal.Title>Förhandsgranskning av PDF</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {pdfBlobUrl ? (
                <iframe
                  src={pdfBlobUrl}
                  title="PDF Preview"
                  width="100%"
                  height="600px"
                  style={{ border: 'none' }}
                />
              ) : (
                <div className="d-flex justify-content-center align-items-center" style={{ height: '600px' }}>
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Laddar...</span>
                  </div>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleCloseModal}>
                Stäng
              </Button>
              <Button variant="primary" onClick={() => window.open(pdfBlobUrl, '_blank')}>
                Öppna i ny flik
              </Button>
            </Modal.Footer>
          </Modal>
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
