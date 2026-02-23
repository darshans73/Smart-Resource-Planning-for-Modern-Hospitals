import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('hrms_token');
    const savedUser = localStorage.getItem('hrms_user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      getMe().then(res => {
        setUser(res.data.user);
        localStorage.setItem('hrms_user', JSON.stringify(res.data.user));
      }).catch(() => {
        localStorage.removeItem('hrms_token');
        localStorage.removeItem('hrms_user');
        setUser(null);
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const loginUser = (token, userData) => {
    localStorage.setItem('hrms_token', token);
    localStorage.setItem('hrms_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logoutUser = () => {
    localStorage.removeItem('hrms_token');
    localStorage.removeItem('hrms_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
