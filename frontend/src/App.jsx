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
import Vouchers from './pages/Vouchers.jsx';
import Analytics from './pages/Analytics.jsx';
import StoreLayout from './store/StoreLayout.jsx';
import StoreHome from './store/StoreHome.jsx';
import ProductDetail from './store/ProductDetail.jsx';
import Profile from './store/Profile.jsx';
import Checkout from './store/Checkout.jsx';
import MyOrders from './store/MyOrders.jsx';

function HomeRedirect() {
  const { isAdmin, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-ink-faint text-sm animate-pulse">Đang kiểm tra đăng nhập...</div>
      </div>
    );
  }
  // Khách chưa đăng nhập vẫn vào được cửa hàng để xem; admin vào khu quản trị
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

          {/* Admin (can dang nhap + vai tro ADMIN) */}
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
            <Route path="vouchers" element={<Vouchers />} />
            <Route path="analytics" element={<Analytics />} />
          </Route>

          {/* Store khach hang: cong khai, khong can dang nhap de xem */}
          <Route path="/store" element={<StoreLayout />}>
            <Route index element={<StoreHome />} />
            <Route path="product/:id" element={<ProductDetail />} />
            <Route
              path="profile"
              element={
                <RequireAuth role="CUSTOMER">
                  <Profile />
                </RequireAuth>
              }
            />
            <Route
              path="checkout"
              element={
                <RequireAuth role="CUSTOMER">
                  <Checkout />
                </RequireAuth>
              }
            />
            <Route
              path="orders"
              element={
                <RequireAuth role="CUSTOMER">
                  <MyOrders />
                </RequireAuth>
              }
            />
          </Route>

          {/* Mac dinh */}
          <Route path="/" element={<HomeRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </CartProvider>
    </AuthProvider>
  );
}
