import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../api/client.js';

const AuthContext = createContext(null);

function readStored() {
  try {
    const u = localStorage.getItem('df_user');
    const t = localStorage.getItem('df_token');
    return { user: u ? JSON.parse(u) : null, token: t || null };
  } catch {
    return { user: null, token: null };
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStored().user);
  const [token, setToken] = useState(() => readStored().token);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback((data) => {
    const u = {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role,
      customerId: data.customerId,
      phone: data.phone || '',
      address: data.address || ''
    };
    setUser(u);
    setToken(data.token || null);
    try {
      localStorage.setItem('df_user', JSON.stringify(u));
      if (data.token) localStorage.setItem('df_token', data.token);
    } catch { /* ignore */ }
  }, []);

  // Khoi phuc phien dang nhap tu token luu tru
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = readStored();
      if (!stored.token) {
        setLoading(false);
        return;
      }
      try {
        const me = await api.me();
        if (!cancelled) {
          applySession({ ...me, token: stored.token });
        }
      } catch {
        // Token het han -> da bi client.js xoa localStorage
        if (!cancelled) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [applySession]);

  const login = useCallback(async (email, password) => {
    const data = await api.login({ email, password });
    applySession(data);
    return data;
  }, [applySession]);

  const register = useCallback(async (payload) => {
    const data = await api.register(payload);
    applySession(data);
    return data;
  }, [applySession]);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch { /* da het phien cung duoc */ }
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem('df_user');
      localStorage.removeItem('df_token');
    } catch { /* ignore */ }
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    isCustomer: user?.role === 'CUSTOMER',
    loading,
    login,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
