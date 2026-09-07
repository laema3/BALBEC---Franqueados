import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  CookingPot,
  XCircle,
  Users,
  DollarSign,
  TrendingUp,
  AlertCircle,
  ArrowUpRight,
  RotateCw,
} from 'lucide-react';
import { DashboardStats, Order, OrderStatus } from '../../types.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';

export const AdminDashboard: React.FC<{ onNavigateToOrders: () => void }> = ({ onNavigateToOrders }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleQuickStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newStatus,
          responsibleUser: 'Administrador (Dashboard Rápido)',
          notes: `Avançado para ${newStatus} via Dashboard.`,
        }),
      });
      fetchStats();
    } catch (err) {
      console.error('Error updating order:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Visão Geral — Franquia BALBEC</h2>
          <p className="text-xs text-slate-500">Métricas operacionais e vendas do dia em tempo real.</p>
        </div>

        <button
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Atualizar Dados</span>
        </button>
      </div>

      {/* KPI Cards Grid (Section 19) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Card 1: Pedidos de Hoje */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">Pedidos de Hoje</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{stats?.todayOrdersCount || 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">Registrados nas últimas 24h</div>
        </div>

        {/* Card 2: Aguardando Pagamento */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">Aguard. Pagamento</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700">{stats?.waitingPaymentCount || 0}</div>
          <div className="text-[11px] text-amber-600 mt-1">PIX ou Dinheiro balcão</div>
        </div>

        {/* Card 3: Em Preparação */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">Em Preparação</span>
            <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <CookingPot className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-orange-600">{stats?.preparingCount || 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">Cozinha / Fritadeira</div>
        </div>

        {/* Card 4: Prontos para Retirada (na TV) */}
        <div className="bg-white p-4 rounded-2xl border-2 border-emerald-400 bg-emerald-50/20 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-emerald-950">Prontos p/ Retirada</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700">{stats?.readyCount || 0}</div>
          <div className="text-[11px] text-emerald-800 font-semibold mt-1">Exibindo no Painel TV</div>
        </div>

        {/* Card 5: Franqueados Ativos */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">Franqueados Ativos</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-700">{stats?.activeFranchiseesCount || 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">Parceiros credenciados</div>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-5 text-slate-950 shadow-md flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900">Total Vendido Hoje</span>
            <div className="text-3xl font-black mt-1">
              {formatCurrency(stats?.todaySalesTotal || 0)}
            </div>
            <div className="text-xs font-medium text-amber-950 mt-1">
              Calculado com base em pedidos confirmados do dia
            </div>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-amber-400/60 flex items-center justify-center shadow-inner">
            <DollarSign className="w-8 h-8 text-slate-950" />
          </div>
        </div>

        <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-md flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Total Vendido no Mês</span>
            <div className="text-3xl font-black mt-1">
              {formatCurrency(stats?.monthSalesTotal || 0)}
            </div>
            <div className="text-xs font-medium text-slate-400 mt-1">
              Faturamento consolidado das franquias BALBEC
            </div>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center border border-slate-700">
            <TrendingUp className="w-8 h-8 text-amber-400" />
          </div>
        </div>
      </div>

      {/* Recent Orders Quick Action Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-slate-900">Pedidos Recentes</h3>
            <span className="text-[11px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
              Tempo Real
            </span>
          </div>
          <button
            onClick={onNavigateToOrders}
            className="text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1"
          >
            <span>Ver Todos os Pedidos</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100/75 text-slate-600 uppercase text-[10px] font-black border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Nº Pedido</th>
                <th className="px-4 py-3">Cliente / Franqueado</th>
                <th className="px-4 py-3">Data / Hora</th>
                <th className="px-4 py-3">Valor Total</th>
                <th className="px-4 py-3">Pagamento</th>
                <th className="px-4 py-3">Status do Pedido</th>
                <th className="px-4 py-3 text-right">Ação Rápida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats?.recentOrders?.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-4 py-3 font-mono font-black text-slate-900">
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
                    <span
                      className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        order.paymentStatus === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {order.paymentStatus === 'approved' ? 'Aprovado' : 'Pendente'}
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
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {order.orderStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {order.orderStatus === 'RECEBIDO' && (
                      <button
                        onClick={() => handleQuickStatusChange(order.id, 'PREPARANDO')}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-2.5 py-1 rounded-lg text-[11px]"
                      >
                        Iniciar Preparação
                      </button>
                    )}
                    {order.orderStatus === 'PREPARANDO' && (
                      <button
                        onClick={() => handleQuickStatusChange(order.id, 'PRONTO PARA RETIRADA')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-2.5 py-1 rounded-lg text-[11px] shadow-xs"
                      >
                        Pronto (Chamar na TV)
                      </button>
                    )}
                    {order.orderStatus === 'PRONTO PARA RETIRADA' && (
                      <button
                        onClick={() => handleQuickStatusChange(order.id, 'RETIRADO')}
                        className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-2.5 py-1 rounded-lg text-[11px]"
                      >
                        Marcar Retirado
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
