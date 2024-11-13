// client/src/components/PaymentInfoForm.js

import React, { useState, useEffect } from 'react';
import { useCookies } from 'react-cookie';

function PaymentInfoForm({ onNext, onBack }) {
  const [cookies, setCookie] = useCookies(['paymentInfo']);
  const [paymentMethod, setPaymentMethod] = useState('Bank');
  const [bankName, setBankName] = useState('');
  const [clearingNumber, setClearingNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  useEffect(() => {
    // Load payment info from cookies if available
    if (cookies.paymentInfo) {
      setPaymentMethod(cookies.paymentInfo.paymentMethod);
      setBankName(cookies.paymentInfo.bankName);
      setClearingNumber(cookies.paymentInfo.clearingNumber);
      setAccountNumber(cookies.paymentInfo.accountNumber);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation for Bank payment method
    if (!bankName || !clearingNumber || !accountNumber) {
      alert('Vänligen fyll i alla bankuppgifter.');
      return;
    }

    // Save data to cookies
    setCookie('paymentInfo', { paymentMethod, bankName, clearingNumber, accountNumber }, { path: '/' });
    onNext({ paymentMethod, bankName, clearingNumber, accountNumber });
  };

  return (
    <div className="custom-container mt-5">
      <h2 className="text-center mb-4">Betalningsinformation</h2>
      <p className="mb-4">
        Vänligen ange din bankinformation.
      </p>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label me-3">Välj betalningsmetod:</label>
          <div className="form-check form-check-inline">
            <input
              type="radio"
              id="bankOption"
              name="paymentMethod"
              value="Bank"
              className="form-check-input"
              checked={paymentMethod === 'Bank'}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            <label htmlFor="bankOption" className="form-check-label">
              Bank
            </label>
          </div>
        </div>

        {/* Bank Details Fields */}
        <div>
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
              placeholder="Ange bankens namn"
              required
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
              placeholder="Ange clearing nummer"
              required
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
              placeholder="Ange kontonummer"
              required
            />
          </div>
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
