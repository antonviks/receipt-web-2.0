// client/src/index.js

import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import App from './App';
import { CookiesProvider } from 'react-cookie';  // Import CookiesProvider

// Create the root and render the App wrapped in CookiesProvider
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <CookiesProvider> {/* Wrap your app with CookiesProvider */}
      <App />
    </CookiesProvider>
  </React.StrictMode>
);
