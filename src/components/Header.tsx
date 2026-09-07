import React, { useState } from 'react';
import {
  ShoppingBag,
  Tv,
  ShieldCheck,
  Store,
  Clock,
  LogOut,
  LogIn,
  ChevronDown,
  UserCheck,
  AlertCircle,
  HelpCircle,
  Sparkles,
  PhoneCall,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useCart } from '../context/CartContext.js';
import { useApp } from '../context/AppContext.js';
import { formatCurrency, maskCpfCnpj } from '../utils/formatters.js';

export const Header: React.FC = () => {
  const { user, franchisee, role, logout, setQuickDemoUser, setIsAuthModalOpen } = useAuth();
  const { totalItemsCount, subtotal, setIsCartDrawerOpen, minimumRequired, isMinimumReached } = useCart();
  const { currentView, setCurrentView, settings } = useApp();
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-amber-500 text-slate-900 shadow-md border-b border-amber-600">
      {/* Top micro-bar: Franchisee info & fast persona switcher */}
      <div className="bg-amber-600 text-amber-950 text-xs px-4 py-1.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold uppercase tracking-wider bg-amber-700/30 text-white px-2 py-0.5 rounded text-[11px]">
            {role === 'admin' ? 'Painel Administrativo' : 'Portal do Franqueado'}
          </span>
          {franchisee && (
            <span className="hidden sm:inline-block font-medium text-amber-100">
              {franchisee.tradeName} • CNPJ/CPF: {maskCpfCnpj(franchisee.document)}
            </span>
          )}
        </div>

        {/* Quick Demo Switcher for fast evaluation */}
        <div className="relative flex items-center gap-1.5">
          <span className="text-amber-100 hidden md:inline">Simular perfil:</span>
          <button
            id="btn-demo-persona-dropdown"
            onClick={() => setShowPersonaMenu(!showPersonaMenu)}
            className="flex items-center gap-1 bg-amber-700/40 hover:bg-amber-700/60 text-white px-2 py-0.5 rounded text-xs transition"
            title="Alternar rapidamente entre perfis para testes das regras de negócio"
          >
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span className="font-medium">
              {role === 'admin'
                ? 'Admin BALBEC'
                : franchisee
                ? `${franchisee.tradeName.slice(0, 16)}... (Meta ${formatCurrency(franchisee.minimumOrderValue)})`
                : 'Visitante (Não autenticado)'}
            </span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {showPersonaMenu && (
            <div
              className="absolute right-0 top-7 w-72 bg-white rounded-lg shadow-2xl border border-slate-200 text-slate-800 p-2 z-50 animate-in fade-in zoom-in-95 duration-100"
              onMouseLeave={() => setShowPersonaMenu(false)}
            >
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                Simulação e Perfis de Teste
              </div>
              <button
                onClick={() => {
                  setQuickDemoUser('fran-500');
                  setCurrentView('store');
                  setShowPersonaMenu(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded hover:bg-amber-50 text-xs flex items-center justify-between group bg-amber-50/50 border border-amber-200/60 mb-1"
              >
                <div>
                  <div className="font-bold text-slate-900 group-hover:text-amber-800">
                    Cliente Franqueado (CNPJ)
                  </div>
                  <div className="text-[11px] text-slate-600 font-mono">12.345.678/0001-90 • Senha: 123456</div>
                  <div className="text-[10px] text-emerald-700 font-bold">Meta mínima: R$ 500,00</div>
                </div>
                <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              </button>

              <div className="border-t border-slate-100 my-1"></div>

              <button
                onClick={() => {
                  setCurrentView('admin');
                  setShowPersonaMenu(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded hover:bg-amber-50 text-xs flex items-center justify-between group"
              >
                <div>
                  <div className="font-semibold text-slate-900 group-hover:text-amber-700">Painel Administrativo</div>
                  <div className="text-[11px] text-slate-500">Requer usuário "admin" e senha</div>
                </div>
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
              </button>

              <button
                onClick={() => {
                  setQuickDemoUser('fran-300');
                  setCurrentView('store');
                  setShowPersonaMenu(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded hover:bg-amber-50 text-xs flex items-center justify-between group"
              >
                <div>
                  <div className="font-semibold text-slate-900 group-hover:text-amber-700">Café & Conv. Sul (CNPJ)</div>
                  <div className="text-[11px] text-emerald-700 font-medium">Meta mínima: R$ 300,00</div>
                </div>
                <UserCheck className="w-4 h-4 text-emerald-600" />
              </button>

              <button
                onClick={() => {
                  setQuickDemoUser('fran-1000');
                  setCurrentView('store');
                  setShowPersonaMenu(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded hover:bg-amber-50 text-xs flex items-center justify-between group"
              >
                <div>
                  <div className="font-semibold text-slate-900 group-hover:text-amber-700">Silva & Filhos (CPF)</div>
                  <div className="text-[11px] text-emerald-700 font-medium">Meta mínima: R$ 1.000,00</div>
                </div>
                <UserCheck className="w-4 h-4 text-emerald-600" />
              </button>

              <div className="border-t border-slate-100 my-1"></div>

              <button
                onClick={() => {
                  setQuickDemoUser('blocked');
                  setShowPersonaMenu(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded hover:bg-red-50 text-xs flex items-center justify-between group"
              >
                <div>
                  <div className="font-semibold text-red-700">Empório do Sabor (Bloqueado)</div>
                  <div className="text-[11px] text-red-500">Testa regra de bloqueio de login</div>
                </div>
                <AlertCircle className="w-4 h-4 text-red-600" />
              </button>

              <button
                onClick={() => {
                  setQuickDemoUser('inactive');
                  setShowPersonaMenu(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded hover:bg-orange-50 text-xs flex items-center justify-between group"
              >
                <div>
                  <div className="font-semibold text-orange-700">Quiosque Avenida (Inativo)</div>
                  <div className="text-[11px] text-orange-500">Testa regra de conta inativa</div>
                </div>
                <AlertCircle className="w-4 h-4 text-orange-600" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Logo & Brand Name */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('store')}>
          <div className="w-11 h-11 bg-slate-900 rounded-xl flex items-center justify-center shadow-md border-2 border-amber-300">
            <span className="text-xl font-black text-amber-400 tracking-tighter">B</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-black text-slate-950 tracking-tight">BALBEC</span>
              <span className="text-[11px] bg-red-600 text-white font-bold px-1.5 py-0.5 rounded">FRANQUIAS</span>
            </div>
            <p className="text-xs font-semibold text-slate-800 hidden sm:block">
              {settings?.companyName || 'Salgados Finos & Tradicionais'}
            </p>
          </div>
        </div>

        {/* View navigation buttons */}
        <div className="flex items-center gap-2">
          {/* Store / Compras button */}
          <button
            id="nav-btn-store"
            onClick={() => setCurrentView('store')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-xs sm:text-sm transition shadow-sm ${
              currentView === 'store'
                ? 'bg-slate-900 text-white ring-2 ring-slate-900'
                : 'bg-amber-400 hover:bg-amber-300 text-slate-900'
            }`}
          >
            <Store className="w-4 h-4" />
            <span className="hidden md:inline">Cardápio Franqueado</span>
            <span className="md:hidden">Cardápio</span>
          </button>

          {/* Orders History button */}
          {user && (
            <button
              id="nav-btn-orders"
              onClick={() => setCurrentView('orders')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-xs sm:text-sm transition shadow-sm ${
                currentView === 'orders'
                  ? 'bg-slate-900 text-white ring-2 ring-slate-900'
                  : 'bg-amber-400 hover:bg-amber-300 text-slate-900'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span className="hidden md:inline">Meus Pedidos</span>
              <span className="md:hidden">Pedidos</span>
            </button>
          )}

          {/* TV Withdrawal Board button */}
          <div className="flex items-center">
            <button
              id="nav-btn-tv"
              onClick={() => setCurrentView('tv')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-l-lg font-bold text-xs sm:text-sm transition shadow-sm ${
                currentView === 'tv'
                  ? 'bg-slate-900 text-white ring-2 ring-slate-900'
                  : 'bg-amber-600 hover:bg-amber-700 text-white'
              }`}
              title="Abrir painel de retirada na TV"
            >
              <Tv className="w-4 h-4" />
              <span className="hidden md:inline">Painel TV</span>
              <span className="md:hidden">TV</span>
            </button>
            <a
              href="/tv"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-amber-700 hover:bg-amber-800 text-amber-100 hover:text-white p-2 rounded-r-lg border-l border-amber-600/60 transition shadow-sm"
              title="Abrir Painel da TV em nova aba para Smart TV"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Cart Trigger with prominent RED badge and goal indicator */}
          {currentView === 'store' && (
            <button
              id="btn-open-cart"
              onClick={() => setIsCartDrawerOpen(true)}
              className="relative flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition shadow-md active:scale-95"
            >
              <ShoppingBag className="w-5 h-5" />
              <div className="text-left hidden sm:block">
                <div className="text-[11px] font-semibold text-red-100 uppercase leading-none">Carrinho</div>
                <div className="text-xs font-extrabold">{formatCurrency(subtotal)}</div>
              </div>
              {totalItemsCount > 0 && (
                <span className="bg-amber-400 text-slate-950 text-xs font-black px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow">
                  {totalItemsCount}
                </span>
              )}
            </button>
          )}

          {/* Auth Button */}
          {user ? (
            <button
              onClick={logout}
              className="p-2 rounded-lg hover:bg-amber-600 text-slate-900 transition"
              title={`Sair da conta (${user.name})`}
            >
              <LogOut className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-lg text-xs font-bold transition shadow"
            >
              <LogIn className="w-4 h-4 text-amber-400" />
              <span>Entrar</span>
            </button>
          )}
        </div>
      </div>

      {/* Persistent Goal Progress Banner for franchisee in store view */}
      {currentView === 'store' && franchisee && (
        <div className="bg-amber-100 border-t border-amber-300 px-4 py-2 text-xs">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">
                Meta mínima configurada: {formatCurrency(minimumRequired)}
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-700">
                Subtotal no carrinho: <strong className="text-slate-900">{formatCurrency(subtotal)}</strong>
              </span>
            </div>

            <div className="flex items-center gap-3">
              {isMinimumReached ? (
                <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  ✓ Valor mínimo atingido. Você pode finalizar seu pedido!
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-semibold text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full">
                  Faltam {formatCurrency(minimumRequired - subtotal)} para atingir o valor mínimo
                </span>
              )}
              <button
                onClick={() => setIsCartDrawerOpen(true)}
                className="text-amber-800 hover:text-amber-950 font-bold underline text-xs"
              >
                Ver Carrinho
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
