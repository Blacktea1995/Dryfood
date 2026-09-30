import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

/**
 * Bao ve route: chua dang nhap -> /login.
 * `role` neu cho truoc: nguoi dung sai vai tro -> chuyen ve dung khu vuc.
 */
export default function RequireAuth({ children, role }) {
  const { isAuthenticated, isAdmin, isCustomer, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-400 text-sm animate-pulse">Đang kiểm tra đăng nhập...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (role === 'ADMIN' && !isAdmin) {
    return <Navigate to="/store" replace />;
  }

  if (role === 'CUSTOMER' && !isCustomer) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}
