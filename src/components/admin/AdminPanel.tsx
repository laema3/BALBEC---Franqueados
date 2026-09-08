import React, { useState } from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Tags,
  Cookie,
  Settings,
  Tv,
  Menu,
  X,
  Store,
  Lock,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  LogOut,
  ArrowLeft,
  Sparkles,
  UserCheck,
  Cpu,
  ExternalLink,
  Clock,
  Package,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { AdminDashboard } from './AdminDashboard.js';
import { OrdersManager } from './OrdersManager.js';
import { FranchiseesManager } from './FranchiseesManager.js';
import { CategoriesManager } from './CategoriesManager.js';
import { ProductsManager } from './ProductsManager.js';
import { SettingsManager } from './SettingsManager.js';
import { BlueFocusManager } from './BlueFocusManager.js';
import { StoreScheduleManager } from './StoreScheduleManager.js';
import { UsersManager } from './UsersManager.js';
import { ErrorBoundary } from '../common/ErrorBoundary.js';
import { useApp } from '../../context/AppContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { checkStoreStatus } from '../../utils/schedule.js';

type AdminTab = 'dashboard' | 'orders' | 'franchisees' | 'products' | 'categories' | 'schedule' | 'bluefocus' | 'settings' | 'users';

export const AdminPanel: React.FC = () => {
  const { setCurrentView, settings } = useApp();
  const { user, franchisee, login, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productsMenuOpen, setProductsMenuOpen] = useState(true);

  // Real-time store status helper
  const storeStatus = checkStoreStatus(settings?.storeSchedule);

  // Admin Login Gate State
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!adminUsername.trim() || !adminPassword.trim()) {
      setLoginError('Por favor, digite o usuário e a senha de administrador.');
      return;
    }

    setIsSubmitting(true);
    const result = await login(adminUsername.trim(), adminPassword.trim());
    setIsSubmitting(false);

    if (!result.success) {
      setLoginError(result.error || 'Credenciais de administrador inválidas.');
    }
  };

  const handleFillAdminCredentials = () => {
    setAdminUsername('admin');
    setAdminPassword('admin123');
    setLoginError(null);
  };

  // If the user is NOT authenticated as an administrator, show the Admin Login Gate
  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Header Banner */}
          <div className="bg-slate-900 text-white p-6 text-center relative border-b-4 border-amber-500">
            <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/20">
              <Lock className="w-7 h-7 text-slate-950" />
            </div>
            <h2 className="text-xl font-black tracking-tight text-white">Painel Administrativo</h2>
            <p className="text-xs text-amber-300 font-semibold mt-1">
              Acesso Restrito — Franqueadora BALBEC
            </p>
          </div>

          {/* Login Form */}
          <div className="p-6 space-y-5">
            {franchisee && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                <UserCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Perfil Atual: {franchisee.tradeName}</div>
                  <div className="text-[11px] text-amber-800">
                    Você está conectado como franqueado. Para acessar a gestão geral, informe o usuário e senha de administrador abaixo.
                  </div>
                </div>
              </div>
            )}

            {loginError && (
              <div className="p-3.5 bg-red-50 text-red-700 rounded-xl text-xs font-semibold border border-red-200 flex items-start gap-2.5 animate-in fade-in duration-150">
                <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>{loginError}</div>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Usuário de Administrador
                </label>
                <input
                  id="input-admin-user"
                  type="text"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder="admin"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Senha do Administrador
                </label>
                <input
                  id="input-admin-pass"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="admin123"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-medium"
                />
              </div>

              <button
                id="btn-submit-admin-login"
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-amber-400 font-black py-3 rounded-xl text-xs tracking-wider uppercase transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>{isSubmitting ? 'Validando acesso...' : 'Entrar no Painel Administrativo'}</span>
              </button>
            </form>

            {/* Official Admin Credentials Card for Quick Verification */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Credenciais de Acesso Admin</span>
                </div>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                  Oficial
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 font-mono text-xs text-slate-700 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Usuário:</span>
                  <span className="font-bold text-slate-900">admin</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Senha:</span>
                  <span className="font-bold text-slate-900">admin123</span>
                </div>
              </div>
              <button
                id="btn-autofill-admin"
                type="button"
                onClick={handleFillAdminCredentials}
                className="w-full text-center text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline py-1 cursor-pointer"
              >
                Preencher credenciais nos campos acima
              </button>
            </div>

            {/* Back to store */}
            <button
              type="button"
              onClick={() => setCurrentView('store')}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 py-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar para o Cardápio de Salgados</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSelectTab = (tab: AdminTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const isProductsActive = activeTab === 'products' || activeTab === 'categories';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Mobile Toggle Button */}
      <div className="md:hidden mb-4 flex items-center justify-between bg-white p-3 rounded-2xl border border-amber-200 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Menu Admin:</span>
          <span className="text-sm font-black text-slate-900 capitalize">
            {activeTab === 'products'
              ? 'Produtos'
              : activeTab === 'categories'
              ? 'Categorias'
              : activeTab === 'schedule'
              ? 'Dias e Horários'
              : activeTab}
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl bg-amber-500 text-slate-950 font-bold flex items-center gap-1.5 text-xs shadow-xs"
        >
          {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          <span>Opções</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row items-start gap-6">
        {/* Vertical Left Sidebar */}
        <aside
          className={`${
            mobileMenuOpen ? 'block' : 'hidden'
          } md:block w-full md:w-64 shrink-0 bg-white rounded-2xl border border-slate-200 shadow-xs p-3 space-y-1.5 md:sticky md:top-24`}
        >
          <div className="px-3 py-2 border-b border-slate-100 mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Painel Administrativo
            </span>
            <h3 className="text-sm font-black text-slate-900 mt-0.5">Gestão BALBEC</h3>
            <div className="flex items-center justify-between text-[11px] text-emerald-700 font-bold mt-1 bg-emerald-50 px-2 py-0.5 rounded-md">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Admin Ativo</span>
              </div>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded font-black uppercase ${
                  storeStatus.isOpen ? 'bg-emerald-200 text-emerald-900' : 'bg-red-100 text-red-800'
                }`}
              >
                {storeStatus.isOpen ? 'Loja Aberta' : 'Loja Fechada'}
              </span>
            </div>
          </div>

          <nav className="space-y-1">
            {/* Dashboard Geral */}
            <button
              id="admin-tab-dashboard"
              onClick={() => handleSelectTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-amber-500 text-slate-950 shadow-xs ring-1 ring-amber-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className={`w-4 h-4 shrink-0 ${activeTab === 'dashboard' ? 'text-slate-950' : 'text-slate-400'}`} />
              <span className="flex-1">Dashboard Geral</span>
            </button>

            {/* Pedidos */}
            <button
              id="admin-tab-orders"
              onClick={() => handleSelectTab('orders')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-amber-500 text-slate-950 shadow-xs ring-1 ring-amber-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <ClipboardList className={`w-4 h-4 shrink-0 ${activeTab === 'orders' ? 'text-slate-950' : 'text-slate-400'}`} />
              <span className="flex-1">Pedidos</span>
            </button>

            {/* Franqueados */}
            <button
              id="admin-tab-franchisees"
              onClick={() => handleSelectTab('franchisees')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                activeTab === 'franchisees'
                  ? 'bg-amber-500 text-slate-950 shadow-xs ring-1 ring-amber-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Users className={`w-4 h-4 shrink-0 ${activeTab === 'franchisees' ? 'text-slate-950' : 'text-slate-400'}`} />
              <span className="flex-1">Franqueados</span>
            </button>

            {/* Produtos */}
            <button
              id="admin-tab-products"
              onClick={() => handleSelectTab('products')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                activeTab === 'products'
                  ? 'bg-amber-500 text-slate-950 shadow-xs ring-1 ring-amber-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Cookie className={`w-4 h-4 shrink-0 ${activeTab === 'products' ? 'text-slate-950' : 'text-slate-400'}`} />
              <span className="flex-1">Produtos</span>
            </button>

            {/* Categorias */}
            <button
              id="admin-tab-categories"
              onClick={() => handleSelectTab('categories')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                activeTab === 'categories'
                  ? 'bg-amber-500 text-slate-950 shadow-xs ring-1 ring-amber-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Tags className={`w-4 h-4 shrink-0 ${activeTab === 'categories' ? 'text-slate-950' : 'text-slate-400'}`} />
              <span className="flex-1">Categorias</span>
            </button>

            {/* Dias e Horários de Funcionamento (Abre/Fecha Loja) */}
            <button
              id="admin-tab-schedule"
              onClick={() => handleSelectTab('schedule')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                activeTab === 'schedule'
                  ? 'bg-amber-500 text-slate-950 shadow-xs ring-1 ring-amber-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Clock className={`w-4 h-4 shrink-0 ${activeTab === 'schedule' ? 'text-slate-950' : 'text-slate-400'}`} />
              <span className="flex-1">Dias e Horários</span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                  storeStatus.isOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {storeStatus.isOpen ? 'Aberta' : 'Fechada'}
              </span>
            </button>

            {/* Integração BlueFocus */}
            <button
              id="admin-tab-bluefocus"
              onClick={() => handleSelectTab('bluefocus')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                activeTab === 'bluefocus'
                  ? 'bg-amber-500 text-slate-950 shadow-xs ring-1 ring-amber-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Cpu className={`w-4 h-4 shrink-0 ${activeTab === 'bluefocus' ? 'text-slate-950' : 'text-slate-400'}`} />
              <span className="flex-1">Integração BlueFocus</span>
            </button>

            {/* Configurações */}
            <button
              id="admin-tab-settings"
              onClick={() => handleSelectTab('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-amber-500 text-slate-950 shadow-xs ring-1 ring-amber-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Settings className={`w-4 h-4 shrink-0 ${activeTab === 'settings' ? 'text-slate-950' : 'text-slate-400'}`} />
              <span className="flex-1">Configurações</span>
            </button>

            {/* Usuários (Disponível apenas para usuários master / admin) */}
            {user?.role === 'admin' && (
              <button
                id="admin-tab-users"
                onClick={() => handleSelectTab('users')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                  activeTab === 'users'
                    ? 'bg-amber-500 text-slate-950 shadow-xs ring-1 ring-amber-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Users className={`w-4 h-4 shrink-0 ${activeTab === 'users' ? 'text-slate-950' : 'text-slate-400'}`} />
                <span className="flex-1">Usuários Master</span>
              </button>
            )}
          </nav>

          {/* Quick Action Buttons & Logout in Sidebar */}
          <div className="pt-4 mt-4 border-t border-slate-100 space-y-2">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentView('tv')}
                className="flex-1 flex items-center justify-start gap-2 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold px-3 py-2.5 rounded-l-xl text-xs transition border border-slate-800 shadow-xs cursor-pointer"
                title="Abrir Painel de TV nesta aba"
              >
                <Tv className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Painel TV</span>
              </button>
              <a
                href="/tv"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 bg-slate-950 hover:bg-slate-900 text-amber-400 rounded-r-xl border border-l-0 border-slate-800 transition"
                title="Abrir TV em nova aba para colocar na Smart TV"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <button
              onClick={() => setCurrentView('store')}
              className="w-full flex items-center justify-start gap-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-2 rounded-xl text-xs transition cursor-pointer"
            >
              <Store className="w-4 h-4 shrink-0 text-slate-500" />
              <span>Ver Cardápio Franqueado</span>
            </button>

            <button
              id="btn-logout-admin-panel"
              onClick={() => {
                logout();
                setCurrentView('store');
              }}
              className="w-full flex items-center justify-start gap-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold px-3 py-2 rounded-xl text-xs transition border border-red-200 cursor-pointer"
            >
              <LogOut className="w-4 h-4 shrink-0 text-red-600" />
              <span>Sair do Painel Admin</span>
            </button>
          </div>
        </aside>

        {/* Right Main Content Stage */}
        <main className="flex-1 min-w-0 w-full">
          <ErrorBoundary fallbackTitle="Falha ao carregar seção administrativa">
            {activeTab === 'dashboard' && <AdminDashboard onNavigateToOrders={() => setActiveTab('orders')} />}
            {activeTab === 'orders' && <OrdersManager />}
            {activeTab === 'franchisees' && <FranchiseesManager />}
            {activeTab === 'products' && <ProductsManager />}
            {activeTab === 'categories' && <CategoriesManager />}
            {activeTab === 'schedule' && <StoreScheduleManager />}
            {activeTab === 'bluefocus' && <BlueFocusManager />}
            {activeTab === 'settings' && <SettingsManager />}
            {activeTab === 'users' && <UsersManager />}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};
