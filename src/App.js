import React, { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Upload, User, Activity, Heart, Droplet, Wind, TrendingUp, LogOut, Plus, FileText, BarChart3, Brain, Users } from 'lucide-react';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [persons, setPersons] = useState([]);
  const [selectedPersonId, setSelectedPersonId] = useState(null);
  const [analysis, setAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loginError, setLoginError] = useState('');
  const [dataType, setDataType] = useState('all'); // 'all', 'hr', 'bp', 'spo2'

  // Get selected person object
  const selectedPerson = persons.find(p => p.id === selectedPersonId);

  // Login Handler
  const handleLogin = (e) => {
    e.preventDefault();
    console.log('Login attempted with:', username, password);
    
    if (username === 'admin' && password === 'admin123') {
      console.log('Login successful');
      setIsLoggedIn(true);
      setLoginError('');
    } else {
      console.log('Login failed');
      setLoginError('Invalid credentials. Use admin/admin123');
    }
  };

  // Add New Person
  const handleAddPerson = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newPerson = {
      id: Date.now(),
      name: formData.get('name'),
      age: formData.get('age'),
      gender: formData.get('gender'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      medicalId: formData.get('medicalId'),
      createdAt: new Date().toISOString(),
      healthData: [] // Store health data for this person
    };
    setPersons([...persons, newPerson]);
    e.target.reset();
    setActiveView('dashboard');
  };

  // File Upload Handler - Links data to selected person with merge capability
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!selectedPersonId) {
      alert('Please select a person first before uploading data!');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      
      // Parse CSV
      if (file.name.endsWith('.csv')) {
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        const newData = lines.slice(1).filter(line => line.trim()).map((line, index) => {
          const values = line.split(',').map(v => v.trim());
          const row = { 
            id: `${Date.now()}-${index}`,
            uploadDate: new Date().toISOString(),
            timestamp: values[0] || new Date().toISOString()
          };
          
          headers.forEach((header, i) => {
            if (i > 0 || header.toLowerCase() !== 'timestamp') {
              row[header] = isNaN(values[i]) ? values[i] : parseFloat(values[i]);
            }
          });
          
          return row;
        });

        // Merge with existing data by timestamp
        setPersons(persons.map(person => {
          if (person.id !== selectedPersonId) return person;
          
          const mergedData = [...person.healthData];
          
          newData.forEach(newRecord => {
            const existingIndex = mergedData.findIndex(
              existing => existing.timestamp === newRecord.timestamp
            );
            
            if (existingIndex >= 0) {
              // Merge with existing record
              mergedData[existingIndex] = {
                ...mergedData[existingIndex],
                ...newRecord
              };
            } else {
              // Add as new record
              mergedData.push(newRecord);
            }
          });

          // Sort by timestamp
          mergedData.sort((a, b) => {
            const dateA = new Date(a.timestamp);
            const dateB = new Date(b.timestamp);
            return dateA - dateB;
          });

          return { ...person, healthData: mergedData };
        }));

        const dataTypeLabel = dataType === 'all' ? 'health' : 
                             dataType === 'hr' ? 'heart rate' :
                             dataType === 'bp' ? 'blood pressure' : 'SPO2';
        
        alert(`✅ Successfully uploaded ${newData.length} ${dataTypeLabel} records for ${selectedPerson.name}!\n\nData has been merged with existing records.`);
        
        // Reset file input
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  // AI Analysis - Analyzes selected person's data
  const analyzeData = async () => {
    if (!selectedPerson || selectedPerson.healthData.length === 0) {
      alert('Please select a person with uploaded health data first!');
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `Analyze this health data for patient ${selectedPerson.name}, age ${selectedPerson.age}, ${selectedPerson.gender}. Provide insights on trends, anomalies, and recommendations. Focus on HR (heart rate), BP (blood pressure), and SPO2 (oxygen saturation) if present. Data: ${JSON.stringify(selectedPerson.healthData.slice(0, 50))}`
            }
          ],
        })
      });

      const data = await response.json();
      const analysisText = data.content.map(item => item.text || '').join('\n');
      setAnalysis(analysisText);
    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysis('Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Calculate stats for selected person
  const calculateStats = () => {
    if (!selectedPerson || selectedPerson.healthData.length === 0) return null;
    
    const data = selectedPerson.healthData;
    const hrData = data.filter(d => d.HR || d.hr || d['Heart Rate'] || d.HeartRate).map(d => d.HR || d.hr || d['Heart Rate'] || d.HeartRate);
    const bpSystolicData = data.filter(d => d.BP_Systolic || d.SBP || d['BP Systolic'] || d.Systolic).map(d => d.BP_Systolic || d.SBP || d['BP Systolic'] || d.Systolic);
    const spo2Data = data.filter(d => d.SPO2 || d.spo2 || d['Oxygen Saturation'] || d.O2).map(d => d.SPO2 || d.spo2 || d['Oxygen Saturation'] || d.O2);

    return {
      avgHR: hrData.length ? (hrData.reduce((a, b) => a + b, 0) / hrData.length).toFixed(1) : 'N/A',
      avgBP: bpSystolicData.length ? (bpSystolicData.reduce((a, b) => a + b, 0) / bpSystolicData.length).toFixed(1) : 'N/A',
      avgSPO2: spo2Data.length ? (spo2Data.reduce((a, b) => a + b, 0) / spo2Data.length).toFixed(1) : 'N/A',
      totalRecords: data.length,
      hrCount: hrData.length,
      bpCount: bpSystolicData.length,
      spo2Count: spo2Data.length
    };
  };

  const stats = calculateStats();

  // Helper function to get the actual column name for a vital
  const getColumnName = (data, possibleNames) => {
    if (!data || data.length === 0) return null;
    const firstRow = data[0];
    return possibleNames.find(name => firstRow.hasOwnProperty(name)) || null;
  };

  if (!isLoggedIn) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a4d5c 0%, #1a1a2e 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        padding: '20px'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '60px 50px',
          maxWidth: '440px',
          width: '100%',
          boxShadow: '0 30px 90px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          animation: 'slideUp 0.6s ease-out'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #00d4aa 0%, #0096c7 100%)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              boxShadow: '0 8px 24px rgba(0, 150, 199, 0.3)'
            }}>
              <Activity size={40} color="#fff" strokeWidth={2.5} />
            </div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #0a4d5c 0%, #00d4aa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '8px',
              letterSpacing: '-0.5px'
            }}>HealthSync Pro</h1>
            <p style={{ color: '#64748b', fontSize: '15px', fontWeight: '500' }}>Advanced Health Data Platform</p>
          </div>

          <form onSubmit={handleLogin}>
            {loginError && (
              <div style={{
                background: '#fee2e2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                {loginError}
              </div>
            )}
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#334155',
                fontSize: '14px',
                fontWeight: '600'
              }}>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: '15px',
                  transition: 'all 0.3s ease',
                  outline: 'none',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#00d4aa'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#334155',
                fontSize: '14px',
                fontWeight: '600'
              }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: '15px',
                  transition: 'all 0.3s ease',
                  outline: 'none',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#00d4aa'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            <button type="submit" style={{
              width: '100%',
              padding: '16px',
              background: 'linear-gradient(135deg, #00d4aa 0%, #0096c7 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 16px rgba(0, 150, 199, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 24px rgba(0, 150, 199, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 16px rgba(0, 150, 199, 0.3)';
            }}>
              Sign In
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '24px', color: '#94a3b8', fontSize: '13px' }}>
            Demo credentials: admin / admin123
          </p>
        </div>

        <style>{`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #f8fafc 0%, #e7eef4 100%)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0a4d5c 0%, #00796b 100%)',
        color: 'white',
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Activity size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0, letterSpacing: '-0.5px' }}>HealthSync Pro</h1>
            <p style={{ fontSize: '13px', opacity: 0.9, margin: 0 }}>
              {selectedPerson ? `Viewing: ${selectedPerson.name}` : 'Clinical Data Management'}
            </p>
          </div>
        </div>
        <button onClick={() => setIsLoggedIn(false)} style={{
          background: 'rgba(255, 255, 255, 0.15)',
          border: 'none',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '10px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          fontWeight: '600',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.25)'}
        onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.15)'}>
          <LogOut size={18} />
          Logout
        </button>
      </div>

      {/* Patient Selector Bar */}
      {persons.length > 0 && (
        <div style={{
          background: 'white',
          padding: '16px 40px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <Users size={20} color="#64748b" />
          <label style={{ color: '#64748b', fontSize: '14px', fontWeight: '600' }}>Select Patient:</label>
          <select 
            value={selectedPersonId || ''}
            onChange={(e) => setSelectedPersonId(Number(e.target.value))}
            style={{
              padding: '10px 16px',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#0f172a',
              outline: 'none',
              cursor: 'pointer',
              minWidth: '250px',
              background: selectedPersonId ? '#f0f9ff' : 'white'
            }}
          >
            <option value="">-- Select a patient --</option>
            {persons.map(person => (
              <option key={person.id} value={person.id}>
                {person.name} (ID: {person.medicalId}) - {person.healthData.length} records
              </option>
            ))}
          </select>
          {selectedPerson && stats && (
            <div style={{
              marginLeft: 'auto',
              display: 'flex',
              gap: '16px',
              fontSize: '13px',
              color: '#64748b'
            }}>
              <span><strong>Age:</strong> {selectedPerson.age}</span>
              <span><strong>Gender:</strong> {selectedPerson.gender}</span>
              <span style={{ color: stats.hrCount > 0 ? '#059669' : '#cbd5e1' }}>❤️ HR: {stats.hrCount}</span>
              <span style={{ color: stats.bpCount > 0 ? '#059669' : '#cbd5e1' }}>🩸 BP: {stats.bpCount}</span>
              <span style={{ color: stats.spo2Count > 0 ? '#059669' : '#cbd5e1' }}>🫁 SPO2: {stats.spo2Count}</span>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e2e8f0',
        padding: '0 40px',
        display: 'flex',
        gap: '4px'
      }}>
        {[
          { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={18} /> },
          { id: 'addPerson', label: 'Add Person', icon: <Plus size={18} /> },
          { id: 'upload', label: 'Upload Data', icon: <Upload size={18} /> },
          { id: 'visualize', label: 'Visualize', icon: <TrendingUp size={18} /> },
          { id: 'analyze', label: 'AI Analysis', icon: <Brain size={18} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            style={{
              background: activeView === tab.id ? 'linear-gradient(to bottom, #f0f9ff 0%, #e0f2fe 100%)' : 'transparent',
              border: 'none',
              borderBottom: activeView === tab.id ? '3px solid #0096c7' : '3px solid transparent',
              padding: '16px 24px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              color: activeView === tab.id ? '#0a4d5c' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              if (activeView !== tab.id) e.target.style.background = '#f8fafc';
            }}
            onMouseLeave={(e) => {
              if (activeView !== tab.id) e.target.style.background = 'transparent';
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Dashboard View */}
        {activeView === 'dashboard' && (
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', marginBottom: '24px' }}>
              {selectedPerson ? `${selectedPerson.name}'s Dashboard` : 'Dashboard'}
            </h2>
            
            {/* Stats Cards */}
            {stats && selectedPerson && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                  padding: '24px',
                  borderRadius: '16px',
                  color: 'white',
                  boxShadow: '0 8px 24px rgba(238, 90, 111, 0.3)'
                }}>
                  <Heart size={32} style={{ marginBottom: '12px', opacity: 0.9 }} />
                  <p style={{ fontSize: '13px', opacity: 0.9, margin: '0 0 4px 0', fontWeight: '600' }}>Avg Heart Rate</p>
                  <p style={{ fontSize: '32px', fontWeight: '700', margin: 0 }}>{stats.avgHR}</p>
                </div>
                <div style={{
                  background: 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)',
                  padding: '24px',
                  borderRadius: '16px',
                  color: 'white',
                  boxShadow: '0 8px 24px rgba(78, 205, 196, 0.3)'
                }}>
                  <Droplet size={32} style={{ marginBottom: '12px', opacity: 0.9 }} />
                  <p style={{ fontSize: '13px', opacity: 0.9, margin: '0 0 4px 0', fontWeight: '600' }}>Avg Blood Pressure</p>
                  <p style={{ fontSize: '32px', fontWeight: '700', margin: 0 }}>{stats.avgBP}</p>
                </div>
                <div style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  padding: '24px',
                  borderRadius: '16px',
                  color: 'white',
                  boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)'
                }}>
                  <Wind size={32} style={{ marginBottom: '12px', opacity: 0.9 }} />
                  <p style={{ fontSize: '13px', opacity: 0.9, margin: '0 0 4px 0', fontWeight: '600' }}>Avg SPO2</p>
                  <p style={{ fontSize: '32px', fontWeight: '700', margin: 0 }}>{stats.avgSPO2}%</p>
                </div>
                <div style={{
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  padding: '24px',
                  borderRadius: '16px',
                  color: 'white',
                  boxShadow: '0 8px 24px rgba(245, 87, 108, 0.3)'
                }}>
                  <FileText size={32} style={{ marginBottom: '12px', opacity: 0.9 }} />
                  <p style={{ fontSize: '13px', opacity: 0.9, margin: '0 0 4px 0', fontWeight: '600' }}>Total Records</p>
                  <p style={{ fontSize: '32px', fontWeight: '700', margin: 0 }}>{stats.totalRecords}</p>
                </div>
              </div>
            )}

            {!selectedPerson && persons.length > 0 && (
              <div style={{
                background: '#fef3c7',
                border: '1px solid #fbbf24',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '32px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <Users size={24} color="#f59e0b" />
                <p style={{ color: '#92400e', margin: 0, fontSize: '14px', fontWeight: '500' }}>
                  👆 Please select a patient from the dropdown above to view their health data
                </p>
              </div>
            )}

            {/* Persons List */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '28px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', marginBottom: '20px' }}>Registered Persons</h3>
              {persons.length === 0 ? (
                <p style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>No persons registered yet. Add a new person to get started.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '12px', color: '#64748b', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Name</th>
                        <th style={{ textAlign: 'left', padding: '12px', color: '#64748b', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Age</th>
                        <th style={{ textAlign: 'left', padding: '12px', color: '#64748b', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Gender</th>
                        <th style={{ textAlign: 'left', padding: '12px', color: '#64748b', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Medical ID</th>
                        <th style={{ textAlign: 'left', padding: '12px', color: '#64748b', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contact</th>
                        <th style={{ textAlign: 'left', padding: '12px', color: '#64748b', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Records</th>
                      </tr>
                    </thead>
                    <tbody>
                      {persons.map(person => (
                        <tr key={person.id} style={{
                          background: person.id === selectedPersonId ? '#f0f9ff' : '#f8fafc',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f0f9ff'}
                        onMouseLeave={(e) => e.currentTarget.style.background = person.id === selectedPersonId ? '#f0f9ff' : '#f8fafc'}
                        onClick={() => setSelectedPersonId(person.id)}>
                          <td style={{ padding: '16px', borderRadius: '8px 0 0 8px', fontWeight: '600', color: '#0f172a' }}>{person.name}</td>
                          <td style={{ padding: '16px', color: '#475569' }}>{person.age}</td>
                          <td style={{ padding: '16px', color: '#475569' }}>{person.gender}</td>
                          <td style={{ padding: '16px', color: '#0096c7', fontWeight: '600' }}>{person.medicalId}</td>
                          <td style={{ padding: '16px', color: '#475569' }}>{person.email}</td>
                          <td style={{ padding: '16px', borderRadius: '0 8px 8px 0', color: person.healthData.length > 0 ? '#059669' : '#94a3b8', fontWeight: '600' }}>
                            {person.healthData.length} records
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add Person View */}
        {activeView === 'addPerson' && (
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', marginBottom: '24px' }}>Add New Person</h2>
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '700px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
              border: '1px solid #e2e8f0'
            }}>
              <form onSubmit={handleAddPerson}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#334155', fontSize: '14px', fontWeight: '600' }}>Full Name</label>
                    <input name="name" required style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '10px',
                      fontSize: '15px',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#00d4aa'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#334155', fontSize: '14px', fontWeight: '600' }}>Age</label>
                    <input name="age" type="number" required style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '10px',
                      fontSize: '15px',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#00d4aa'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#334155', fontSize: '14px', fontWeight: '600' }}>Gender</label>
                    <select name="gender" required style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '10px',
                      fontSize: '15px',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#00d4aa'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#334155', fontSize: '14px', fontWeight: '600' }}>Medical ID</label>
                    <input name="medicalId" required style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '10px',
                      fontSize: '15px',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#00d4aa'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#334155', fontSize: '14px', fontWeight: '600' }}>Email</label>
                    <input name="email" type="email" required style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '10px',
                      fontSize: '15px',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#00d4aa'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#334155', fontSize: '14px', fontWeight: '600' }}>Phone</label>
                    <input name="phone" required style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '10px',
                      fontSize: '15px',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#00d4aa'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'} />
                  </div>
                </div>
                <button type="submit" style={{
                  background: 'linear-gradient(135deg, #00d4aa 0%, #0096c7 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '14px 32px',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 16px rgba(0, 150, 199, 0.3)'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}>
                  <User size={18} />
                  Add Person
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Upload Data View */}
        {activeView === 'upload' && (
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', marginBottom: '24px' }}>
              Upload Health Data {selectedPerson && `for ${selectedPerson.name}`}
            </h2>

            {!selectedPerson && (
              <div style={{
                background: '#fef3c7',
                border: '1px solid #fbbf24',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <Users size={24} color="#f59e0b" />
                <p style={{ color: '#92400e', margin: 0, fontSize: '14px', fontWeight: '500' }}>
                  ⚠️ Please select a patient from the dropdown at the top before uploading data
                </p>
              </div>
            )}

            {/* Data Type Selector */}
            {selectedPerson && (
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px',
                border: '1px solid #e2e8f0'
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', marginBottom: '12px' }}>
                  📋 What type of data are you uploading?
                </h3>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {[
                    { value: 'all', label: '📊 Complete Data', desc: '(All vitals in one file)' },
                    { value: 'hr', label: '❤️ Heart Rate Only', desc: '' },
                    { value: 'bp', label: '🩸 Blood Pressure Only', desc: '' },
                    { value: 'spo2', label: '🫁 SPO2/Oxygen Only', desc: '' }
                  ].map(type => (
                    <button
                      key={type.value}
                      onClick={() => setDataType(type.value)}
                      style={{
                        padding: '12px 20px',
                        border: `2px solid ${dataType === type.value ? '#0096c7' : '#e2e8f0'}`,
                        borderRadius: '10px',
                        background: dataType === type.value ? '#f0f9ff' : 'white',
                        color: dataType === type.value ? '#0a4d5c' : '#64748b',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (dataType !== type.value) e.target.style.background = '#f8fafc';
                      }}
                      onMouseLeave={(e) => {
                        if (dataType !== type.value) e.target.style.background = 'white';
                      }}
                    >
                      {type.label} {type.desc}
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '12px', marginBottom: 0 }}>
                  💡 Upload multiple files separately! Data will be automatically merged by timestamp.
                </p>
              </div>
            )}

            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '40px',
              maxWidth: '700px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
              border: '1px solid #e2e8f0',
              opacity: selectedPerson ? 1 : 0.6
            }}>
              <div style={{
                border: '3px dashed #cbd5e1',
                borderRadius: '12px',
                padding: '60px 40px',
                textAlign: 'center',
                background: '#f8fafc',
                transition: 'all 0.3s ease'
              }}>
                <Upload size={48} color="#0096c7" style={{ marginBottom: '16px' }} />
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a', marginBottom: '8px' }}>
                  Upload {dataType === 'all' ? 'Complete' : dataType === 'hr' ? 'Heart Rate' : dataType === 'bp' ? 'Blood Pressure' : 'SPO2'} CSV File
                </h3>
                <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '14px' }}>
                  {selectedPerson 
                    ? `Upload ${dataType === 'all' ? 'complete health' : dataType === 'hr' ? 'heart rate' : dataType === 'bp' ? 'blood pressure' : 'SPO2'} data for ${selectedPerson.name}`
                    : 'Select a patient first to upload their data'
                  }
                </p>
                <input
                  type="file"
                  accept=".csv,.db"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                  id="fileInput"
                  disabled={!selectedPerson}
                />
                <label htmlFor="fileInput" style={{
                  background: selectedPerson ? 'linear-gradient(135deg, #00d4aa 0%, #0096c7 100%)' : '#cbd5e1',
                  color: 'white',
                  padding: '12px 28px',
                  borderRadius: '10px',
                  cursor: selectedPerson ? 'pointer' : 'not-allowed',
                  display: 'inline-block',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease'
                }}>
                  Choose File
                </label>
                <div style={{
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '8px',
                  padding: '12px',
                  marginTop: '20px',
                  textAlign: 'left'
                }}>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#0369a1', margin: '0 0 8px 0' }}>
                    📝 Expected Format:
                  </p>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: 0, fontFamily: 'monospace' }}>
                    {dataType === 'all' && 'timestamp, HR, BP_Systolic, BP_Diastolic, SPO2'}
                    {dataType === 'hr' && 'timestamp, HR'}
                    {dataType === 'bp' && 'timestamp, BP_Systolic, BP_Diastolic'}
                    {dataType === 'spo2' && 'timestamp, SPO2'}
                  </p>
                </div>
              </div>

              {selectedPerson && selectedPerson.healthData.length > 0 && stats && (
                <div style={{ marginTop: '24px' }}>
                  <div style={{
                    background: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    borderRadius: '10px',
                    padding: '16px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <FileText size={20} color="#0096c7" />
                      <p style={{ fontWeight: '600', color: '#0a4d5c', margin: 0 }}>{selectedPerson.name}'s Current Data:</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', fontSize: '13px' }}>
                      <div style={{ color: stats.hrCount > 0 ? '#059669' : '#94a3b8' }}>
                        ❤️ Heart Rate: <strong>{stats.hrCount} records</strong>
                      </div>
                      <div style={{ color: stats.bpCount > 0 ? '#059669' : '#94a3b8' }}>
                        🩸 Blood Pressure: <strong>{stats.bpCount} records</strong>
                      </div>
                      <div style={{ color: stats.spo2Count > 0 ? '#059669' : '#94a3b8' }}>
                        🫁 SPO2: <strong>{stats.spo2Count} records</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Visualize View */}
        {activeView === 'visualize' && (
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', marginBottom: '24px' }}>
              Data Visualization {selectedPerson && `- ${selectedPerson.name}`}
            </h2>
            
            {!selectedPerson || selectedPerson.healthData.length === 0 ? (
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '60px 40px',
                textAlign: 'center',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
                border: '1px solid #e2e8f0'
              }}>
                <TrendingUp size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
                <p style={{ color: '#64748b' }}>
                  {!selectedPerson 
                    ? 'Select a patient to view their data'
                    : 'No data to visualize. Upload health data for this patient first.'
                  }
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '24px' }}>
                
                {/* Data Table */}
                <div style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '28px',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
                  border: '1px solid #e2e8f0'
                }}>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', marginBottom: '20px' }}>
                    {selectedPerson.name}'s Health Data
                  </h3>
                  <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }}>
                        <tr>
                          {Object.keys(selectedPerson.healthData[0] || {}).map(key => (
                            <th key={key} style={{
                              textAlign: 'left',
                              padding: '12px',
                              color: '#64748b',
                              fontSize: '13px',
                              fontWeight: '600',
                              borderBottom: '2px solid #e2e8f0',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPerson.healthData.slice(0, 50).map((row, i) => (
                          <tr key={i} style={{
                            borderBottom: '1px solid #f1f5f9',
                            transition: 'background 0.2s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                            {Object.values(row).map((val, j) => (
                              <td key={j} style={{ padding: '12px', color: '#475569', fontSize: '14px' }}>
                                {typeof val === 'number' ? val.toFixed(2) : val}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Charts */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                  {/* Heart Rate Chart */}
                  {selectedPerson.healthData.some(d => d.HR || d.hr || d['Heart Rate'] || d.HeartRate) && (() => {
                    const hrColumn = getColumnName(selectedPerson.healthData, ['HR', 'hr', 'Heart Rate', 'HeartRate']);
                    return hrColumn && (
                    <div style={{
                      background: 'white',
                      borderRadius: '16px',
                      padding: '28px',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
                      border: '1px solid #e2e8f0'
                    }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Heart size={20} color="#ff6b6b" />
                        Heart Rate Trends
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={selectedPerson.healthData.slice(0, 30)}>
                          <defs>
                            <linearGradient id="colorHR" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ff6b6b" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#ff6b6b" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="id" stroke="#94a3b8" fontSize={12} />
                          <YAxis stroke="#94a3b8" fontSize={12} />
                          <Tooltip contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                          <Area type="monotone" dataKey={hrColumn} stroke="#ff6b6b" strokeWidth={3} fillOpacity={1} fill="url(#colorHR)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  );})()}

                  {/* Blood Pressure Chart */}
                  {selectedPerson.healthData.some(d => d.BP_Systolic || d.SBP || d.Systolic || d['BP Systolic']) && (() => {
                    const bpSysColumn = getColumnName(selectedPerson.healthData, ['BP_Systolic', 'SBP', 'Systolic', 'BP Systolic']);
                    const bpDiaColumn = getColumnName(selectedPerson.healthData, ['BP_Diastolic', 'DBP', 'Diastolic', 'BP Diastolic']);
                    return bpSysColumn && (
                    <div style={{
                      background: 'white',
                      borderRadius: '16px',
                      padding: '28px',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
                      border: '1px solid #e2e8f0'
                    }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Droplet size={20} color="#4ecdc4" />
                        Blood Pressure
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={selectedPerson.healthData.slice(0, 30)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="id" stroke="#94a3b8" fontSize={12} />
                          <YAxis stroke="#94a3b8" fontSize={12} />
                          <Tooltip contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                          <Legend />
                          <Line type="monotone" dataKey={bpSysColumn} stroke="#4ecdc4" strokeWidth={3} dot={false} name="Systolic" />
                          {bpDiaColumn && <Line type="monotone" dataKey={bpDiaColumn} stroke="#44a08d" strokeWidth={3} dot={false} name="Diastolic" />}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  );})()}

                  {/* SPO2 Chart */}
                  {selectedPerson.healthData.some(d => d.SPO2 || d.spo2 || d['Oxygen Saturation'] || d.O2) && (() => {
                    const spo2Column = getColumnName(selectedPerson.healthData, ['SPO2', 'spo2', 'Oxygen Saturation', 'O2']);
                    return spo2Column && (
                    <div style={{
                      background: 'white',
                      borderRadius: '16px',
                      padding: '28px',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
                      border: '1px solid #e2e8f0'
                    }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Wind size={20} color="#667eea" />
                        Oxygen Saturation (SPO2)
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={selectedPerson.healthData.slice(0, 30)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="id" stroke="#94a3b8" fontSize={12} />
                          <YAxis stroke="#94a3b8" fontSize={12} domain={[90, 100]} />
                          <Tooltip contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                          <Bar dataKey={spo2Column} fill="#667eea" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  );})()}
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI Analysis View */}
        {activeView === 'analyze' && (
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', marginBottom: '24px' }}>
              AI-Powered Analysis {selectedPerson && `- ${selectedPerson.name}`}
            </h2>
            
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ marginBottom: '24px' }}>
                <button
                  onClick={analyzeData}
                  disabled={isAnalyzing || !selectedPerson || selectedPerson.healthData.length === 0}
                  style={{
                    background: (isAnalyzing || !selectedPerson || selectedPerson.healthData.length === 0) ? '#cbd5e1' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '14px 32px',
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: (isAnalyzing || !selectedPerson || selectedPerson.healthData.length === 0) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease',
                    boxShadow: (isAnalyzing || !selectedPerson || selectedPerson.healthData.length === 0) ? 'none' : '0 4px 16px rgba(102, 126, 234, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    if (!isAnalyzing && selectedPerson && selectedPerson.healthData.length > 0) e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  <Brain size={18} />
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Data with AI'}
                </button>
              </div>

              {analysis && (
                <div style={{
                  background: 'linear-gradient(to bottom, #f0f9ff 0%, #e0f2fe 100%)',
                  border: '1px solid #bae6fd',
                  borderRadius: '12px',
                  padding: '24px',
                  marginTop: '24px'
                }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0a4d5c', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Brain size={20} />
                    Analysis Results for {selectedPerson.name}
                  </h3>
                  <div style={{
                    color: '#334155',
                    lineHeight: '1.7',
                    fontSize: '15px',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {analysis}
                  </div>
                </div>
              )}

              {!analysis && !isAnalyzing && (!selectedPerson || selectedPerson.healthData.length === 0) && (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: '#64748b'
                }}>
                  <Brain size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
                  <p>{!selectedPerson ? 'Select a patient and upload their health data to perform AI analysis' : 'Upload health data for this patient to perform AI analysis'}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
