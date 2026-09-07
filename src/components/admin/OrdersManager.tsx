import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  CookingPot,
  Package,
  XCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  Bell,
  RefreshCw,
  Send,
  Eye,
  X,
} from 'lucide-react';
import { Order, OrderStatus, PaymentMethod } from '../../types.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';

export const OrdersManager: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected order for status change or history inspection
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState<boolean>(false);
  const [newStatus, setNewStatus] = useState<OrderStatus>('PREPARANDO');
  const [statusNotes, setStatusNotes] = useState<string>('');
  const [responsibleName, setResponsibleName] = useState<string>('Operador BALBEC');
  const [actionLoading, setActionLoading] = useState(false);
  const [syncingBlueFocus, setSyncingBlueFocus] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/orders');
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
    const interval = setInterval(fetchOrders, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenStatusModal = (order: Order) => {
    setSelectedOrder(order);
    // suggest next logical status
    if (order.orderStatus === 'RECEBIDO') setNewStatus('PREPARANDO');
    else if (order.orderStatus === 'PREPARANDO') setNewStatus('PRONTO PARA RETIRADA');
    else if (order.orderStatus === 'PRONTO PARA RETIRADA') setNewStatus('RETIRADO');
    else setNewStatus(order.orderStatus);
    setStatusNotes('');
    setStatusModalOpen(true);
  };

  const handleApplyStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/orders/${selectedOrder.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newStatus,
          responsibleUser: responsibleName || 'Gerência BALBEC',
          notes: statusNotes,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setStatusModalOpen(false);
        setSelectedOrder(data.order);
        setToastMessage(`Status atualizado para "${newStatus}" com envio ao ntfy e painel TV!`);
        setTimeout(() => setToastMessage(null), 4000);
        fetchOrders();
      }
    } catch (err) {
      console.error('Error updating order status:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSyncBlueFocus = async (orderId: string) => {
    setSyncingBlueFocus(orderId);
    try {
      const res = await fetch(`/api/bluefocus/sync-order/${orderId}`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setToastMessage(data.message || 'Sincronizado com BlueFocus com sucesso!');
        setTimeout(() => setToastMessage(null), 4000);
        fetchOrders();
      }
    } catch (err) {
      console.error('BlueFocus sync error:', err);
    } finally {
      setSyncingBlueFocus(null);
    }
  };

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'all' || o.orderStatus === statusFilter;
    const matchesPayment = paymentFilter === 'all' || o.paymentMethod === paymentFilter;
    const matchesQuery =
      o.orderNumber.toString().includes(searchQuery) ||
      o.franchiseeName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesPayment && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="p-3 bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md animate-in slide-in-from-top duration-150">
          ✓ {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Gestão de Pedidos</h2>
          <p className="text-xs text-slate-500">
            Acompanhe o fluxo de recebimento, preparação na cozinha, chamada na TV e emissão para o BlueFocus.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold transition shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Atualizar Pedidos</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nº do pedido ou nome do franqueado..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs font-bold py-2 px-3 rounded-xl border border-slate-200 text-slate-700 bg-slate-50"
        >
          <option value="all">Todos os Status ({orders.length})</option>
          <option value="RECEBIDO">RECEBIDO</option>
          <option value="PREPARANDO">PREPARANDO</option>
          <option value="PRONTO PARA RETIRADA">PRONTO PARA RETIRADA</option>
          <option value="RETIRADO">RETIRADO</option>
          <option value="CANCELADO">CANCELADO</option>
        </select>

        {/* Payment filter */}
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="text-xs font-bold py-2 px-3 rounded-xl border border-slate-200 text-slate-700 bg-slate-50"
        >
          <option value="all">Formas de Pagamento</option>
          <option value="pix">PIX Online</option>
          <option value="debit_card">Cartão de Débito</option>
          <option value="cash_on_pickup">Dinheiro na Retirada</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-black border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Nº Pedido</th>
                <th className="px-4 py-3">Franqueado</th>
                <th className="px-4 py-3">Data / Hora</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Forma Pagto</th>
                <th className="px-4 py-3">Status Pedido</th>
                <th className="px-4 py-3">ERP BlueFocus</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-4 py-3 font-mono font-black text-slate-900 text-sm">
                    #{order.orderNumber}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    <div>{order.franchiseeName}</div>
                    <div className="text-[11px] text-slate-400">{order.franchiseePhone}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-4 py-3 font-black text-slate-900">
                    {formatCurrency(order.total)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold uppercase text-[11px] text-slate-700">
                      {order.paymentMethod === 'pix'
                        ? 'PIX'
                        : order.paymentMethod === 'debit_card'
                        ? 'Débito'
                        : 'Dinheiro'}
                    </div>
                    <span
                      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${
                        order.paymentStatus === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {order.paymentStatus === 'approved' ? 'Pago' : 'Pendente'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block text-[11px] font-black px-2.5 py-1 rounded-full uppercase ${
                        order.orderStatus === 'PRONTO PARA RETIRADA'
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : order.orderStatus === 'PREPARANDO'
                          ? 'bg-amber-100 text-amber-900'
                          : order.orderStatus === 'CANCELADO'
                          ? 'bg-red-100 text-red-800'
                          : order.orderStatus === 'RETIRADO'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {order.orderStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleSyncBlueFocus(order.id)}
                      disabled={syncingBlueFocus === order.id}
                      className={`text-[11px] font-bold px-2 py-1 rounded-lg border transition ${
                        order.blueFocusSync?.synced
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                      title="Enviar pedido para o sistema local BlueFocus"
                    >
                      {syncingBlueFocus === order.id
                        ? 'Sincronizando...'
                        : order.blueFocusSync?.synced
                        ? '✓ Sincronizado'
                        : 'Sincronizar ERP'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenStatusModal(order)}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-2.5 py-1.5 rounded-xl text-xs transition shadow-xs"
                      >
                        Alterar Status
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Change & Audit Modal (Section 28) */}
      {statusModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-amber-500 p-4 text-slate-950 flex items-center justify-between">
              <div>
                <h3 className="font-black text-base">
                  Alterar Status do Pedido #{selectedOrder.orderNumber}
                </h3>
                <span className="text-xs font-semibold text-slate-800">
                  {selectedOrder.franchiseeName}
                </span>
              </div>
              <button
                onClick={() => setStatusModalOpen(false)}
                className="text-slate-950 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyStatusChange} className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block text-[11px]">Status Atual:</span>
                  <span className="font-black text-slate-900 text-sm">
                    {selectedOrder.orderStatus}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[11px]">Total:</span>
                  <span className="font-black text-red-600 text-sm">
                    {formatCurrency(selectedOrder.total)}
                  </span>
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <label className="font-bold text-slate-800 block mb-1.5 text-xs">
                  Novo Status do Pedido *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(
                    [
                      'RECEBIDO',
                      'PREPARANDO',
                      'PRONTO PARA RETIRADA',
                      'RETIRADO',
                      'CANCELADO',
                    ] as OrderStatus[]
                  ).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setNewStatus(st)}
                      className={`p-2.5 rounded-xl border text-center font-bold text-xs transition ${
                        newStatus === st
                          ? 'bg-amber-500 text-slate-950 border-amber-600 ring-2 ring-amber-400'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Responsible User */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Usuário Responsável pela Alteração *
                </label>
                <input
                  type="text"
                  required
                  value={responsibleName}
                  onChange={(e) => setResponsibleName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
                  placeholder="Nome do operador ou atendente"
                />
              </div>

              {/* Observações */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Observações / Justificativa
                </label>
                <textarea
                  rows={2}
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
                  placeholder="Ex: Salgados fritos e embalados para retirada imediata."
                />
              </div>

              {/* Automated Triggers Info Banner */}
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 space-y-1 text-[11px] text-amber-950">
                <div className="flex items-center gap-1.5 font-bold">
                  <Bell className="w-3.5 h-3.5 text-amber-600" />
                  <span>Ações Automáticas ao Salvar:</span>
                </div>
                <p>• Notificação push enviada via <strong>ntfy</strong> para o franqueado.</p>
                {newStatus === 'PRONTO PARA RETIRADA' && (
                  <p className="font-bold text-emerald-800">
                    • O pedido será exibido instantaneamente no <strong>Painel de TV</strong> com alerta sonoro!
                  </p>
                )}
              </div>

              {/* Audit history */}
              <div className="border-t border-slate-200 pt-3">
                <span className="font-bold text-slate-700 block mb-2">
                  Histórico de Alterações Anteriores ({selectedOrder.statusHistory?.length || 0})
                </span>
                <div className="max-h-32 overflow-y-auto space-y-1.5">
                  {selectedOrder.statusHistory?.map((h, i) => (
                    <div key={i} className="bg-slate-50 p-2 rounded-lg text-[11px]">
                      <div className="flex justify-between font-bold">
                        <span className="text-slate-900">{h.newStatus}</span>
                        <span className="text-slate-500">{formatDate(h.timestamp)}</span>
                      </div>
                      <div className="text-slate-600">Por: {h.responsibleUser}</div>
                      {h.notes && <div className="text-slate-500 italic mt-0.5">{h.notes}</div>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStatusModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-6 py-2.5 rounded-xl uppercase shadow"
                >
                  {actionLoading ? 'Salvando...' : 'Confirmar Novo Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
