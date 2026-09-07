import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  Package,
  CookingPot,
  Bell,
  XCircle,
  ExternalLink,
  ChevronRight,
  RotateCw,
  ShoppingBag,
  Info,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useApp } from '../../context/AppContext.js';
import { Order, OrderStatus } from '../../types.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';

export const OrdersHistoryModal: React.FC = () => {
  const { franchisee } = useAuth();
  const { setCurrentView, settings } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    if (!franchisee) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/orders?franchiseeId=${franchisee.id}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 8000); // Poll status updates
    return () => clearInterval(interval);
  }, [franchisee?.id]);

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'RECEBIDO':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
            <Package className="w-3.5 h-3.5" />
            <span>RECEBIDO</span>
          </span>
        );
      case 'PREPARANDO':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 animate-pulse">
            <CookingPot className="w-3.5 h-3.5" />
            <span>PREPARANDO</span>
          </span>
        );
      case 'PRONTO PARA RETIRADA':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 ring-2 ring-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>PRONTO PARA RETIRADA</span>
          </span>
        );
      case 'RETIRADO':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>RETIRADO</span>
          </span>
        );
      case 'CANCELADO':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-full bg-red-100 text-red-800">
            <XCircle className="w-3.5 h-3.5" />
            <span>CANCELADO</span>
          </span>
        );
    }
  };

  const topicName = settings?.ntfy?.defaultTopic || 'balbec_pedidos_notificacoes';
  const ntfyUrl = `${settings?.ntfy?.serverUrl || 'https://ntfy.sh'}/${topicName}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-amber-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900">Meus Pedidos</h1>
            <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
              {orders.length} pedidos
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Acompanhe o status de preparação e retirada dos seus salgados em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh button */}
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold transition"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>

          {/* ntfy subscription helper link */}
          <a
            href={ntfyUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 px-3 py-2 rounded-xl text-xs font-black transition shadow-xs"
            title="Abrir tópico no ntfy para receber notificações push no celular ou navegador"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Notificações ntfy</span>
            <ExternalLink className="w-3 h-3 ml-0.5" />
          </a>
        </div>
      </div>

      {/* Orders List & Details split view */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Orders Cards List */}
        <div className="lg:col-span-2 space-y-3">
          {loading && orders.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl text-center border border-slate-200">
              <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs font-bold text-slate-600">Carregando seus pedidos...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl text-center border border-slate-200">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">Nenhum pedido realizado ainda</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Acesse o catálogo de salgados e finalize seu primeiro pedido com a BALBEC!
              </p>
              <button
                onClick={() => setCurrentView('store')}
                className="mt-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-4 py-2 rounded-xl text-xs uppercase"
              >
                Ir para o Cardápio
              </button>
            </div>
          ) : (
            orders.map((order) => {
              const isSelected = selectedOrder?.id === order.id;
              return (
                <div
                  key={order.id}
                  id={`order-card-${order.orderNumber}`}
                  onClick={() => setSelectedOrder(order)}
                  className={`bg-white rounded-2xl border p-4 transition cursor-pointer shadow-xs ${
                    isSelected
                      ? 'border-amber-500 ring-2 ring-amber-400 bg-amber-50/20'
                      : 'border-slate-200 hover:border-amber-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-slate-900">
                        #{order.orderNumber}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-600">{formatDate(order.createdAt)}</span>
                    </div>
                    <div>{getStatusBadge(order.orderStatus)}</div>
                  </div>

                  {/* Summary row */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="text-slate-600">
                      <strong>{order.items.reduce((sum, i) => sum + i.quantity, 0)} itens</strong> (
                      {order.items.map((i) => `${i.quantity}x ${i.productName}`).slice(0, 2).join(', ')}
                      {order.items.length > 2 ? '...' : ''})
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-slate-950">
                        {formatCurrency(order.total)}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Detailed Order Inspector */}
        <div className="lg:col-span-1">
          {selectedOrder ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs sticky top-24 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Detalhes do Pedido
                  </span>
                  <h3 className="text-xl font-black text-slate-900">#{selectedOrder.orderNumber}</h3>
                </div>
                <div>{getStatusBadge(selectedOrder.orderStatus)}</div>
              </div>

              {/* Estimated pickup banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs flex items-start gap-2 text-amber-950">
                <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Previsão de Retirada</div>
                  <div>{selectedOrder.estimatedPickupTime}</div>
                </div>
              </div>

              {/* Items Breakdown */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-2">Itens Solicitados</h4>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {selectedOrder.items.map((it, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-slate-50 text-xs flex items-center justify-between"
                    >
                      <div className="truncate pr-2">
                        <span className="font-black text-slate-900 mr-1">{it.quantity}x</span>
                        <span className="text-slate-700">{it.productName}</span>
                      </div>
                      <span className="font-bold text-slate-900 shrink-0">
                        {formatCurrency(it.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between text-xs font-black text-slate-900">
                  <span>Total</span>
                  <span className="text-sm text-red-600">{formatCurrency(selectedOrder.total)}</span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1 border border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500">Forma de Pagamento:</span>
                  <span className="font-bold uppercase text-slate-800">
                    {selectedOrder.paymentMethod === 'pix'
                      ? 'PIX Online'
                      : selectedOrder.paymentMethod === 'debit_card'
                      ? 'Cartão de Débito'
                      : 'Dinheiro na Retirada'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status do Pagamento:</span>
                  <span
                    className={`font-bold uppercase ${
                      selectedOrder.paymentStatus === 'approved'
                        ? 'text-emerald-700'
                        : 'text-amber-700'
                    }`}
                  >
                    {selectedOrder.paymentStatus === 'approved' ? 'Aprovado' : 'Aguardando'}
                  </span>
                </div>
              </div>

              {/* Status Progression Timeline (Section 13 & 28) */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-2">Histórico de Alterações</h4>
                <div className="relative pl-4 space-y-3 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {selectedOrder.statusHistory?.map((hist, idx) => (
                    <div key={idx} className="relative text-xs">
                      <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-white"></div>
                      <div className="font-bold text-slate-900">{hist.newStatus}</div>
                      <div className="text-[11px] text-slate-500">
                        {formatDate(hist.timestamp)} • {hist.responsibleUser}
                      </div>
                      {hist.notes && (
                        <div className="text-[11px] text-slate-600 italic mt-0.5">{hist.notes}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
              <Info className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-600">
                Selecione um pedido na lista para ver o histórico completo de status.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
