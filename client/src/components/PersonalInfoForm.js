// client/src/components/PersonalInfoForm.js

import React, { useState, useEffect } from 'react';
import { useCookies } from 'react-cookie';

function PersonalInfoForm({ onNext, onBack }) {
  const [cookies, setCookie] = useCookies(['personalInfo']);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // If you still want to restore name/email from cookies:
  useEffect(() => {
    if (cookies.personalInfo) {
      setName(cookies.personalInfo.name || '');
      setEmail(cookies.personalInfo.email || '');
    }
  }, [cookies.personalInfo]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name) {
      alert('Vänligen fyll i namn.');
      return;
    }

    // Only store name and email in cookies
    setCookie('personalInfo', { name, email }, { path: '/' });

    // Always pass "today" to the next step
    const todayString = new Date().toISOString().split('T')[0];
    onNext({ date: todayString, name, email });
  };

  return (
    <div className="custom-container mt-5">
      <h2 className="text-center mb-4">Personlig Information</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="name" className="form-label">
            Namn
          </label>
          <input
            type="text"
            className="form-control"
            id="name"
            placeholder="Ange ditt namn"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        {/* Moved Email from PaymentInfoForm */}
        <div className="mb-3">
          <label htmlFor="email" className="form-label">
            E-postadress (Om du vill få en kopia)
          </label>
          <input
            type="email"
            className="form-control"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Ange din e-post (valfritt)"
          />
        </div>

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

export default PersonalInfoForm;
