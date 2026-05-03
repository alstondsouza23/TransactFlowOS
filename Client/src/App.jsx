import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Contributions from './pages/Contributions';
import Loans from './pages/Loans';
import GroupOverview from './pages/GroupOverview';
import Agreement from './pages/Agreement';

function App() {
  return (
    <Router>
      <Routes>
        {/* Login sits outside the shared layout (its own full-screen style) */}
        <Route path="/" element={<Login />} />

        {/* All authenticated pages share the Layout wrapper */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/contributions" element={<Contributions />} />
          <Route path="/loans" element={<Loans />} />
          <Route path="/group" element={<GroupOverview />} />
          <Route path="/agreement" element={<Agreement />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
