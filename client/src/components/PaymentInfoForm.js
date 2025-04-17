// client/src/components/PaymentInfoForm.js

import React, { useState, useEffect } from 'react';
import { useCookies } from 'react-cookie';

function PaymentInfoForm({ onNext, onBack }) {
  const [cookies, setCookie] = useCookies(['paymentInfo']);
  const [bankName, setBankName] = useState(cookies.paymentInfo?.bankName || '');
  const [clearingNumber, setClearingNumber] = useState(cookies.paymentInfo?.clearingNumber || '');
  const [accountNumber, setAccountNumber] = useState(cookies.paymentInfo?.accountNumber || '');

  useEffect(() => {
    if (cookies.paymentInfo) {
      setBankName(cookies.paymentInfo.bankName);
      setClearingNumber(cookies.paymentInfo.clearingNumber);
      setAccountNumber(cookies.paymentInfo.accountNumber);
    }
  }, [cookies.paymentInfo]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // No validation necessary since they are optional
    setCookie('paymentInfo', { 
      bankName, 
      clearingNumber, 
      accountNumber,
    }, { path: '/' });

    onNext({ bankName, clearingNumber, accountNumber });
  };

  return (
    <div className="custom-container mt-5">
      <h2 className="text-center mb-4">Betalningsinformation</h2>
      <p className="mb-4">
      Fyll i bankuppgifter om det är första gången du lämnar in ett utlägg eller om du vill uppdatera din betalningsinformation.</p>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="bankName" className="form-label">
            Bankens namn
          </label>
          <input
            type="text"
            className="form-control"
            id="bankName"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label htmlFor="clearingNumber" className="form-label">
            Clearing nummer
          </label>
          <input
            type="text"
            className="form-control"
            id="clearingNumber"
            value={clearingNumber}
            onChange={(e) => setClearingNumber(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label htmlFor="accountNumber" className="form-label">
            Kontonummer
          </label>
          <input
            type="text"
            className="form-control"
            id="accountNumber"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
          />
        </div>

        <hr />
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

export default PaymentInfoForm;