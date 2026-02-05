import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import LandingPage from '@/pages/LandingPage';
import ChatPage from '@/pages/ChatPage';
import ProfilePage from '@/pages/ProfilePage';
import AdminPage from '@/pages/AdminPage';
import { Toaster } from 'react-hot-toast';
import { Analytics } from '@vercel/analytics/react';
import './styles/globals.css';

function App() {
  const { user, loading, refreshSession } = useAuth();

  useEffect(() => {
    refreshSession();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-gold text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-dark text-white">
        <Routes>
          <Route path="/" element={user ? <Navigate to="/chat" /> : <LandingPage />} />
          <Route path="/chat" element={user ? <ChatPage /> : <Navigate to="/" />} />
          <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/" />} />
          <Route path="/admin" element={user?.email === 'admin@example.com' ? <AdminPage /> : <Navigate to="/" />} />
        </Routes>
        <Toaster position="top-right" />
        <Analytics />
      </div>
    </Router>
  );
}

export default App;