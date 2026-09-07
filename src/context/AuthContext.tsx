import React, { createContext, useContext, useState, useEffect } from 'react';
import { Franchisee, User } from '../types.js';

interface AuthContextType {
  user: User | null;
  franchisee: Franchisee | null;
  role: 'admin' | 'franchisee' | 'guest';
  token: string | null;
  login: (documentOrLogin: string, password?: string) => Promise<{ success: boolean; error?: string; status?: string }>;
  logout: () => void;
  setQuickDemoUser: (persona: 'admin' | 'fran-500' | 'fran-300' | 'fran-1000' | 'blocked' | 'inactive') => Promise<void>;
  updateCurrentFranchisee: (updated: Franchisee) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'balbec_auth_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [franchisee, setFranchisee] = useState<Franchisee | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  useEffect(() => {
    // Restore saved session if exists
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setUser(parsed.user);
        setFranchisee(parsed.franchisee || null);
        setToken(parsed.token || null);
      }
    } catch {
      // fallback
    }
  }, []);

  const saveSession = (u: User, f: Franchisee | null, t: string) => {
    setUser(u);
    setFranchisee(f);
    setToken(t);
    localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify({ user: u, franchisee: f, token: t })
    );
  };

  const login = async (documentOrLogin: string, password = '123456'): Promise<{ success: boolean; error?: string; status?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentOrLogin, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return {
          success: false,
          error: data.error || 'Falha ao autenticar.',
          status: data.status,
        };
      }

      saveSession(data.user, data.user.franchisee || null, data.token);
      setIsAuthModalOpen(false);
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: 'Erro de conexão com o servidor BALBEC. Tente novamente.',
      };
    }
  };

  const logout = () => {
    setUser(null);
    setFranchisee(null);
    setToken(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  const updateCurrentFranchisee = (updated: Franchisee) => {
    setFranchisee(updated);
    if (user) {
      const updatedUser = { ...user, franchisee: updated };
      setUser(updatedUser);
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({ user: updatedUser, franchisee: updated, token })
      );
    }
  };

  const setQuickDemoUser = async (persona: 'admin' | 'fran-500' | 'fran-300' | 'fran-1000' | 'blocked' | 'inactive') => {
    switch (persona) {
      case 'admin':
        await login('admin', 'admin123');
        break;
      case 'fran-500':
        // 12.345.678/0001-90
        await login('12.345.678/0001-90', '123456');
        break;
      case 'fran-300':
        // 98.765.432/0001-10
        await login('98.765.432/0001-10', '123456');
        break;
      case 'fran-1000':
        // 123.456.789-00
        await login('123.456.789-00', '123456');
        break;
      case 'blocked':
        // 11.222.333/0001-44
        await login('11.222.333/0001-44', '123456');
        break;
      case 'inactive':
        // 444.555.666-77
        await login('444.555.666-77', '123456');
        break;
    }
  };

  const role: 'admin' | 'franchisee' | 'guest' = user ? user.role : 'guest';

  return (
    <AuthContext.Provider
      value={{
        user,
        franchisee,
        role,
        token,
        login,
        logout,
        setQuickDemoUser,
        updateCurrentFranchisee,
        isAuthModalOpen,
        setIsAuthModalOpen,
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
