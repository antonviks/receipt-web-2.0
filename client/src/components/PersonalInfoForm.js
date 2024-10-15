// client/src/components/PersonalInfoForm.js

import React, { useState, useEffect } from 'react';
import { useCookies } from 'react-cookie';

function PersonalInfoForm({ onNext, onBack }) {
  const [cookies, setCookie] = useCookies(['personalInfo']);
  const [date, setDate] = useState(cookies.personalInfo?.date || '');
  const [name, setName] = useState(cookies.personalInfo?.name || '');

  useEffect(() => {
    // Update state if cookies change
    if (cookies.personalInfo) {
      setDate(cookies.personalInfo.date);
      setName(cookies.personalInfo.name);
    }
  }, [cookies.personalInfo]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!date || !name) {
      alert('Vänligen fyll i alla fält.');
      return;
    }

    // Save data to cookies
    setCookie('personalInfo', { date, name }, { path: '/' });

    // Pass data to parent
    onNext({ date, name });
  };

  return (
    <div className="custom-container mt-5">
      <h2 className="text-center mb-4">Personlig Information</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="date" className="form-label">
            Datum
          </label>
          <input
            type="date"
            className="form-control"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
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
