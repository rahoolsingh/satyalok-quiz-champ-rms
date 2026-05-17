import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PublicPortal } from './pages/PublicPortal';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { PaymentStatus } from './pages/PaymentStatus';
import { GroupJoin } from './pages/GroupJoin';

function AdminRoute() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('adminToken'));

  useEffect(() => {
    const syncAuthState = () => setIsLoggedIn(!!localStorage.getItem('adminToken'));
    const handleStorageChange = (event: StorageEvent) => {
      if (!event.key || event.key === 'adminToken') {
        syncAuthState();
      }
    };

    window.addEventListener('admin-auth-expired', syncAuthState);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('admin-auth-expired', syncAuthState);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

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
          <Route path="/group-join" element={<GroupJoin />} />
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
