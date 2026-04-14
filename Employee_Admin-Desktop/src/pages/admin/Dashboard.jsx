import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();
  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1>Admin Dashboard</h1>
      <p>Welcome, Administrator.</p>
      <button 
        onClick={() => navigate('/login')}
        style={{ marginTop: '20px', padding: '10px', cursor: 'pointer' }}
      >
        Sign Out
      </button>
    </div>
  );
}
