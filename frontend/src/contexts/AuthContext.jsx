import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('traffic_auth_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
          localStorage.setItem('traffic_auth_user', JSON.stringify(res.data));
        } catch (err) {
          console.error('Session verification failed:', err);
          logout();
        }
      }
      setLoading(false);
    };

    fetchCurrentUser();
  }, [token]);

  const login = async (employee_id, password) => {
    try {
      const res = await api.post('/auth/login', { employee_id, password });
      const { access_token, user: loggedUser } = res.data;
      setToken(access_token);
      setUser(loggedUser);
      localStorage.setItem('traffic_auth_token', access_token);
      localStorage.setItem('traffic_auth_user', JSON.stringify(loggedUser));
      return { success: true, user: loggedUser };
    } catch (err) {
      let msg = 'Invalid Employee ID or Password';
      if (!err.response) {
        msg = 'Cannot connect to backend server. Make sure the backend is running on http://127.0.0.1:8000';
      } else if (err.response.data?.detail) {
        msg = err.response.data.detail;
      }
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('traffic_auth_token');
    localStorage.removeItem('traffic_auth_user');
  };

  const roleName = user?.role?.role_name || '';
  const isAdmin = roleName === 'ADMIN';
  const isOfficer = roleName === 'TRAFFIC_OFFICER' || isAdmin;
  const isOperator = roleName === 'TRAFFIC_OPERATOR' || isOfficer;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        roleName,
        isAdmin,
        isOfficer,
        isOperator,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
