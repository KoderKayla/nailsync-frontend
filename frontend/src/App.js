import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login.jsx'; 
import Dashboard from './pages/Dashboard.jsx'; 
import FormulaForm from './FormulaForm'; 

function App() {
  // Shared state to hold our logged-in user's token
  const [token, setToken] = useState(() => localStorage.getItem('nailsync_token') || null);

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Login sets the token state */}
          <Route path="/" element={<Login setToken={setToken} />} />
          <Route path="/dashboard" element={<Dashboard token={token} />} />
          
          {/* Formula form receives the token to authorize saves */}
          <Route path="/test-formula" element={<FormulaForm token={token} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;