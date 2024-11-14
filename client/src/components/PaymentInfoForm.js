// client/src/components/PaymentInfoForm.js

import React, { useState, useEffect } from 'react';
import { useCookies } from 'react-cookie';

function PaymentInfoForm({ onNext, onBack }) {
  const [cookies, setCookie] = useCookies(['paymentInfo']);
  const [paymentMethod, setPaymentMethod] = useState(cookies.paymentInfo?.paymentMethod || 'Bank'); // Default to Bank
  const [bankName, setBankName] = useState(cookies.paymentInfo?.bankName || '');
  const [clearingNumber, setClearingNumber] = useState(cookies.paymentInfo?.clearingNumber || '');
  const [accountNumber, setAccountNumber] = useState(cookies.paymentInfo?.accountNumber || '');
  const [email, setEmail] = useState(cookies.paymentInfo?.email || ''); // New state for optional email

  useEffect(() => {
    // Load payment info from cookies if available
    if (cookies.paymentInfo) {
      setPaymentMethod(cookies.paymentInfo.paymentMethod);
      setBankName(cookies.paymentInfo.bankName);
      setClearingNumber(cookies.paymentInfo.clearingNumber);
      setAccountNumber(cookies.paymentInfo.accountNumber);
      setEmail(cookies.paymentInfo.email || '');
    }
  }, [cookies.paymentInfo]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (paymentMethod === 'Bank') {
      if (!bankName || !clearingNumber || !accountNumber) {
        alert('Vänligen fyll i alla bankuppgifter.');
        return;
      }

      setCookie('paymentInfo', { paymentMethod, bankName, clearingNumber, accountNumber, email }, { path: '/' });
      onNext({ paymentMethod, bankName, clearingNumber, accountNumber, email }); // Pass email to onNext
    }
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

        {paymentMethod === 'Bank' && (
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
            {/* Optional Email Address Field */}
            <div className="mb-3">
              <label htmlFor="email" className="form-label">
                E-postadress (Valfritt)
              </label>
              <input
                type="email"
                className="form-control"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ange din e-postadress om du vill få en kopia via e-post"
              />
            </div>
          </div>
        )}

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
