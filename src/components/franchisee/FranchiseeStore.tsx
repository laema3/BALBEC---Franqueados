import React, { useState, useEffect, useMemo } from 'react';
import { Search, ShoppingBag, Plus, Minus, Tag, Check, AlertCircle, Lock, ShieldAlert, KeyRound, UserCheck, Sparkles, Package, Image as ImageIcon, Clock } from 'lucide-react';
import { Category, Product } from '../../types.js';
import { useCart } from '../../context/CartContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { useApp } from '../../context/AppContext.js';
import { formatCurrency, maskCpfCnpj } from '../../utils/formatters.js';
import { checkStoreStatus } from '../../utils/schedule.js';
import { DownloadAppBanner } from './DownloadAppBanner.js';

export const FranchiseeStore: React.FC = () => {
  const { addItem, items, updateQuantity, setIsCartDrawerOpen } = useCart();
  const { franchisee, user, setIsAuthModalOpen, login, setQuickDemoUser } = useAuth();
  const { settings } = useApp();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [addedAnimationId, setAddedAnimationId] = useState<string | null>(null);

  const storeStatus = checkStoreStatus(settings?.storeSchedule);

  // In-page login state for unauthenticated franchisee access
  const [docInput, setDocInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginErrorType, setLoginErrorType] = useState<string | null>(null);

  const handleInPageLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docInput.trim()) {
      setLoginError('Informe o CPF ou CNPJ cadastrado.');
      return;
    }
    if (!passwordInput) {
      setLoginError('Informe a senha de acesso.');
      return;
    }

    setLoginLoading(true);
    setLoginError(null);
    setLoginErrorType(null);

    const res = await login(docInput, passwordInput);
    setLoginLoading(false);

    if (!res.success) {
      setLoginError(res.error || 'Falha ao autenticar.');
      setLoginErrorType(res.status || 'invalid');
    }
  };

  // Fetch active categories and products
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [catsRes, prodsRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/products'),
        ]);

        if (catsRes.ok && prodsRes.ok) {
          const catsData = await catsRes.json();
          const prodsData = await prodsRes.json();
          setCategories(catsData);
          setProducts(prodsData);
        }
      } catch (err) {
        console.error('Error fetching catalog:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const matchesCategory = selectedCategory === 'all' || prod.categoryId === selectedCategory;
      const matchesSearch =
        prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prod.internalCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prod.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Map of quantities in cart
  const cartQuantities = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach((item) => {
      map[item.product.id] = item.quantity;
    });
    return map;
  }, [items]);

  const handleAddToCart = (product: Product) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    addItem(product, 1);
    setAddedAnimationId(product.id);
    setTimeout(() => setAddedAnimationId(null), 1000);
  };

  // If not logged in, show the Login Gate asking for username and password
  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl shadow-xl border border-amber-200 overflow-hidden">
          {/* Header */}
          <div className="bg-amber-500 p-6 text-slate-950 text-center">
            <div className="w-14 h-14 bg-slate-900 text-amber-400 rounded-2xl flex items-center justify-center font-black text-2xl mx-auto mb-3 border-2 border-amber-300 shadow-md">
              B
            </div>
            <h2 className="text-xl font-black tracking-tight">Portal do Franqueado BALBEC</h2>
            <p className="text-xs font-semibold text-slate-900 mt-1">
              Informe seu usuário (CPF ou CNPJ) e senha para acessar o cardápio e fazer pedidos.
            </p>
          </div>

          <div className="p-6 space-y-5">
            {loginError && (
              <div
                className={`p-4 rounded-2xl text-xs font-medium flex items-start gap-2.5 border ${
                  loginErrorType === 'blocked'
                    ? 'bg-red-50 text-red-800 border-red-300'
                    : loginErrorType === 'inactive'
                    ? 'bg-orange-50 text-orange-800 border-orange-300'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}
              >
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <div>
                  <div className="font-bold">
                    {loginErrorType === 'blocked'
                      ? 'Acesso Bloqueado'
                      : loginErrorType === 'inactive'
                      ? 'Cadastro Inativo'
                      : 'Falha no Acesso'}
                  </div>
                  <div>{loginError}</div>
                </div>
              </div>
            )}

            <form onSubmit={handleInPageLogin} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">CPF ou CNPJ Cadastrado</label>
                <input
                  type="text"
                  required
                  value={docInput}
                  onChange={(e) => setDocInput(maskCpfCnpj(e.target.value))}
                  placeholder="00.000.000/0000-00 ou 000.000.000-00"
                  className="w-full p-3 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Senha de Acesso</label>
                  <button
                    type="button"
                    onClick={() => setIsAuthModalOpen(true)}
                    className="text-amber-700 hover:text-amber-900 text-[11px] font-bold"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Digite sua senha (padrão: 123456)"
                  className="w-full p-3 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>

              <button
                id="btn-login-franchisee"
                type="submit"
                disabled={loginLoading}
                className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-md transition cursor-pointer"
              >
                {loginLoading ? 'Entrando...' : 'Entrar no Sistema'}
              </button>
            </form>

            {/* Featured Simulation Customer Card (Franqueado com CNPJ) */}
            <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-black text-xs text-amber-950">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Simular Cliente Comprando (Franqueado)</span>
                </div>
                <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                  Pronto para Teste
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                Utilize o CNPJ e a senha abaixo para acessar o cardápio exclusivo, adicionar salgados e testar a trava de meta mínima de pedido:
              </p>
              <div className="bg-white p-3 rounded-xl border border-amber-200 font-mono text-xs space-y-1 text-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">CNPJ:</span>
                  <strong className="text-slate-950 font-bold">12.345.678/0001-90</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Senha:</span>
                  <strong className="text-slate-950 font-bold">123456</strong>
                </div>
                <div className="flex justify-between text-[11px] font-sans pt-1 border-t border-slate-100">
                  <span className="text-slate-500">Meta Mínima:</span>
                  <span className="text-emerald-700 font-bold">R$ 500,00</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setDocInput('12.345.678/0001-90');
                    setPasswordInput('123456');
                    setLoginError(null);
                  }}
                  className="flex-1 py-2 px-3 bg-white hover:bg-amber-100 text-amber-900 font-bold rounded-xl border border-amber-300 text-xs transition cursor-pointer"
                >
                  Preencher Campos
                </button>
                <button
                  id="btn-autologin-simulation-customer"
                  type="button"
                  onClick={() => setQuickDemoUser('fran-500')}
                  className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition shadow-xs cursor-pointer"
                >
                  Entrar Direto (1 Clique)
                </button>
              </div>
            </div>

            {/* Other Test Personas */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center">
                Outros perfis cadastrados para validação de regras:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setQuickDemoUser('fran-300')}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-left transition text-[11px] cursor-pointer"
                >
                  <div className="font-bold text-slate-900">Cafeteria Sul (CNPJ)</div>
                  <div className="text-emerald-700 font-medium">Meta: R$ 300 • CNPJ Ativo</div>
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDemoUser('inactive')}
                  className="p-2.5 rounded-xl border border-orange-200 hover:bg-orange-50 text-left transition text-[11px] cursor-pointer"
                >
                  <div className="font-bold text-orange-900">Quiosque Avenida</div>
                  <div className="text-orange-700 font-medium">Teste: Conta Inativa</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Download App Banner (Only on Website, not on Totem) */}
      <DownloadAppBanner />

      {/* Operating Schedule Notice Banner if Store is Closed */}
      {!storeStatus.isOpen && (
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white p-4 rounded-2xl shadow-sm border border-red-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white/20 rounded-xl shrink-0 mt-0.5">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider bg-white text-red-700 px-2 py-0.5 rounded-full">
                  Loja Fechada no Momento
                </span>
                <span className="text-xs font-semibold text-red-100">
                  {storeStatus.statusDescription}
                </span>
              </div>
              <p className="text-xs text-red-50 mt-1 leading-relaxed">
                {settings?.storeSchedule?.closedMessage ||
                  'Nossa fábrica está fora do horário de atendimento. Você ainda pode consultar o cardápio e os valores dos salgados.'}
              </p>
            </div>
          </div>
          {settings?.storeSchedule?.blockOrdersWhenClosed && (
            <span className="text-[11px] font-bold bg-black/30 px-3 py-1.5 rounded-xl border border-white/20 shrink-0 self-end sm:self-center">
              Envio de pedidos bloqueado
            </span>
          )}
        </div>
      )}

      {/* Category Pills & Search Bar (Sticky on Scroll) */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md shadow-md py-3 px-4 rounded-2xl border border-amber-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Category horizontal scroll list */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            id="cat-tab-all"
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition shadow-xs ${
              selectedCategory === 'all'
                ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-500'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Todos os Produtos ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              id={`cat-tab-${cat.id}`}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition shadow-xs ${
                selectedCategory === cat.id
                  ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-500'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <input
            id="input-search-catalog"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome ou código..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Catalog Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-bold text-slate-600">Carregando salgados e produtos BALBEC...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <Tag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Nenhum produto encontrado</h3>
          <p className="text-xs text-slate-500 mt-1">Tente selecionar outra categoria ou ajustar a busca.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredProducts.map((product) => {
            const inCartQty = cartQuantities[product.id] || 0;
            const isJustAdded = addedAnimationId === product.id;

            return (
              <div
                key={product.id}
                id={`card-product-${product.id}`}
                className="bg-white rounded-2xl border border-amber-100/80 shadow-xs hover:shadow-md transition flex flex-col overflow-hidden group"
              >
                {/* Product Image */}
                <div className="relative h-48 bg-slate-100 overflow-hidden flex items-center justify-center">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-50/40 via-slate-50 to-slate-100 text-slate-400 p-4 select-none">
                      <div className="w-12 h-12 rounded-2xl bg-amber-100/80 border border-amber-200/60 flex items-center justify-center mb-2 text-amber-700 shadow-xs">
                        <Package className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold text-slate-700 text-center line-clamp-1 px-2">{product.name}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5 font-medium">Sem foto</span>
                    </div>
                  )}
                  {/* Internal Code Badge */}
                  <span className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-amber-400 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md">
                    {product.internalCode}
                  </span>

                  {inCartQty > 0 && (
                    <span className="absolute top-2 right-2 bg-red-600 text-white font-black text-xs px-2.5 py-1 rounded-full shadow-md">
                      {inCartQty} no carrinho
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-slate-500 text-xs mt-1.5 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                        Preço Unitário
                      </span>
                      <span className="text-lg font-black text-slate-900">
                        {formatCurrency(product.price)}
                      </span>
                    </div>

                    {/* RED "ADICIONAR" button or Quantity Steppers */}
                    {inCartQty === 0 ? (
                      <button
                        id={`btn-add-${product.id}`}
                        onClick={() => handleAddToCart(product)}
                        className={`bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase px-4 py-2 rounded-xl transition shadow-md active:scale-95 flex items-center gap-1.5 ${
                          isJustAdded ? 'bg-emerald-600 ring-2 ring-emerald-400' : ''
                        }`}
                      >
                        {isJustAdded ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Adicionado</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            <span>ADICIONAR</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded-xl p-0.5">
                        <button
                          onClick={() => updateQuantity(product.id, inCartQty - 1)}
                          className="w-7 h-7 rounded-lg bg-white text-red-600 font-bold flex items-center justify-center hover:bg-red-100 transition"
                          title="Diminuir quantidade"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-black text-slate-900">
                          {inCartQty}
                        </span>
                        <button
                          onClick={() => updateQuantity(product.id, inCartQty + 1)}
                          className="w-7 h-7 rounded-lg bg-red-600 text-white font-bold flex items-center justify-center hover:bg-red-700 transition"
                          title="Aumentar quantidade"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
