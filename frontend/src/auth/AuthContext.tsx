/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { apiFetch } from '../lib/api';
import { useNavigate } from 'react-router-dom';

export const TOKEN_KEY = 'access_token';

type LoginCredentials = {
  email: string;
  password: string;
};

type AuthContextValue = {
  token: string | null;
  handleLogin: (credentials: LoginCredentials) => Promise<void>;
  handleSignup: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem(TOKEN_KEY) || null,
  );
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }, [token]);

  const handleLogin = async (credentials: LoginCredentials) => {
    setLoading(true);
    try {
      const { access_token } = await apiFetch<{ access_token: string }>(
        '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify(credentials),
        },
      );
      setToken(access_token);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (credentials: LoginCredentials) => {
    setLoading(true);
    try {
      const { access_token } = await apiFetch<{ access_token: string }>(
        '/auth/signup',
        {
          method: 'POST',
          body: JSON.stringify(credentials),
        },
      );
      setToken(access_token);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => setToken(null);

  return (
    <AuthContext.Provider
      value={{ token, handleLogin, handleSignup, logout, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
