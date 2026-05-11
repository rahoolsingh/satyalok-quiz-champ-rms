import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PublicPortal } from './pages/PublicPortal';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { PaymentStatus } from './pages/PaymentStatus';

function AdminRoute() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('adminToken'));

  const handleLogin = () => setIsLoggedIn(true);
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUsername');
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) return <AdminLogin onLogin={handleLogin} />;
  return <AdminDashboard onLogout={handleLogout} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <a href="#main-content" className="skip-nav">Skip to main content</a>
      <main id="main-content">
        <Routes>
          <Route path="/" element={<PublicPortal />} />
          <Route path="/payment-status" element={<PaymentStatus />} />
          {/* Legacy routes - redirect to unified status page */}
          <Route path="/payment-success" element={<PaymentStatus />} />
          <Route path="/payment-failed" element={<PaymentStatus />} />
          <Route path="/admin" element={<AdminRoute />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
