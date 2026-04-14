import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
      <h1>Dashboard (Placeholder)</h1>
      <p>Welcome to the TransactFlowOS system dashboard.</p>
      <button 
        style={{ marginTop: '20px', padding: '10px 20px', background: '#1a2f55', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        onClick={() => navigate('/login')}
      >
        Sign Out
      </button>
    </div>
  );
}
