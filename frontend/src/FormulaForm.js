import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Dynamic API URL definition: Checks Render configuration first, falls back to localhost for local dev
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const FormulaForm = ({ token: propToken }) => {
  // 🔑 Force active token tracking directly into local state
  const [authToken, setAuthToken] = useState(() => {
    return propToken || localStorage.getItem('nailsync_token') || null;
  });

  // Client Identity Fields for Lookup/Repairs
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  // Formula & Service Fields
  const [style, setStyle] = useState('');
  const [materials, setMaterials] = useState('');
  const [baseCoat, setBaseCoat] = useState('');
  const [colorLayers, setColorLayers] = useState(['']); 
  const [topCoat, setTopCoat] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // Keep state perfectly aligned if the parent prop updates later
  useEffect(() => {
    const currentToken = propToken || localStorage.getItem('nailsync_token');
    if (currentToken) {
      setAuthToken(currentToken);
    }
  }, [propToken]);

  const handleAddLayer = () => setColorLayers([...colorLayers, '']);
  const handleLayerChange = (index, value) => {
    const updatedLayers = [...colorLayers];
    updatedLayers[index] = value;
    setColorLayers(updatedLayers);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsError(false);

    if (!authToken) {
      setMessage('❌ System Error: Authorization key missing from application context.');
      setIsError(true);
      setLoading(false);
      return;
    }

    // ⏰ Auto-generate a current timestamp for the backend's appointment_time requirement
    const currentTimestamp = new Date().toISOString();

    // Clean up materials input into a strict array format for Django's JSONField
    const materialsArray = materials 
      ? materials.split(',').map(item => item.trim()).filter(item => item !== '') 
      : [];

    const payload = {
      client_name: clientName, 
      client_phone: clientPhone, 
      appointment_time: currentTimestamp, // ✅ Satisfies the backend creation hook
      style: style,
      materials: materialsArray,           // ✅ Clean array syntax
      formula_recipe: {
        base: baseCoat,
        layers: colorLayers.filter(layer => layer.trim() !== ''),
        top: topCoat
      }
    };

    try {
      console.log('Sending secure payload to server...');
      // 🔑 Updated to leverage dynamic routing environment variable
      const response = await axios.post(`${API_URL}/api/appointments/`, payload, {
        headers: { 
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Server Success Response:', response.data);
      setMessage('✅ Formula logged successfully to client profile!');
      setIsError(false);
      
      // Clean slate on success
      setClientName('');
      setClientPhone('');
      setStyle('');
      setBaseCoat('');
      setColorLayers(['']);
      setTopCoat('');
      setMaterials('');
    } catch (err) {
      const serverDetails = err.response?.data;
      console.error('❌ Complete Backend Error Context:', serverDetails || err.message);
      setIsError(true);
      
      if (err.response?.status === 401) {
        setMessage('❌ Permission Denied (401): Your user token is invalid or expired. Try logging back in.');
      } else {
        // Human-readable fallback parser if validation items error out
        const errorString = serverDetails && typeof serverDetails === 'object'
          ? Object.entries(serverDetails).map(([key, val]) => `${key}: ${val}`).join(', ')
          : err.message;
        setMessage(`❌ Failed to save formula: ${errorString}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* 🛑 THE ULTIMALTE GUARD: Warns immediately if local storage keys are missing */}
      {!authToken && (
        <div style={{...styles.alert, backgroundColor: '#fffbeb', color: '#b45309', borderColor: '#fde68a'}}>
          ⚠️ WARNING: Session token not inherited by workspace view. Submissions will fail.
        </div>
      )}

      <h2 style={styles.heading}>💅 Log Set & Client Formula</h2>
      <p style={styles.subheading}>Tie formula stacks to clients for quick future repair lookup</p>
      
      {message && (
        <div style={{
          ...styles.alert, 
          backgroundColor: isError ? '#fef2f2' : '#f0fdf4', 
          color: isError ? '#991b1b' : '#166534',
          borderColor: isError ? '#fee2e2' : '#bbf7d0'
        }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.sectionHeader}>👤 Client Information</div>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>Client Name</label>
            <input 
              type="text" 
              placeholder="e.g., Jane Doe" 
              value={clientName} 
              onChange={(e) => setClientName(e.target.value)}
              style={styles.input}
              required
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>Phone Number</label>
            <input 
              type="tel" 
              placeholder="e.g., 555-123-4567" 
              value={clientPhone} 
              onChange={(e) => setClientPhone(e.target.value)}
              style={styles.input}
              required
            />
          </div>
        </div>

        <hr style={styles.divider} />

        <div style={styles.sectionHeader}>✨ Set Styling & Formula</div>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>Set Style Description</label>
          <input 
            type="text" 
            placeholder="e.g., Almond French Tip w/ Pearl Chrome" 
            value={style} 
            onChange={(e) => setStyle(e.target.value)}
            style={styles.input}
            required
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>1. Base Layer / Structure Gel</label>
          <input type="text" placeholder="e.g., BIAB / Après Gel-X" value={baseCoat} onChange={(e) => setBaseCoat(e.target.value)} style={styles.input} />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>2. Polish Layers</label>
          {colorLayers.map((layer, index) => (
            <input key={index} type="text" placeholder={`Layer ${index + 1}`} value={layer} onChange={(e) => handleLayerChange(index, e.target.value)} style={{...styles.input, marginBottom: '8px'}} />
          ))}
          <button type="button" onClick={handleAddLayer} style={styles.addButton}>+ Add Another Color Layer</button>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>3. Top Finish</label>
          <input type="text" placeholder="e.g., Glossy / Matte Top" value={topCoat} onChange={(e) => setTopCoat(e.target.value)} style={styles.input} />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Accessories / Materials (Comma separated)</label>
          <input type="text" placeholder="e.g., Swarovski crystals, chrome powder" value={materials} onChange={(e) => setMaterials(e.target.value)} style={styles.input} />
        </div>

        <button type="submit" disabled={loading || !authToken} style={{...styles.submitButton, opacity: (!authToken || loading) ? 0.6 : 1}}>
          {loading ? 'Saving to History...' : 'Save & Link to Client Profiler'}
        </button>
      </form>
    </div>
  );
};

const styles = {
  container: { maxWidth: '500px', margin: '30px auto', padding: '25px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', fontFamily: 'system-ui, sans-serif' },
  heading: { margin: '0 0 5px 0', fontSize: '22px', color: '#111', fontWeight: '700' },
  subheading: { margin: '0 0 20px 0', fontSize: '13px', color: '#666' },
  sectionHeader: { fontSize: '14px', fontWeight: '700', color: '#111', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' },
  divider: { border: '0', height: '1px', background: '#eaeaea', margin: '20px 0' },
  formGroup: { marginBottom: '18px' },
  label: { display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#555' },
  input: { width: '100%', padding: '10px 12px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '6px', fontSize: '14px' },
  addButton: { background: 'none', border: 'none', color: '#0070f3', fontSize: '13px', fontWeight: '500', cursor: 'pointer', padding: 0 },
  submitButton: { width: '100%', padding: '12px', backgroundColor: '#111', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginTop: '10px' },
  alert: { padding: '12px', borderRadius: '6px', fontSize: '14px', marginBottom: '15px', border: '1px solid #bbf7d0', textAlign: 'center' }
};

export default FormulaForm;