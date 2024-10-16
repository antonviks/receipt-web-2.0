// client/src/components/Confirmation.js

import React from 'react';

function Confirmation({ onReset }) {
  return (
    <div className="container mt-5 text-center">
      <h2 className="mb-4">Klart!</h2>
      <p>Dina kvitton har skickats in framgångsrikt.</p>
      <button className="btn btn-primary" onClick={onReset}>
        Gå tillbaka till början
      </button>
    </div>
  );
}

export default Confirmation;