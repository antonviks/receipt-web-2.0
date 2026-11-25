// client/src/components/PasswordPrompt.js

import React, { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '';

function PasswordPrompt({ onSuccess }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // The password is checked on the server, which sets a login cookie
      await axios.post(`${API_URL}/api/login`, { password }, { withCredentials: true });
      onSuccess();
    } catch (error) {
      const status = error?.response?.status;
      if (status === 401) {
        alert('Fel lösenord. Försök igen.');
      } else if (status === 429) {
        alert('För många inloggningsförsök. Vänta en stund och försök igen.');
      } else {
        alert('Kunde inte logga in just nu. Försök igen.');
      }
      setPassword('');
    } finally {
      setLoading(false);
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
            autoComplete="current-password"
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Loggar in...' : 'Logga in'}
        </button>
      </form>
    </div>
  );
}

export default PasswordPrompt;
