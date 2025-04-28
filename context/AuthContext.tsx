// context/AuthContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';

type AuthContextType = {
  isAuthenticated: boolean;
  wallet: string | null;
  token: string | null;
  setAuthData: (wallet: string, token: string) => void;
  clearAuth: () => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [wallet, setWallet] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const setAuthData = (wallet: string, token: string) => {
    setWallet(wallet);
    setToken(token);
  };

  const clearAuth = () => {
    setWallet(null);
    setToken(null);
  };

  useEffect(() => {
    const cookieWallet = Cookies.get('erebrus_wallet');
    const cookieToken = Cookies.get('erebrus_token');

    if (cookieWallet && cookieToken) {
      setWallet(cookieWallet);
      setToken(cookieToken);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!wallet && !!token,
        wallet,
        token,
        setAuthData,
        clearAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
