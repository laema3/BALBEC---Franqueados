/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { CartProvider } from './context/CartContext.js';
import { AppProvider, useApp } from './context/AppContext.js';
import { Header } from './components/Header.js';
import { FranchiseeStore } from './components/franchisee/FranchiseeStore.js';
import { CartDrawer } from './components/franchisee/CartDrawer.js';
import { CheckoutModal } from './components/franchisee/CheckoutModal.js';
import { OrdersHistoryModal } from './components/franchisee/OrdersHistoryModal.js';
import { AdminPanel } from './components/admin/AdminPanel.js';
import { TvPanel } from './components/tv/TvPanel.js';
import { TotemPanel } from './components/totem/TotemPanel.js';
import { LoginModal } from './components/auth/LoginModal.js';
import { ErrorBoundary } from './components/common/ErrorBoundary.js';
import { PrivacyModal } from './components/common/PrivacyModal.js';
import { Phone, Mail, MapPin, Bell, Cpu, ExternalLink, Settings, ShieldCheck } from 'lucide-react';

const MainContent: React.FC = () => {
  const { currentView, setCurrentView, settings, toastMessage } = useApp();
  const { role } = useAuth();
  const [isPrivacyOpen, setIsPrivacyOpen] = React.useState(false);

  // Fullscreen TV View for in-store pickup TV
  if (currentView === 'tv') {
    return <TvPanel onExit={() => setCurrentView('store')} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 bg-slate-900 text-amber-400 font-bold px-4 py-2.5 rounded-xl shadow-2xl text-xs border border-amber-500/30 animate-in slide-in-from-top duration-200">
          {toastMessage}
        </div>
      )}

      {/* Main Header with BALBEC Brand and Franchisee Status */}
      <Header />

      {/* View Switcher: Store vs Orders vs Admin */}
      <main className="flex-1">
        <ErrorBoundary fallbackTitle="Falha na exibição da tela">
          {currentView === 'store' && <FranchiseeStore />}
          {currentView === 'orders' && <OrdersHistoryModal />}
          {currentView === 'admin' && <AdminPanel />}
          {currentView === 'totem' && <TotemPanel onExit={() => setCurrentView('store')} />}
        </ErrorBoundary>
      </main>

      {/* Persistent Modals & Drawers */}
      <CartDrawer />
      <CheckoutModal />
      <LoginModal />

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 mt-12 border-t-4 border-amber-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs">
            {/* Brand column */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center font-black text-slate-950 text-base">
                  B
                </div>
                <span className="text-base font-black text-white tracking-tight">BALBEC</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Central de fornecimento e distribuição de salgados finos, assados e tradicionais para redes franqueadas.
              </p>
            </div>

            {/* Contact column */}
            <div className="space-y-2">
              <span className="font-bold text-white uppercase tracking-wider text-[11px] block">
                Atendimento Franquias
              </span>
              <div className="flex items-center gap-2 text-slate-400">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>{settings?.whatsapp || '(11) 98765-4321'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                <span>{settings?.email || 'pedidos@balbec.com.br'}</span>
              </div>
              <div className="flex items-start gap-2 text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  {settings?.address?.street}, {settings?.address?.number} - {settings?.address?.city}/{settings?.address?.state}
                </span>
              </div>
            </div>

            {/* Architecture Services Info */}
            <div className="space-y-2">
              <span className="font-bold text-white uppercase tracking-wider text-[11px] block">
                Serviços Conectados
              </span>
              <div className="flex items-center gap-2 text-slate-400">
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                <span>ntfy Push: <strong>{settings?.ntfy?.defaultTopic || 'Ativo'}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Cpu className="w-3.5 h-3.5 text-blue-400" />
                <span>ERP BlueFocus: <strong>Interface Pronta</strong></span>
              </div>
              <div className="text-[11px] text-slate-500 pt-1">
                Gateways de Pagamento: PIX Dinâmico, Cartão de Débito e Dinheiro na Retirada.
              </div>
            </div>

            {/* Quick links & TV call */}
            <div className="space-y-2">
              <span className="font-bold text-white uppercase tracking-wider text-[11px] block">
                Acesso Rápido
              </span>
              <div>
                <button
                  onClick={() => setCurrentView('tv')}
                  className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
                >
                  <span>Abrir Painel de Chamada para TV</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
              <div>
                <button
                  onClick={() => setCurrentView('orders')}
                  className="text-slate-400 hover:text-white"
                >
                  Histórico de Pedidos
                </button>
              </div>
              <div>
                <button
                  id="link-footer-admin"
                  onClick={() => setCurrentView('admin')}
                  className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1.5 transition group"
                >
                  <Settings className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-90 transition-transform duration-300" />
                  <span>Painel Administrativo</span>
                </button>
              </div>
              <div>
                <button
                  onClick={() => setIsPrivacyOpen(true)}
                  className="text-slate-400 hover:text-white flex items-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Política de Privacidade e Cookies</span>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
            <div>© {new Date().getFullYear()} BALBEC Salgados — Sistema Operacional de Franquias</div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsPrivacyOpen(true)}
                className="hover:text-slate-300 underline cursor-pointer"
              >
                Privacidade e Cookies
              </button>
              {/* Prominent Gear Icon button for Admin Access in Footer */}
              <button
                id="btn-footer-admin-gear"
                onClick={() => setCurrentView('admin')}
                title="Acessar Painel Administrativo (Requer Usuário e Senha)"
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 px-3.5 py-2 rounded-xl text-xs font-bold transition border border-slate-700 hover:border-amber-400 shadow-sm group cursor-pointer"
              >
                <Settings className="w-4 h-4 text-amber-400 group-hover:rotate-90 transition-transform duration-500" />
                <span>Acesso Painel Administrativo</span>
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Privacy & Cookies Policy Modal */}
      <PrivacyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppProvider>
          <MainContent />
        </AppProvider>
      </CartProvider>
    </AuthProvider>
  );
}

