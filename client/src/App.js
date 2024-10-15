// client/src/App.js

import React from 'react';
import './App.css'; // Ensure this import exists
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Confirmation from './components/Confirmation';
import MultiStepForm from './components/MultiStepForm';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<MultiStepForm />} />
          <Route path="/confirmation" element={<Confirmation />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
