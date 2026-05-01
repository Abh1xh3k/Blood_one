import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Landing from './pages/Landing';
import AdminDashboard from './pages/AdminDashboard';

import { Toaster } from 'react-hot-toast';
import InteractiveBackground from './components/InteractiveBackground';

// Mock simple navbar
const Navbar = () => {
  const { user, logout } = useAuth();
  
  return (
    <nav className="navbar">
      <div className="container flex justify-between items-center w-full">
        <div className="flex items-center gap-4">
          <div className="text-gradient-red" style={{ fontSize: '1.5rem', fontWeight: 800 }}>
            LifeChain
          </div>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="badge badge-safe">Role: Admin</span>
              <button className="btn btn-secondary" onClick={logout}>Logout</button>
            </>
          ) : (
            <button className="btn btn-secondary" onClick={() => window.location.href = '/'}>Home</button>
          )}
        </div>
      </div>
    </nav>
  );
};

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user || user.role !== 'admin') return <Navigate to="/" />;
  return children;
};

function App() {
  return (
    <Router>
      <InteractiveBackground />
      <Toaster position="top-right" toastOptions={{
        style: {
          background: 'rgba(20, 20, 20, 0.9)',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
        },
      }} />
      <Navbar />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
