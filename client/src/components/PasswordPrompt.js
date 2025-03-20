// client/src/components/PasswordPrompt.js

import React, { useState } from 'react';

function PasswordPrompt({ onSuccess }) {
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === 'kors') {
      onSuccess();
    } else {
      alert('Fel lösenord. Försök igen.');
      setPassword('');
    }
  };

  return (
    <div className="custom-container mt-5">
      <h2 className="text-center mb-4">Inloggning</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="password" className="form-label">
            Ange lösenord
          </label>
          <input
            type="password"
            className="form-control"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Lösenord"
            required
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Logga in
        </button>
      </form>
    </div>
  );
}

export default PasswordPrompt;
