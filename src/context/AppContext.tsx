import React, { createContext, useContext, useState, useEffect } from 'react';
import { CompanySettings } from '../types.js';

interface AppContextType {
  settings: CompanySettings | null;
  loadingSettings: boolean;
  refreshSettings: () => Promise<void>;
  currentView: 'store' | 'admin' | 'tv' | 'orders';
  setCurrentView: (view: 'store' | 'admin' | 'tv' | 'orders') => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const defaultSettings: CompanySettings = {
  companyName: 'BALBEC Salgados',
  logoUrl: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=160&auto=format&fit=crop&q=80',
  whatsapp: '(11) 98765-4321',
  phone: '(11) 3456-7890',
  email: 'pedidos@balbec.com.br',
  address: {
    street: 'Avenida das Indústrias',
    number: '1500',
    neighborhood: 'Distrito Industrial',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '04571-000',
  },
  visual: {
    primaryColor: '#F59E0B',
    secondaryColor: '#D97706',
    buttonColor: '#DC2626',
    textColor: '#1F2937',
    highlightColor: '#EF4444',
  },
  ntfy: {
    serverUrl: 'https://ntfy.sh',
    defaultTopic: 'balbec_pedidos_notificacoes',
    enabled: true,
  },
  blueFocus: {
    apiUrl: 'http://localhost:8080/api/bluefocus',
    apiKey: '',
    enabled: false,
    syncMode: 'manual',
  },
  tvPanel: {
    alertSoundEnabled: true,
    autoDismissMinutes: 60,
    fontSize: 'large',
  },
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<CompanySettings | null>(defaultSettings);
  const [loadingSettings, setLoadingSettings] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<'store' | 'admin' | 'tv' | 'orders'>('store');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const refreshSettings = async () => {
    try {
      setLoadingSettings(true);
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.warn('Failed to load settings:', err);
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  return (
    <AppContext.Provider
      value={{
        settings,
        loadingSettings,
        refreshSettings,
        currentView,
        setCurrentView,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
