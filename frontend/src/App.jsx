import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext.jsx';
import { CartProvider } from './store/CartContext.jsx';
import Layout from './components/Layout.jsx';
import RequireAuth from './components/RequireAuth.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Products from './pages/Products.jsx';
import Customers from './pages/Customers.jsx';
import Orders from './pages/Orders.jsx';
import StoreLayout from './store/StoreLayout.jsx';
import StoreHome from './store/StoreHome.jsx';
import Checkout from './store/Checkout.jsx';
import MyOrders from './store/MyOrders.jsx';

function HomeRedirect() {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-400 text-sm animate-pulse">Đang kiểm tra đăng nhập...</div>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={isAdmin ? '/admin' : '/store'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Routes>
          {/* Cong khai */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Admin */}
          <Route
            path="/admin"
            element={
              <RequireAuth role="ADMIN">
                <Layout />
              </RequireAuth>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="customers" element={<Customers />} />
            <Route path="orders" element={<Orders />} />
          </Route>

          {/* Store khach hang */}
          <Route
            path="/store"
            element={
              <RequireAuth role="CUSTOMER">
                <StoreLayout />
              </RequireAuth>
            }
          >
            <Route index element={<StoreHome />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="orders" element={<MyOrders />} />
          </Route>

          {/* Mac dinh */}
          <Route path="/" element={<HomeRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </CartProvider>
    </AuthProvider>
  );
}
