import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, AlertTriangle, CheckCircle2, Package } from 'lucide-react';
import { useCart } from '../../context/CartContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { formatCurrency } from '../../utils/formatters.js';

export const CartDrawer: React.FC = () => {
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    subtotal,
    minimumRequired,
    remainingToMinimum,
    isMinimumReached,
    progressPercentage,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    setIsCheckoutModalOpen,
  } = useCart();
  const { franchisee, user, setIsAuthModalOpen } = useAuth();

  if (!isCartDrawerOpen) return null;

  const handleProceedToCheckout = () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!isMinimumReached) {
      return;
    }
    setIsCartDrawerOpen(false);
    setIsCheckoutModalOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
        id="cart-drawer-panel"
      >
        {/* Drawer Header */}
        <div className="p-4 bg-amber-500 text-slate-950 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            <h2 className="font-black text-base tracking-tight">Carrinho de Compras</h2>
            <span className="text-xs font-bold bg-amber-600/40 text-amber-950 px-2 py-0.5 rounded-full">
              {items.length} {items.length === 1 ? 'item' : 'itens'}
            </span>
          </div>
          <button
            onClick={() => setIsCartDrawerOpen(false)}
            className="p-1 rounded-full hover:bg-amber-600/50 transition text-slate-950"
            title="Fechar carrinho"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Purchase Goal Indicator Banner (Section 5 & 9) */}
        <div className="p-4 bg-amber-50/80 border-b border-amber-200">
          <div className="flex items-center justify-between text-xs font-bold mb-1.5">
            <span className="text-slate-700">Meta de Compra Mínima:</span>
            <span className="text-slate-950 font-black text-sm">{formatCurrency(minimumRequired)}</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                isMinimumReached ? 'bg-emerald-600' : 'bg-amber-500'
              }`}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>

          {/* Dynamic feedback message */}
          {isMinimumReached ? (
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 p-2 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Valor mínimo atingido! Você pode finalizar seu pedido.</span>
            </div>
          ) : (
            <div className="flex items-start gap-1.5 text-xs text-red-800 bg-red-100/90 p-2 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Faltam {formatCurrency(remainingToMinimum)}</span> para atingir o
                valor mínimo para realizar o pedido.
              </div>
            </div>
          )}
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <ShoppingBag className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-600">Seu carrinho está vazio</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Adicione salgados e produtos ao seu pedido para atingir a meta mínima.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.product.id}
                id={`cart-item-${item.product.id}`}
                className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3 shadow-xs"
              >
                {item.product.imageUrl ? (
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    className="w-16 h-16 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-200"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-amber-50 border border-amber-200/60 flex items-center justify-center shrink-0 text-amber-700">
                    <Package className="w-6 h-6" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                      {item.product.internalCode}
                    </span>
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="text-slate-400 hover:text-red-600 p-1 transition"
                      title="Remover item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h4 className="text-xs font-bold text-slate-800 truncate mt-0.5">
                    {item.product.name}
                  </h4>

                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Unitário: {formatCurrency(item.product.price)}
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    {/* Quantity Stepper */}
                    <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="w-6 h-6 rounded bg-white text-slate-700 font-bold flex items-center justify-center hover:bg-slate-200 text-xs"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-7 text-center text-xs font-bold text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="w-6 h-6 rounded bg-white text-slate-700 font-bold flex items-center justify-center hover:bg-slate-200 text-xs"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Item Subtotal */}
                    <span className="text-xs font-black text-slate-900">
                      {formatCurrency(item.product.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Summary & Checkout Button */}
        {items.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal do Pedido</span>
                <span className="font-semibold text-slate-800">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Valor Mínimo Requerido</span>
                <span className="font-semibold text-slate-800">{formatCurrency(minimumRequired)}</span>
              </div>
              <div className="border-t border-slate-200 pt-1.5 flex justify-between text-sm font-black text-slate-950">
                <span>Total</span>
                <span className="text-base text-red-600">{formatCurrency(subtotal)}</span>
              </div>
            </div>

            {/* Finalize Button with strict disabling if below minimum */}
            <button
              id="btn-finalize-order"
              onClick={handleProceedToCheckout}
              disabled={!isMinimumReached}
              className={`w-full py-3.5 px-4 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition ${
                isMinimumReached
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-98'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-80'
              }`}
            >
              <span>{isMinimumReached ? 'FINALIZAR PEDIDO' : 'VALOR MÍNIMO NÃO ATINGIDO'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {!isMinimumReached && (
              <p className="text-[11px] text-center font-semibold text-red-700">
                Adicione mais {formatCurrency(remainingToMinimum)} para habilitar a finalização do pedido.
              </p>
            )}

            <button
              onClick={clearCart}
              className="w-full text-center text-xs text-slate-400 hover:text-red-600 font-semibold transition"
            >
              Esvaziar Carrinho
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
