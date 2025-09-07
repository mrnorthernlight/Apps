import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <svg className="loading-logo" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <circle cx="200" cy="200" r="180" fill="none" stroke="#4A5568" strokeWidth="20"/>
            <path d="M160 80 L240 80 L180 200 L220 200 L140 320 L200 180 L160 180 Z" 
                  fill="#F6AD55" 
                  stroke="#ED8936" 
                  strokeWidth="2"/>
          </svg>
          <div className="loading-text">Rupture</div>
          <div className="loading-subtitle">Loading...</div>
        </div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" replace />;
};

// Public Route Component (redirect to chat if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <svg className="loading-logo" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <circle cx="200" cy="200" r="180" fill="none" stroke="#4A5568" strokeWidth="20"/>
            <path d="M160 80 L240 80 L180 200 L220 200 L140 320 L200 180 L160 180 Z" 
                  fill="#F6AD55" 
                  stroke="#ED8936" 
                  strokeWidth="2"/>
          </svg>
          <div className="loading-text">Rupture</div>
          <div className="loading-subtitle">Loading...</div>
        </div>
      </div>
    );
  }
  
  return user ? <Navigate to="/chat" replace /> : children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            <Route 
              path="/register" 
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } 
            />
            
            {/* Protected Routes */}
            <Route 
              path="/chat/*" 
              element={
                <ProtectedRoute>
                  <SocketProvider>
                    <Chat />
                  </SocketProvider>
                </ProtectedRoute>
              } 
            />
            
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/chat" replace />} />
            <Route path="*" element={<Navigate to="/chat" replace />} />
          </Routes>
          
          {/* Toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#262626',
                color: '#EDEDED',
                border: '1px solid #374151',
              },
              success: {
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#EDEDED',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#EDEDED',
                },
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

