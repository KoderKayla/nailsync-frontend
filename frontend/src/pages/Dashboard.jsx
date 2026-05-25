import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FormulaForm from '../FormulaForm'; // Adjust path if needed depending on your folder layout
import ServiceManager from '../components/ServiceManager'; // ✅ FIXED: Pointing to the actual UI component, not PrivateRoute

// 🌐 Dynamic API root: Uses Render's environment variable when live, falls back to localhost for dev
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const Dashboard = ({ token: propToken }) => {
  // Pull token safely into state or local evaluation to prevent stale auth refs
  const token = propToken || localStorage.getItem('nailsync_token');
  
  // State for appointments and clients data streams
  const [appointments, setAppointments] = useState([]);
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientName, setSelectedClientName] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Added error handling state

  // Toggle state to switch view between the main Scheduling panel and Service Catalog Menu
  const [activeTab, setActiveTab] = useState('schedule');

  // 📱 Track screen width dynamically for clean mobile/tablet collapsing
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Structural breakpoints
  const isMobile = screenWidth <= 768;

  // Parallel fetch for both clients and appointments
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const headers = { Authorization: `Bearer ${token}` };
        
        // ✅ FIXED: Using dynamic API_BASE_URL templates instead of hardcoded localhost strings
        const [apptsResponse, clientsResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/appointments/`, { headers }),
          axios.get(`${API_BASE_URL}/api/clients/`, { headers })
        ]);

        setAppointments(apptsResponse.data);
        setClients(clientsResponse.data);
      } catch (err) {
        console.error('Error syncing dashboard streams:', err.message);
        setError('Failed to sync system records. Please check authorization.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchDashboardData();
    } else {
      setLoading(false);
      setError('No active authentication token found.');
    }
  }, [token]);

  // Filter clients dynamically as the tech types
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter the timeline if a specific client profile is selected
  const displayedAppointments = selectedClientName
    ? appointments.filter(appt => appt.client_name === selectedClientName)
    : appointments;

  return (
    <div style={styles.dashboardContainer}>
      {/* Top Navigation Bar */}
      <header style={{
        ...styles.header,
        padding: isMobile ? '15px 20px' : '15px 40px'
      }}>
        <h1 style={styles.brand}>NailSync Studio</h1>
        <div style={styles.badge}>⚡ Tech Portal Active</div>
      </header>

      {/* Main Workspace Layout */}
      <main style={{
        ...styles.workspace,
        padding: isMobile ? '15px 10px' : '40px 20px'
      }}>
        <div style={styles.welcomeBox}>
          <h2>👋 Welcome Back!</h2>
          <p>Search profiles on the left to filter appointment history, log a fresh set, or clear filters to view the full studio timeline.</p>
          
          {/* Navigation Tabs for View Switching */}
          <div style={styles.tabBar}>
            <button 
              onClick={() => setActiveTab('schedule')}
              style={{
                ...styles.tabButton,
                borderBottomColor: activeTab === 'schedule' ? '#0070f3' : 'transparent',
                color: activeTab === 'schedule' ? '#0070f3' : '#666',
                fontWeight: activeTab === 'schedule' ? '700' : '500'
              }}
            >
              🗓️ Studio Schedule
            </button>
            <button 
              onClick={() => setActiveTab('services')}
              style={{
                ...styles.tabButton,
                borderBottomColor: activeTab === 'services' ? '#0070f3' : 'transparent',
                color: activeTab === 'services' ? '#0070f3' : '#666',
                fontWeight: activeTab === 'services' ? '700' : '500'
              }}
            >
              💅 Service Menu Manager
            </button>
          </div>
        </div>

        {/* Global Error Notice if API Calls Drop */}
        {error && (
          <div style={{ ...styles.viewWrapperCard, borderColor: '#ef4444', color: '#b91c1c', marginBottom: '20px' }}>
            ⚠️ {error}
          </div>
        )}

        {/* CONDITIONALLY RENDER PANELS BASED ON TAB SELECTION */}
        {activeTab === 'services' ? (
          <div style={styles.viewWrapperCard}>
            <ServiceManager token={token} />
          </div>
        ) : (
          /* Unified Three-Column / Split Layout */
          <div style={{
            ...styles.splitGrid,
            flexDirection: isMobile ? 'column' : 'row'
          }}>
            
            {/* PANEL 1: CLIENT PROFILES LOOKUP */}
            <div style={{
              ...styles.sidebarCard,
              flex: isMobile ? '1 1 auto' : '1 1 250px',
              width: isMobile ? '100%' : 'auto',
              boxSizing: 'border-box'
            }}>
              <h3 style={styles.sectionHeader}>👤 Client Profiles</h3>
              <input 
                type="text"
                placeholder="🔍 Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
              <hr style={styles.divider} />
              
              <div style={{
                ...styles.clientListStream,
                maxHeight: isMobile ? '220px' : '500px'
              }}>
                {loading ? (
                  <p style={styles.subtext}>Loading profiles...</p>
                ) : filteredClients.length === 0 ? (
                  <p style={styles.subtext}>No profiles match.</p>
                ) : (
                  filteredClients.map(client => (
                    <div 
                      key={client.id}
                      onClick={() => setSelectedClientName(
                        selectedClientName === client.name ? null : client.name
                      )}
                      style={{
                        ...styles.clientCard,
                        backgroundColor: selectedClientName === client.name ? '#e0f2fe' : '#fdfdfd',
                        borderColor: selectedClientName === client.name ? '#0369a1' : '#f0f0f0'
                      }}
                    >
                      <strong style={styles.clientCardName}>{client.name}</strong>
                      <div style={styles.clientCardPhone}>{client.phone_number || 'No phone recorded'}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* PANEL 2: FORM SUBMISSION */}
            <div style={{
              ...styles.formCard,
              flex: isMobile ? '1 1 auto' : '2 1 400px',
              width: isMobile ? '100%' : 'auto',
              boxSizing: 'border-box'
            }}>
              <FormulaForm token={token} />
            </div>

            {/* PANEL 3: TIMELINE SCHEDULER */}
            <div style={{
              ...styles.timelineCardColumn,
              flex: isMobile ? '1 1 auto' : '1.5 1 350px',
              width: isMobile ? '100%' : 'auto',
              boxSizing: 'border-box'
            }}>
              <div style={styles.timelineHeaderBlock}>
                <h3 style={styles.sectionHeader}>
                  {selectedClientName ? `🗓️ ${selectedClientName}'s History` : '🗓️ Global Timeline'}
                </h3>
                {selectedClientName && (
                  <button 
                    onClick={() => setSelectedClientName(null)} 
                    style={styles.clearFilterBtn}
                  >
                    Clear Filter
                  </button>
                )}
              </div>
              <hr style={styles.divider} />

              {loading ? (
                <p style={styles.subtext}>Syncing history records...</p>
              ) : displayedAppointments.length === 0 ? (
                <p style={styles.subtext}>No historic formulas logged for this scope.</p>
              ) : (
                <div style={styles.timelineStream}>
                  {displayedAppointments.map((appt) => (
                    <div key={appt.id || appt.appointment_time} style={styles.timelineCard}>
                      <div style={styles.cardHeader}>
                        <span style={styles.clientName}>👤 {appt.client_name}</span>
                        <span style={styles.dateBadge}>
                          {appt.appointment_time 
                            ? new Date(appt.appointment_time).toLocaleDateString([], {month: 'short', day: 'numeric'})
                            : 'No Date'}
                        </span>
                      </div>
                      <div style={styles.styleLine}>✨ {appt.style}</div>
                      
                      {appt.formula_recipe && (
                        <div style={styles.formulaStack}>
                          <div><small><strong>Base:</strong> {appt.formula_recipe.base || 'N/A'}</small></div>
                          <div><small><strong>Layers:</strong> {appt.formula_recipe.layers?.join(' ➡️ ') || 'None'}</small></div>
                          <div><small><strong>Top:</strong> {appt.formula_recipe.top || 'N/A'}</small></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </main>
    </div>
  );
};

const styles = {
  dashboardContainer: { minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'system-ui, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 40px', backgroundColor: '#fff', borderBottom: '1px solid #eaeaea' },
  brand: { margin: 0, fontSize: '20px', fontWeight: '700', color: '#111' },
  badge: { padding: '5px 12px', backgroundColor: '#e0f2fe', color: '#0369a1', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  workspace: { maxWidth: '1400px', margin: '0 auto', padding: '40px 20px' },
  welcomeBox: { padding: '20px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: '30px', border: '1px solid #eaeaea' },
  
  tabBar: { display: 'flex', gap: '20px', marginTop: '16px', borderBottom: '1px solid #eaeaea' },
  tabButton: { background: 'none', border: 'none', borderBottom: '3px solid transparent', padding: '8px 4px', cursor: 'pointer', fontSize: '15px', transition: 'all 0.2s ease' },
  viewWrapperCard: { backgroundColor: '#fff', padding: '25px', borderRadius: '12px', border: '1px solid #eaeaea', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' },

  splitGrid: { display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' },
  sidebarCard: { flex: '1 1 250px', backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #eaeaea', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' },
  formCard: { flex: '2 1 400px', backgroundColor: '#fff', padding: '25px', borderRadius: '12px', border: '1px solid #eaeaea', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' },
  timelineCardColumn: { flex: '1.5 1 350px', backgroundColor: '#fff', padding: '25px', borderRadius: '12px', border: '1px solid #eaeaea', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' },
  
  sectionHeader: { margin: 0, fontSize: '17px', fontWeight: '700', color: '#111' },
  searchInput: { width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', marginTop: '10px', boxSizing: 'border-box', fontSize: '14px' },
  divider: { border: '0', height: '1px', background: '#eaeaea', margin: '15px 0' },
  subtext: { fontSize: '13px', color: '#666', textAlign: 'center', marginTop: '15px' },
  
  clientListStream: { display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '500px', overflowY: 'auto' },
  clientCard: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #f0f0f0', cursor: 'pointer', transition: 'all 0.15s ease' },
  clientCardName: { fontSize: '14px', color: '#111' },
  clientCardPhone: { fontSize: '12px', color: '#777', marginTop: '2px' },
  
  timelineHeaderBlock: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  clearFilterBtn: { padding: '4px 8px', fontSize: '12px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  
  timelineStream: { display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '500px', overflowY: 'auto' },
  timelineCard: { padding: '15px', backgroundColor: '#fdfdfd', border: '1px solid #f0f0f0', borderRadius: '8px' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '6px' },
  clientName: { fontSize: '14px', fontWeight: '700', color: '#111' },
  dateBadge: { fontSize: '12px', color: '#888' },
  styleLine: { fontSize: '13px', fontWeight: '500', color: '#444', marginBottom: '10px' },
  formulaStack: { backgroundColor: '#f9fafb', padding: '10px', borderRadius: '6px', border: '1px solid #eaeaea', display: 'flex', flexDirection: 'column', gap: '4px', color: '#555' }
};

export default Dashboard;