import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingBag, Search, Plus, Minus, Check, ArrowLeft, Printer, Sparkles, X, CreditCard, QrCode, DollarSign } from 'lucide-react';
import { Category, Product, Order, PaymentMethod } from '../../types.js';
import { formatCurrency } from '../../utils/formatters.js';
import { printOrderReceipt } from '../../utils/printReceipt.js';
import { playNewOrderSound } from '../../utils/sound.js';

interface TotemPanelProps {
  onExit: () => void;
}

export const TotemPanel: React.FC<TotemPanelProps> = ({ onExit }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Cart state for Totem
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [isCheckoutStep, setIsCheckoutStep] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerDoc, setCustomerDoc] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [submitting, setSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setLoading(true);
        const [catsRes, prodsRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/products'),
        ]);
        if (catsRes.ok && prodsRes.ok) {
          setCategories(await catsRes.json());
          setProducts(await prodsRes.json());
        }
      } catch (err) {
        console.error('Error loading totem catalog:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (p.status !== 'active') return false;
      const matchesCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.internalCode.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const cartTotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  }, [cart]);

  const cartItemCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as { product: Product; quantity: number }[];
    });
  };

  const handleFinishOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!customerName.trim()) {
      alert('Por favor, informe seu Nome.');
      return;
    }

    setSubmitting(true);
    try {
      const orderPayload = {
        franchiseeId: 'totem-kiosk',
        franchiseeName: `TOTEM: ${customerName}`,
        franchiseeDocument: customerDoc || '000.000.000-00',
        franchiseePhone: customerPhone || '(11) 90000-0000',
        items: cart.map((i) => ({
          productId: i.product.id,
          productName: i.product.name,
          unitPrice: i.product.price,
          quantity: i.quantity,
          subtotal: i.product.price * i.quantity,
          internalCode: i.product.internalCode,
        })),
        subtotal: cartTotal,
        discount: 0,
        total: cartTotal,
        paymentMethod,
        paymentStatus: paymentMethod === 'cash_on_pickup' ? 'pending' : 'approved',
        orderStatus: 'RECEBIDO',
        estimatedPickupTime: 'Aproximadamente 15 a 20 minutos',
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      if (res.ok) {
        const newOrder: Order = await res.json();
        setCompletedOrder(newOrder);
        playNewOrderSound();
        // Print 2 thermal copies automatically
        printOrderReceipt(newOrder, 'totem');
      } else {
        alert('Erro ao registrar pedido no totem.');
      }
    } catch (err) {
      console.error('Error submitting totem order:', err);
      alert('Erro de conexão ao processar pedido.');
    } finally {
      setSubmitting(false);
    }
  };

  if (completedOrder) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-24 h-24 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl animate-bounce">
          <Check className="w-12 h-12 stroke-[3]" />
        </div>
        <span className="text-amber-400 font-bold uppercase tracking-widest text-xs mb-1">Pedido Registrado com Sucesso!</span>
        <h1 className="text-4xl sm:text-6xl font-black text-white mb-2">
          Pedido #{completedOrder.orderNumber}
        </h1>
        <p className="text-slate-300 text-base max-w-md mx-auto mb-8">
          Sua via e a via de controle interno foram enviadas para a impressora térmica. Dirija-se ao balcão para pagamento/retirada.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={() => printOrderReceipt(completedOrder, 'totem')}
            className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-base transition border border-amber-500/30 cursor-pointer shadow-lg"
          >
            <Printer className="w-6 h-6" />
            <span>Imprimir Comprovante Novamente</span>
          </button>
          <button
            onClick={() => {
              setCompletedOrder(null);
              setCart([]);
              setIsCheckoutStep(false);
              setCustomerName('');
              setCustomerPhone('');
              setCustomerDoc('');
            }}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-lg transition shadow-xl cursor-pointer"
          >
            <span>Novo Pedido (Totem)</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-100 text-slate-900 flex flex-col font-sans select-none overflow-hidden">
      {/* Totem Header Bar */}
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b-4 border-amber-500 shadow-lg shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-500 text-slate-950 font-black text-xl rounded-2xl flex items-center justify-center shadow">
            B
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-white">BALBEC TOTEM KIOSK</h1>
              <span className="bg-amber-500/20 text-amber-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase border border-amber-500/30">
                Autoatendimento
              </span>
            </div>
            <p className="text-xs text-slate-400">Toque na tela para escolher seus salgados favoritos</p>
          </div>
        </div>

        <button
          onClick={onExit}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs transition border border-slate-700 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Sair do Totem</span>
        </button>
      </header>

      {/* Main Totem Body */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden h-full">
        {/* Left / Main Catalog Area */}
        <div className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-6 space-y-4 h-full">
          {/* Categories & Search Sticky Header */}
          <div className="sticky top-0 z-30 bg-slate-100/95 backdrop-blur-md py-3 space-y-3 -mx-4 px-4 sm:-mx-6 sm:px-6 border-b border-slate-200 shadow-xs">
            {/* Categories Horizontal Scroll */}
            <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-5 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition cursor-pointer shadow-sm ${
                  selectedCategory === 'all'
                    ? 'bg-amber-500 text-slate-950 font-black ring-4 ring-amber-300'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                Todos os Produtos ({products.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-5 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition cursor-pointer shadow-sm ${
                    selectedCategory === cat.id
                      ? 'bg-amber-500 text-slate-950 font-black ring-4 ring-amber-300'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Search bar */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar salgado por nome ou código..."
                className="w-full pl-11 pr-4 py-3 text-sm rounded-2xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs font-medium"
              />
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="py-20 text-center">
              <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm font-bold text-slate-600">Carregando cardápio do totem...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 my-auto">
              <h3 className="text-lg font-bold text-slate-800">Nenhum produto encontrado</h3>
              <p className="text-xs text-slate-500 mt-1">Tente selecionar outra categoria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 pb-12">
              {filteredProducts.map((product) => {
                const cartItem = cart.find((i) => i.product.id === product.id);
                const qty = cartItem ? cartItem.quantity : 0;

                return (
                  <div
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-200 p-4 flex flex-col justify-between cursor-pointer group active:scale-95"
                  >
                    <div>
                      <div className="relative h-40 bg-slate-100 rounded-2xl overflow-hidden mb-3 flex items-center justify-center">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        ) : (
                          <span className="text-xs font-bold text-slate-400">BALBEC</span>
                        )}
                        <span className="absolute top-2 left-2 bg-slate-900/90 text-amber-400 font-mono text-[11px] font-bold px-2 py-0.5 rounded-md">
                          {product.internalCode}
                        </span>
                        {qty > 0 && (
                          <span className="absolute top-2 right-2 bg-red-600 text-white font-black text-xs w-7 h-7 rounded-full flex items-center justify-center shadow-md animate-pulse">
                            {qty}
                          </span>
                        )}
                      </div>
                      <h3 className="font-black text-sm text-slate-900 leading-snug line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{product.description}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-base font-black text-slate-900">{formatCurrency(product.price)}</span>
                      <button
                        type="button"
                        className="px-3 py-2 rounded-xl bg-red-600 group-hover:bg-red-700 text-white font-black text-xs shadow transition flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right / Cart Summary Area (Fixed / Sticky on screen) */}
        <div className="w-full lg:w-96 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col h-full shadow-2xl shrink-0">
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
              <h2 className="font-black text-sm">Seu Pedido no Totem</h2>
            </div>
            <span className="bg-amber-500 text-slate-950 font-black text-xs px-2.5 py-1 rounded-full">
              {cartItemCount} {cartItemCount === 1 ? 'item' : 'itens'}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-100 min-h-[160px] max-h-[300px] lg:max-h-none">
            {cart.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-bold">Carrinho vazio</p>
                <p className="text-[11px] mt-0.5">Toque nos produtos ao lado para montar seu pedido.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product.id} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-slate-900 truncate">{item.product.name}</h4>
                    <span className="text-[11px] text-amber-700 font-bold">{formatCurrency(item.product.price)} un</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center font-black text-xs">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Checkout Totem Bottom (Pinned right below cart items) */}
          <div className="sticky bottom-0 p-4 bg-slate-50 border-t border-slate-200 space-y-3 shrink-0 shadow-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold text-slate-600">Total a Pagar:</span>
              <span className="text-xl font-black text-slate-900">{formatCurrency(cartTotal)}</span>
            </div>

            {!isCheckoutStep ? (
              <button
                disabled={cart.length === 0}
                onClick={() => setIsCheckoutStep(true)}
                className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black text-sm uppercase tracking-wider shadow-lg transition cursor-pointer"
              >
                Avançar para Identificação ({cartItemCount})
              </button>
            ) : (
              <form onSubmit={handleFinishOrder} className="space-y-3 animate-in fade-in duration-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Seu Nome *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ex: João da Silva"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Telefone / WhatsApp</label>
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="(11) 99999-9999"
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">CPF (Opcional)</label>
                    <input
                      type="text"
                      value={customerDoc}
                      onChange={(e) => setCustomerDoc(e.target.value)}
                      placeholder="000.000.000-00"
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Forma de Pagamento</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('pix')}
                      className={`p-2 rounded-xl text-center font-bold text-xs border transition cursor-pointer ${
                        paymentMethod === 'pix'
                          ? 'bg-amber-500 text-slate-950 border-amber-600 font-black'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      PIX
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('debit_card')}
                      className={`p-2 rounded-xl text-center font-bold text-xs border transition cursor-pointer ${
                        paymentMethod === 'debit_card'
                          ? 'bg-amber-500 text-slate-950 border-amber-600 font-black'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      Cartão
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash_on_pickup')}
                      className={`p-2 rounded-xl text-center font-bold text-xs border transition cursor-pointer ${
                        paymentMethod === 'cash_on_pickup'
                          ? 'bg-amber-500 text-slate-950 border-amber-600 font-black'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      Dinheiro
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCheckoutStep(false)}
                    className="px-3 py-2.5 rounded-xl bg-slate-200 text-slate-700 font-bold text-xs"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase shadow transition cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'Processando...' : 'Confirmar Pedido & Imprimir'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
