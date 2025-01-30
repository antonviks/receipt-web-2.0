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
        Dessa uppgifter är valfria. Fyll bara i om du vill ha pengarna direkt till ditt bankkonto.
      </p>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="bankName" className="form-label">
            Bankens namn (valfritt)
          </label>
          <input
            type="text"
            className="form-control"
            id="bankName"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            placeholder="Ange bankens namn"
          />
        </div>
        <div className="mb-3">
          <label htmlFor="clearingNumber" className="form-label">
            Clearing nummer (valfritt)
          </label>
          <input
            type="text"
            className="form-control"
            id="clearingNumber"
            value={clearingNumber}
            onChange={(e) => setClearingNumber(e.target.value)}
            placeholder="Ange clearing nummer"
          />
        </div>
        <div className="mb-3">
          <label htmlFor="accountNumber" className="form-label">
            Kontonummer (valfritt)
          </label>
          <input
            type="text"
            className="form-control"
            id="accountNumber"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            placeholder="Ange kontonummer"
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