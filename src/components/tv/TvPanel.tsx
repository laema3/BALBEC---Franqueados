import React, { useState, useEffect, useRef } from 'react';
import { Tv, Volume2, VolumeX, Maximize2, Minimize2, ArrowLeft, Clock, Sparkles, CheckCircle2, RotateCw } from 'lucide-react';
import { Order } from '../../types.js';
import { audioNotifier } from '../../utils/audio.js';
import { formatTime } from '../../utils/formatters.js';

export const TvPanel: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const [readyOrders, setReadyOrders] = useState<Order[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [newlyAddedIds, setNewlyAddedIds] = useState<Set<string>>(new Set());

  const previousIdsRef = useRef<Set<string>>(new Set());

  const fetchReadyOrders = async () => {
    try {
      const res = await fetch('/api/orders/tv');
      if (res.ok) {
        const data = await res.json();
        const orders: Order[] = data.readyOrders || [];
        setReadyOrders(orders);
        setLastUpdate(new Date().toLocaleTimeString('pt-BR'));

        // Check if there are newly arrived ready orders
        const currentIds = new Set(orders.map((o) => o.id));
        const newIds = new Set<string>();

        orders.forEach((o) => {
          if (!previousIdsRef.current.has(o.id)) {
            newIds.add(o.id);
          }
        });

        if (newIds.size > 0 && previousIdsRef.current.size > 0) {
          // Play call bell chime!
          if (soundEnabled) {
            audioNotifier.playChime();
          }
          setNewlyAddedIds(newIds);
          setTimeout(() => setNewlyAddedIds(new Set()), 12000);
        }

        previousIdsRef.current = currentIds;
      }
    } catch (err) {
      console.error('Error polling TV orders:', err);
    }
  };

  useEffect(() => {
    fetchReadyOrders();
    const interval = setInterval(fetchReadyOrders, 4000); // 4-second polling
    return () => clearInterval(interval);
  }, [soundEnabled]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  const handleMarkAsPickedUp = async (orderId: string) => {
    try {
      await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newStatus: 'RETIRADO',
          responsibleUser: 'Painel TV (Operador de Balcão)',
          notes: 'Retirado pelo cliente no balcão.',
        }),
      });
      fetchReadyOrders();
    } catch (err) {
      console.warn('Error marking order as picked up:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans select-none">
      {/* Top TV Bar */}
      <header className="bg-slate-900 border-b-4 border-amber-500 px-6 py-4 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg ring-2 ring-amber-300">
            B
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight">
                BALBEC — PAINEL DE RETIRADA
              </h1>
              <span className="bg-red-600 text-white text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse">
                AO VIVO
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-400">
              Retirada rápida de pedidos para clientes e franqueados
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-xs font-mono text-slate-400 mr-2 bg-slate-800/60 px-3 py-1.5 rounded-xl">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Última atualização: {lastUpdate || '--:--:--'}</span>
          </div>

          <button
            id="btn-tv-toggle-sound"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border transition ${
              soundEnabled
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 hover:bg-amber-500/30'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
            title={soundEnabled ? 'Silenciar alerta sonoro' : 'Ativar alerta sonoro'}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          <button
            id="btn-tv-fullscreen"
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white transition"
            title="Tela Cheia"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>

          <button
            id="btn-tv-exit"
            onClick={onExit}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded-xl font-bold text-xs transition border border-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Sair da TV</span>
          </button>
        </div>
      </header>

      {/* Main Ready Orders Stage */}
      <main className="flex-1 p-6 sm:p-10 flex flex-col justify-start">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-emerald-500 animate-ping"></div>
            <h2 className="text-xl sm:text-2xl font-black text-emerald-400 uppercase tracking-wider">
              PEDIDOS PRONTOS PARA RETIRADA ({readyOrders.length})
            </h2>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Apresente o número do seu pedido no balcão de entrega
          </span>
        </div>

        {readyOrders.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/30">
            <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center text-slate-600 mb-4 ring-2 ring-slate-800">
              <Tv className="w-10 h-10 text-amber-500/50" />
            </div>
            <h3 className="text-2xl font-black text-slate-300">Nenhum pedido aguardando retirada no momento</h3>
            <p className="text-base text-slate-500 mt-2 max-w-lg">
              Os pedidos que forem finalizados pela cozinha aparecerão aqui imediatamente com o aviso sonoro.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {readyOrders.map((order) => {
              const isNewlyAdded = newlyAddedIds.has(order.id);
              return (
                <div
                  key={order.id}
                  id={`tv-order-card-${order.orderNumber}`}
                  className={`relative bg-gradient-to-br from-slate-900 to-slate-900/90 border-2 rounded-3xl p-6 sm:p-8 shadow-2xl transition duration-300 flex flex-col justify-between ${
                    isNewlyAdded
                      ? 'border-amber-400 ring-4 ring-amber-400/50 bg-amber-950/30 animate-bounce'
                      : 'border-emerald-500/80 hover:border-emerald-400'
                  }`}
                >
                  {/* Ready Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center gap-1.5 bg-emerald-500 text-slate-950 font-black text-xs sm:text-sm px-3 py-1 rounded-full uppercase tracking-wider shadow">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>PRONTO</span>
                    </span>

                    {order.readyAt && (
                      <span className="text-xs font-mono font-bold text-slate-400">
                        Pronto às {formatTime(order.readyAt)}
                      </span>
                    )}
                  </div>

                  {/* Main Display: Order Number & Franchisee / Client Name (Section 15) */}
                  <div className="my-2">
                    <div className="text-5xl sm:text-6xl font-black text-amber-400 tracking-tight font-mono">
                      #{order.orderNumber}
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2 truncate uppercase">
                      {order.franchiseeName}
                    </div>
                  </div>

                  {/* Items summary and pick up button */}
                  <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <div>
                      <span className="font-semibold text-slate-300">
                        {order.items.reduce((sum, i) => sum + i.quantity, 0)} itens
                      </span>
                    </div>

                    {/* Quick pickup action */}
                    <button
                      onClick={() => handleMarkAsPickedUp(order.id)}
                      className="bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 text-[11px] font-bold py-1.5 px-3 rounded-lg transition border border-slate-700"
                      title="Marcar como retirado pelo cliente"
                    >
                      ✓ Entregue
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* TV Footer ticker */}
      <footer className="bg-slate-900 border-t border-slate-800 py-3 px-6 text-center text-xs font-medium text-slate-500 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Atualização contínua ativada</span>
        </div>
        <div className="font-semibold text-slate-400">
          BALBEC — Salgados Fritos, Assados e Centos para Revenda
        </div>
        <div className="text-[11px] text-slate-600 font-mono">
          Terminal Balcão / TV 1
        </div>
      </footer>
    </div>
  );
};
