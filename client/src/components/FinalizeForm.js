// client/src/components/FinalizeForm.js

import React, { useState } from 'react';
import { useCookies } from 'react-cookie';
import axios from 'axios';

function FinalizeForm({ onFinalize, onBack, onReset, additionalFiles }) {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [, , removeCookie] = useCookies(['personalInfo', 'receipts', 'additionalFiles', 'paymentInfo']);

  // Handle Preview Button Click
  const handlePreview = async () => {
    try {
      setLoading(true);
      const formData = new FormData();
      
      // Append personalInfo, paymentInfo, receipts as JSON strings
      formData.append('personalInfo', JSON.stringify(onFinalize.personalInfo));
      formData.append('paymentInfo', JSON.stringify(onFinalize.paymentInfo));
      formData.append('receipts', JSON.stringify(onFinalize.receipts));
      
      // Append additional files
      additionalFiles.forEach((file) => {
        formData.append('files', file);
      });
      
      // Append action
      formData.append('action', 'preview');

      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/receipts/process`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        responseType: 'blob', // Important for handling PDF
        withCredentials: true, // If using cookies
      });

      // Create a URL for the PDF Blob
      const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
      const pdfUrl = URL.createObjectURL(pdfBlob);
      setPdfUrl(pdfUrl);
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
      const formData = new FormData();
      
      // Append personalInfo, paymentInfo, receipts as JSON strings
      formData.append('personalInfo', JSON.stringify(onFinalize.personalInfo));
      formData.append('paymentInfo', JSON.stringify(onFinalize.paymentInfo));
      formData.append('receipts', JSON.stringify(onFinalize.receipts));
      
      // Append additional files
      additionalFiles.forEach((file) => {
        formData.append('files', file);
      });
      
      // Append action
      formData.append('action', 'finalize');

      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/receipts/process`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
      });

      console.log('Email sent successfully:', response.data);
      setSuccess(true);
      setLoading(false);
      
      // Clear all cookies after successful submission
      removeCookie('personalInfo', { path: '/' });
      removeCookie('receipts', { path: '/' });
      removeCookie('additionalFiles', { path: '/' });
      removeCookie('paymentInfo', { path: '/' });
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

          {/* PDF Preview */}
          {pdfUrl && (
            <div className="mb-4">
              <iframe
                src={pdfUrl}
                title="PDF Preview"
                width="100%"
                height="600px"
              ></iframe>
            </div>
          )}

          {/* Confirm Button (only after preview) */}
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
