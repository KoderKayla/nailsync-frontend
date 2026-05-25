import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = ({ setToken }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    // 1. Strictly stop the browser from reloading the page
    e.preventDefault(); 
    setLoading(true);
    setError('');

    try {
      // 2. Make the explicit POST call to get our JWT tokens
      const response = await axios.post('http://localhost:8000/api/token/', {
        username: username,
        password: password,
      });

      console.log('Login Response Data:', response.data);
      const accessToken = response.data.access;
      
      // Save token globally in app state
      setToken(accessToken);
      
      // 🔑 NEW: Persist the token to browser storage instantly to eliminate async route delay
      localStorage.setItem('nailsync_token', accessToken);
      
      // Send tech directly to their dashboard workspace
      navigate('/dashboard');
    } catch (err) {
      console.error('Full Login Error object:', err);
      if (err.response) {
        // The server responded with a specific status code error (e.g. 401 Unauthorized)
        setError(`❌ ${err.response.data.detail || 'Invalid username or password.'}`);
      } else if (err.request) {
        // The request was made but no response was received
        setError('❌ No response from backend. Is Django still running?');
      } else {
        setError('❌ Request error. Please check your console.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>💅 NailSync Provider Portal</h2>
      <p style={styles.subtitle}>Log in to access client formulas</p>

      {error && <div style={styles.error}>{error}</div>}

      <form onSubmit={handleLogin}>
        <div style={styles.group}>
          <label style={styles.label}>Username / Email</label>
          <input 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            style={styles.input} 
            required 
          />
        </div>
        <div style={styles.group}>
          <label style={styles.label}>Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            style={styles.input} 
            required 
          />
        </div>
        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? 'Authenticating...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
};

const styles = {
  container: { maxWidth: '380px', margin: '100px auto', padding: '30px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontFamily: 'system-ui, sans-serif' },
  title: { margin: '0 0 6px 0', fontSize: '22px', textAlign: 'center', color: '#111' },
  subtitle: { margin: '0 0 25px 0', fontSize: '13px', textAlign: 'center', color: '#666' },
  group: { marginBottom: '20px' },
  label: { display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#444' },
  input: { width: '100%', padding: '11px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '6px', fontSize: '14px' },
  button: { width: '100%', padding: '12px', backgroundColor: '#111', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  error: { padding: '12px', backgroundColor: '#fef2f2', color: '#991b1b', borderRadius: '6px', fontSize: '13px', marginBottom: '15px', border: '1px solid #fee2e2', textAlign: 'center', fontWeight: '500' }
};

export default Login;