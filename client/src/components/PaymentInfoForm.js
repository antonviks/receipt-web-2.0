// client/src/components/PaymentInfoForm.js

import React, { useState, useEffect } from 'react';
import { useCookies } from 'react-cookie';

function PaymentInfoForm({ onNext, onBack }) {
  const [cookies, setCookie] = useCookies(['paymentInfo']);
  const [paymentMethod, setPaymentMethod] = useState(cookies.paymentInfo?.paymentMethod || 'Bank'); // Default to Bank
  const [bankName, setBankName] = useState(cookies.paymentInfo?.bankName || '');
  const [clearingNumber, setClearingNumber] = useState(cookies.paymentInfo?.clearingNumber || '');
  const [accountNumber, setAccountNumber] = useState(cookies.paymentInfo?.accountNumber || '');
  const [otherMethod, setOtherMethod] = useState(cookies.paymentInfo?.otherMethod || '');

  useEffect(() => {
    // Load payment info from cookies if available
    if (cookies.paymentInfo) {
      setPaymentMethod(cookies.paymentInfo.paymentMethod);
      setBankName(cookies.paymentInfo.bankName);
      setClearingNumber(cookies.paymentInfo.clearingNumber);
      setAccountNumber(cookies.paymentInfo.accountNumber);
      setOtherMethod(cookies.paymentInfo.otherMethod);
    }
  }, [cookies.paymentInfo]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    if (paymentMethod === 'Bank') {
      if (!bankName || !clearingNumber || !accountNumber) {
        alert('Vänligen fyll i alla bankuppgifter.');
        return;
      }
      // Save data to cookies
      setCookie('paymentInfo', { paymentMethod, bankName, clearingNumber, accountNumber, otherMethod: '' }, { path: '/' });
      onNext({ paymentMethod, bankName, clearingNumber, accountNumber, otherMethod: '' });
    } else if (paymentMethod === 'Annat') {
      if (!otherMethod) {
        alert('Vänligen ange hur du vill bli betald.');
        return;
      }
      // Save data to cookies
      setCookie('paymentInfo', { paymentMethod, bankName: '', clearingNumber: '', accountNumber: '', otherMethod }, { path: '/' });
      onNext({ paymentMethod, bankName: '', clearingNumber: '', accountNumber: '', otherMethod });
    }
  };

  return (
    <div className="custom-container mt-5">
      <h2 className="text-center mb-4">Betalningsinformation</h2>
      <p className="mb-4">
        Här kan du välja hur du vill bli betald. Välj antingen att bli betald till ditt bankkonto eller ett annat sätt.
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
          <div className="form-check form-check-inline">
            <input
              type="radio"
              id="otherOption"
              name="paymentMethod"
              value="Annat"
              className="form-check-input"
              checked={paymentMethod === 'Annat'}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            <label htmlFor="otherOption" className="form-check-label">
              Annat sätt
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
          </div>
        )}

        {paymentMethod === 'Annat' && (
          <div className="mb-3">
            <label htmlFor="otherMethod" className="form-label">
              Annat sätt
            </label>
            <input
              type="text"
              className="form-control"
              id="otherMethod"
              value={otherMethod}
              onChange={(e) => setOtherMethod(e.target.value)}
              placeholder="Ange annat sätt"
              required
            />
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
