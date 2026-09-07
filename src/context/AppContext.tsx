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
  getTvUrl: () => string;
}

const parseViewFromLocation = (): 'store' | 'admin' | 'tv' | 'orders' => {
  if (typeof window === 'undefined') return 'store';
  const path = window.location.pathname.toLowerCase();
  const search = new URLSearchParams(window.location.search);
  const hash = window.location.hash.toLowerCase();

  if (path === '/tv' || path.startsWith('/tv/') || search.get('view') === 'tv' || hash === '#/tv' || hash === '#tv') {
    return 'tv';
  }
  if (path === '/admin' || path.startsWith('/admin/') || search.get('view') === 'admin' || hash === '#/admin' || hash === '#admin') {
    return 'admin';
  }
  if (path === '/orders' || path.startsWith('/orders/') || search.get('view') === 'orders' || hash === '#/orders') {
    return 'orders';
  }
  return 'store';
};

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
    apiUrl: 'https://www.app.bluefocus.com.br/BlueFocusCloud',
    apiKey: 'c89f2aab-5aa6-451d-8da8-06709422d3da',
    enabled: true,
    syncMode: 'automatic',
    autentica: 'c89f2aab-5aa6-451d-8da8-06709422d3da',
    empresaId: 'EMPRESATESTE',
    usuarioId: 'CAIXA',
    pdvCodigo: 2,
    serverEnvironment: 'cloud',
    localServerUrl: 'http://localhost:8082',
    importProductsUrl: 'https://www.app.bluefocus.com.br/BlueFocusCloud/servlet/aintegracaofcxexportacadsat?wsdl',
    queryStockUrl: 'https://www.app.bluefocus.com.br/BlueFocusCloud/aintegracaofcxconsultaqtde?wsdl',
    exportSalesUrl: 'https://www.app.bluefocus.com.br/BlueFocusCloud/servlet/aintegracaofcxregprevendasat?wsdl',
    defaultUpdateType: 'C',
    autoExportOrders: true,
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
  const [currentView, setCurrentViewState] = useState<'store' | 'admin' | 'tv' | 'orders'>(() => parseViewFromLocation());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const setCurrentView = (view: 'store' | 'admin' | 'tv' | 'orders') => {
    setCurrentViewState(view);
    if (typeof window !== 'undefined') {
      let targetPath = '/';
      if (view === 'tv') targetPath = '/tv';
      else if (view === 'admin') targetPath = '/admin';
      else if (view === 'orders') targetPath = '/orders';

      if (window.location.pathname !== targetPath) {
        window.history.pushState({ view }, '', targetPath);
      }
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentViewState(parseViewFromLocation());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const getTvUrl = (): string => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/tv`;
    }
    return '/tv';
  };

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
        getTvUrl,
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
