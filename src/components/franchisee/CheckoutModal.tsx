import React, { useState } from 'react';
import {
  X,
  Clock,
  QrCode,
  CreditCard,
  Banknote,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Tv,
} from 'lucide-react';
import { useCart } from '../../context/CartContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { useApp } from '../../context/AppContext.js';
import { formatCurrency, maskCpfCnpj } from '../../utils/formatters.js';
import { Order, PaymentMethod } from '../../types.js';

export const CheckoutModal: React.FC = () => {
  const {
    items,
    subtotal,
    clearCart,
    isCheckoutModalOpen,
    setIsCheckoutModalOpen,
  } = useCart();
  const { franchisee, user } = useAuth();
  const { setCurrentView } = useApp();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Completed order state
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [pixPayload, setPixPayload] = useState<{ qrCodeUrl?: string; qrCodeText?: string } | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [simulatingWebhook, setSimulatingWebhook] = useState(false);

  if (!isCheckoutModalOpen) return null;

  const handleConfirmOrder = async () => {
    if (!franchisee) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const payload = {
        franchiseeId: franchisee.id,
        items: items.map((i) => ({
          productId: i.product.id,
          productName: i.product.name,
          quantity: i.quantity,
        })),
        paymentMethod,
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Não foi possível finalizar o pedido. Verifique os dados e tente novamente.');
      }

      setCompletedOrder(data.order);
      if (data.payment?.qrCodeText) {
        setPixPayload({
          qrCodeUrl: data.payment.qrCodeUrl,
          qrCodeText: data.payment.qrCodeText,
        });
      }
      clearCart();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao processar pedido.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPix = () => {
    if (!pixPayload?.qrCodeText) return;
    navigator.clipboard.writeText(pixPayload.qrCodeText);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2000);
  };

  const handleSimulateWebhookApproval = async () => {
    if (!completedOrder) return;
    setSimulatingWebhook(true);
    try {
      const res = await fetch(`/api/payments/${completedOrder.id}/simulate-approval`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setCompletedOrder(data.order);
      }
    } catch (err) {
      console.warn('Webhook simulation error:', err);
    } finally {
      setSimulatingWebhook(false);
    }
  };

  const closeModal = () => {
    setIsCheckoutModalOpen(false);
    setCompletedOrder(null);
    setPixPayload(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-amber-500 p-5 text-slate-950 flex items-center justify-between shadow-xs shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6" />
            <h2 className="font-black text-lg tracking-tight">
              {completedOrder ? 'Pedido Confirmado com Sucesso!' : 'Finalização de Pedido BALBEC'}
            </h2>
          </div>
          <button
            onClick={closeModal}
            className="p-1 rounded-full hover:bg-amber-600/50 transition text-slate-950"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {completedOrder ? (
            /* Order Success View */
            <div className="space-y-6 text-center py-2">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Número do Pedido</span>
                <h3 className="text-3xl font-black text-slate-900 mt-0.5">#{completedOrder.orderNumber}</h3>
                <p className="text-xs text-slate-600 font-semibold mt-1">
                  Franqueado: {completedOrder.franchiseeName}
                </p>
              </div>

              {/* ESTIMATED PICKUP TIME - MANDATORY SECTION 10 & 28 */}
              <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 text-center space-y-1 shadow-xs">
                <div className="flex items-center justify-center gap-1.5 text-amber-900 font-black text-sm uppercase">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Previsão de Retirada</span>
                </div>
                <p className="text-sm font-bold text-slate-800">
                  Seu pedido estará disponível para retirada aproximadamente 30 minutos após a confirmação.
                </p>
                <p className="text-xs text-slate-500">
                  Acompanhe na televisão ou através das notificações no sistema.
                </p>
              </div>

              {/* Status Tracker Banner */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs flex items-center justify-between">
                <span className="font-semibold text-slate-600">Status atual do pedido:</span>
                <span className="font-black px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 uppercase">
                  {completedOrder.orderStatus}
                </span>
              </div>

              {/* PIX Payment Display if PIX was chosen */}
              {completedOrder.paymentMethod === 'pix' && pixPayload && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center space-y-3">
                  <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-800">
                    <QrCode className="w-4 h-4 text-amber-600" />
                    <span>Pagamento Instantâneo via PIX</span>
                  </div>

                  {pixPayload.qrCodeUrl && (
                    <div className="p-2 bg-white inline-block rounded-xl border border-slate-200 shadow-xs mx-auto">
                      <img
                        src={pixPayload.qrCodeUrl}
                        alt="QR Code PIX"
                        className="w-40 h-40 object-contain mx-auto"
                      />
                    </div>
                  )}

                  <div className="max-w-md mx-auto">
                    <button
                      onClick={handleCopyPix}
                      className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition"
                    >
                      {copiedPix ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span>Código PIX Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copiar Código PIX (Copia e Cola)</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Simulator for Reviewer to approve PIX payment online */}
                  <div className="pt-2 border-t border-slate-200">
                    <button
                      onClick={handleSimulateWebhookApproval}
                      disabled={simulatingWebhook || completedOrder.paymentStatus === 'approved'}
                      className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 py-1.5 px-3 rounded-lg transition"
                    >
                      {completedOrder.paymentStatus === 'approved'
                        ? '✓ Pagamento Aprovado no Gateway!'
                        : simulatingWebhook
                        ? 'Confirmando no gateway...'
                        : '⚡ Simular Aprovação do Gateway (Webhook)'}
                    </button>
                  </div>
                </div>
              )}

              {/* Cash on pickup note */}
              {completedOrder.paymentMethod === 'cash_on_pickup' && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 font-medium">
                  <strong>Pagamento na Retirada:</strong> Apresente o número do pedido <strong>#{completedOrder.orderNumber}</strong> ao retirar seu pedido no balcão BALBEC.
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => {
                    closeModal();
                    setCurrentView('orders');
                  }}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-3 rounded-xl text-xs uppercase tracking-wider transition"
                >
                  Acompanhar Meus Pedidos
                </button>
                <button
                  onClick={() => {
                    closeModal();
                    setCurrentView('tv');
                  }}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5"
                >
                  <Tv className="w-4 h-4 text-amber-400" />
                  <span>Ver Painel da TV</span>
                </button>
              </div>
            </div>
          ) : (
            /* Checkout Preparation View */
            <>
              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* 1. Franchisee Info Summary */}
              {franchisee && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-1">
                  <div className="font-bold text-slate-900 text-sm">{franchisee.tradeName}</div>
                  <div className="text-slate-600">
                    Razão Social: <strong>{franchisee.companyName}</strong>
                  </div>
                  <div className="text-slate-600">
                    Documento: <strong>{maskCpfCnpj(franchisee.document)}</strong> • Telefone:{' '}
                    <strong>{franchisee.phone || franchisee.whatsapp}</strong>
                  </div>
                  <div className="text-slate-500">
                    Local de Retirada/Franquia: {franchisee.address.street}, {franchisee.address.number} -{' '}
                    {franchisee.address.neighborhood}, {franchisee.address.city}/{franchisee.address.state}
                  </div>
                </div>
              )}

              {/* 2. Items summary table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-2 font-bold text-xs text-slate-700 flex justify-between">
                  <span>Itens Selecionados ({items.length})</span>
                  <span>Subtotal</span>
                </div>
                <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.product.id} className="p-3 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900">{item.quantity}x</span>
                        <span className="text-slate-800 font-medium">{item.product.name}</span>
                      </div>
                      <span className="font-bold text-slate-900">
                        {formatCurrency(item.product.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="bg-amber-50/80 p-3 border-t border-slate-200 flex justify-between text-sm font-black text-slate-950">
                  <span>Total do Pedido</span>
                  <span className="text-base text-red-600">{formatCurrency(subtotal)}</span>
                </div>
              </div>

              {/* 3. Mandatory 30-Minute Pickup Notice (Section 10) */}
              <div className="bg-amber-100/70 border border-amber-300 rounded-xl p-3.5 flex items-start gap-2.5">
                <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-950">
                  <div className="font-bold">Aviso de Retirada</div>
                  <div>
                    Seu pedido estará disponível para retirada aproximadamente{' '}
                    <strong>30 minutos após a confirmação</strong>.
                  </div>
                </div>
              </div>

              {/* 4. Payment Method Choice (PIX, Debit Card, Cash on Pickup) */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-2">
                  Escolha a Forma de Pagamento
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* PIX */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pix')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                      paymentMethod === 'pix'
                        ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-400'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <QrCode className="w-5 h-5 text-amber-600" />
                      {paymentMethod === 'pix' && (
                        <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                      )}
                    </div>
                    <div className="font-bold text-xs text-slate-900">PIX Online</div>
                    <div className="text-[11px] text-slate-500">QR Code Instantâneo</div>
                  </button>

                  {/* Cartão de Débito */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('debit_card')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                      paymentMethod === 'debit_card'
                        ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-400'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                      {paymentMethod === 'debit_card' && (
                        <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                      )}
                    </div>
                    <div className="font-bold text-xs text-slate-900">Cartão de Débito</div>
                    <div className="text-[11px] text-slate-500">Gateway Online</div>
                  </button>

                  {/* Dinheiro na Retirada */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash_on_pickup')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                      paymentMethod === 'cash_on_pickup'
                        ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-400'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Banknote className="w-5 h-5 text-emerald-600" />
                      {paymentMethod === 'cash_on_pickup' && (
                        <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                      )}
                    </div>
                    <div className="font-bold text-xs text-slate-900">Dinheiro</div>
                    <div className="text-[11px] text-slate-500">Pagamento na Retirada</div>
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                id="btn-confirm-checkout"
                onClick={handleConfirmOrder}
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 px-4 rounded-xl text-sm uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                {loading ? (
                  <span>Processando Pedido...</span>
                ) : (
                  <>
                    <span>Confirmar Pedido ({formatCurrency(subtotal)})</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
