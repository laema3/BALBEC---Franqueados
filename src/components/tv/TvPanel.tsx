import React, { useState, useEffect, useRef } from 'react';
import {
  Tv,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  ArrowLeft,
  Clock,
  CheckCircle2,
  Radio,
  Share2,
  Copy,
  Check,
  Megaphone,
  Bell,
  Play,
  Sun,
  ShieldCheck,
} from 'lucide-react';
import { Order } from '../../types.js';
import { audioNotifier } from '../../utils/audio.js';
import { formatTime } from '../../utils/formatters.js';
import { useApp } from '../../context/AppContext.js';

type SoundMode = 'chime_and_voice' | 'chime_only' | 'mute';

export const TvPanel: React.FC<{ onExit?: () => void }> = ({ onExit }) => {
  const { setCurrentView, getTvUrl } = useApp();
  const [readyOrders, setReadyOrders] = useState<Order[]>([]);
  const [soundMode, setSoundMode] = useState<SoundMode>('chime_and_voice');
  const [isAudioUnlocked, setIsAudioUnlocked] = useState<boolean>(() => audioNotifier.isAudioReady());
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [newlyAddedIds, setNewlyAddedIds] = useState<Set<string>>(new Set());
  const [activeAlertOrder, setActiveAlertOrder] = useState<Order | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [isWakeLockActive, setIsWakeLockActive] = useState<boolean>(false);

  const initialLoadDoneRef = useRef<boolean>(false);
  const previousIdsRef = useRef<Set<string>>(new Set());

  // Clock update
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDate(now.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }));
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Screen Wake Lock to prevent Smart TV from dimming / sleeping
  useEffect(() => {
    let wakeLockSentinel: any = null;

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
          setIsWakeLockActive(true);
          wakeLockSentinel.addEventListener('release', () => {
            setIsWakeLockActive(false);
          });
        }
      } catch (err) {
        // Ignored if device doesn't support wake lock or battery saver active
        setIsWakeLockActive(false);
      }
    };

    requestWakeLock();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (wakeLockSentinel) {
        wakeLockSentinel.release().catch(() => {});
      }
    };
  }, []);

  // Unlock Audio
  const handleUnlockAudio = () => {
    const unlocked = audioNotifier.unlock();
    setIsAudioUnlocked(unlocked || audioNotifier.isAudioReady());
    // Play quick test chime
    audioNotifier.playChime();
  };

  // Test Sound
  const handleTestSound = () => {
    audioNotifier.unlock();
    setIsAudioUnlocked(true);
    audioNotifier.playChime();
    if (soundMode === 'chime_and_voice') {
      audioNotifier.announceOrder(1026, 'Franqueado Teste');
    }
  };

  // Fetch orders specifically marked as "PRONTO PARA RETIRADA"
  const fetchReadyOrders = async () => {
    try {
      setIsPolling(true);
      const res = await fetch('/api/orders/tv');
      if (res.ok) {
        const data = await res.json();
        const orders: Order[] = data.readyOrders || [];
        setReadyOrders(orders);
        setLastSyncTime(new Date().toLocaleTimeString('pt-BR'));

        const currentIds = new Set(orders.map((o) => o.id));

        // If this is not the very first load, check if any order is NEW
        if (initialLoadDoneRef.current) {
          const freshIds = new Set<string>();
          let latestNewOrder: Order | null = null;

          orders.forEach((o) => {
            if (!previousIdsRef.current.has(o.id)) {
              freshIds.add(o.id);
              latestNewOrder = o;
            }
          });

          if (freshIds.size > 0 && latestNewOrder) {
            // TRIGGER AUDIO ALERT!
            if (soundMode !== 'mute') {
              audioNotifier.unlock();
              audioNotifier.playChime();

              if (soundMode === 'chime_and_voice') {
                audioNotifier.announceOrder((latestNewOrder as Order).orderNumber, (latestNewOrder as Order).franchiseeName);
              }
            }

            // Visual highlight and alert banner
            setNewlyAddedIds(freshIds);
            setActiveAlertOrder(latestNewOrder);

            // Auto dismiss notification banner after 10s
            setTimeout(() => {
              setActiveAlertOrder(null);
            }, 10000);

            // Clear glowing border after 15s
            setTimeout(() => {
              setNewlyAddedIds(new Set());
            }, 15000);
          }
        } else {
          initialLoadDoneRef.current = true;
        }

        previousIdsRef.current = currentIds;
      }
    } catch (err) {
      console.warn('Erro ao consultar pedidos para TV:', err);
    } finally {
      setIsPolling(false);
    }
  };

  // Continuous live polling (every 3 seconds)
  useEffect(() => {
    fetchReadyOrders();
    const interval = setInterval(fetchReadyOrders, 3000);
    return () => clearInterval(interval);
  }, [soundMode]);

  // Fullscreen toggle
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

  // Copy TV Link
  const handleCopyTvUrl = () => {
    const url = getTvUrl();
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 3000);
  };

  // Handle Mark as Picked Up
  const handleMarkAsPickedUp = async (orderId: string) => {
    try {
      await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newStatus: 'RETIRADO',
          responsibleUser: 'Painel TV (Operador de Balcão)',
          notes: 'Retirado pelo franqueado/cliente no balcão.',
        }),
      });
      fetchReadyOrders();
    } catch (err) {
      console.warn('Erro ao marcar pedido como retirado:', err);
    }
  };

  const handleExit = () => {
    if (onExit) {
      onExit();
    } else {
      setCurrentView('store');
    }
  };

  return (
    <div
      onClick={() => {
        if (!isAudioUnlocked) {
          handleUnlockAudio();
        }
      }}
      className="min-h-screen bg-slate-950 text-white flex flex-col font-sans select-none overflow-x-hidden"
    >
      {/* Audio Unlock Banner for Browser Autoplay Safety */}
      {!isAudioUnlocked && (
        <div className="bg-amber-500 text-slate-950 px-6 py-2.5 flex items-center justify-between shadow-xl cursor-pointer hover:bg-amber-400 transition animate-pulse z-50">
          <div className="flex items-center gap-2.5 font-black text-xs sm:text-sm">
            <Volume2 className="w-5 h-5 animate-bounce" />
            <span>
              ÁUDIO DA TV EM ESPERA: Clique ou toque na tela para ativar o aviso sonoro automático de pedidos prontos!
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleUnlockAudio();
            }}
            className="bg-slate-950 text-amber-400 hover:bg-slate-900 px-4 py-1 rounded-xl text-xs font-black shadow"
          >
            Ativar Áudio Agora
          </button>
        </div>
      )}

      {/* New Order Broadcast Banner (When an order becomes READY) */}
      {activeAlertOrder && (
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-slate-950 px-6 py-3 shadow-2xl flex items-center justify-between border-b-4 border-amber-300 animate-in slide-in-from-top duration-300 z-40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-950 text-amber-400 rounded-xl flex items-center justify-center font-black text-xl animate-ping">
              🔔
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-slate-900 block">
                NOVO PEDIDO PRONTO PARA RETIRADA!
              </span>
              <span className="text-xl sm:text-2xl font-black text-slate-950 font-mono">
                PEDIDO #{activeAlertOrder.orderNumber} — {activeAlertOrder.franchiseeName}
              </span>
            </div>
          </div>
          <button
            onClick={() => setActiveAlertOrder(null)}
            className="text-xs font-black bg-slate-950/20 hover:bg-slate-950/30 text-slate-950 px-3 py-1.5 rounded-lg transition"
          >
            Fechar Aviso
          </button>
        </div>
      )}

      {/* Top Header Bar for TV */}
      <header className="bg-slate-900 border-b-4 border-amber-500 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-2xl">
        {/* Brand & Identity */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg ring-2 ring-amber-300">
            B
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight">
                BALBEC — PAINEL DE RETIRADA
              </h1>
              <span className="bg-emerald-600 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                AO VIVO NA TV
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-400 capitalize">
              {currentDate}
            </p>
          </div>
        </div>

        {/* Live Clock & Polling Status */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="bg-slate-950/80 border border-slate-800 px-4 py-2 rounded-2xl text-center shadow-inner">
            <div className="text-2xl sm:text-3xl font-black font-mono text-amber-300 tracking-wider">
              {currentTime || '--:--:--'}
            </div>
            <div className="text-[10px] font-mono text-slate-400 flex items-center justify-center gap-1 mt-0.5">
              <Radio className={`w-3 h-3 ${isPolling ? 'text-amber-400 animate-spin' : 'text-emerald-400'}`} />
              <span>Sincronizado: {lastSyncTime || '--:--'}</span>
            </div>
          </div>

          {/* Sound & Controls Toolbar */}
          <div className="flex items-center gap-2">
            {/* Sound Mode Selector */}
            <div className="bg-slate-800 p-1 rounded-xl border border-slate-700 flex items-center gap-1">
              <button
                id="btn-tv-sound-voice"
                onClick={(e) => {
                  e.stopPropagation();
                  setSoundMode('chime_and_voice');
                  handleTestSound();
                }}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  soundMode === 'chime_and_voice'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Sino + Chamada em Voz Português"
              >
                <Megaphone className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Sino + Voz</span>
              </button>

              <button
                id="btn-tv-sound-chime"
                onClick={(e) => {
                  e.stopPropagation();
                  setSoundMode('chime_only');
                  audioNotifier.playChime();
                }}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  soundMode === 'chime_only'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Apenas Sinal Sonoro (Chime)"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Só Sino</span>
              </button>

              <button
                id="btn-tv-sound-mute"
                onClick={(e) => {
                  e.stopPropagation();
                  setSoundMode('mute');
                }}
                className={`p-1.5 rounded-lg text-xs font-bold transition ${
                  soundMode === 'mute'
                    ? 'bg-red-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Silenciar áudio"
              >
                <VolumeX className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Test Audio Button */}
            <button
              id="btn-tv-test-audio"
              onClick={(e) => {
                e.stopPropagation();
                handleTestSound();
              }}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-slate-700 px-3 py-2 rounded-xl text-xs font-bold transition shadow-xs"
              title="Testar aviso sonoro da TV agora"
            >
              <Play className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="hidden lg:inline">Testar Som</span>
            </button>

            {/* Copy Permanent TV URL */}
            <button
              id="btn-tv-copy-url"
              onClick={(e) => {
                e.stopPropagation();
                handleCopyTvUrl();
              }}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-xl text-xs font-bold transition shadow-xs"
              title="Copiar URL permanente da TV (/tv)"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
              <span className="hidden sm:inline">{copiedUrl ? 'Link Copiado!' : 'Copiar Link da TV'}</span>
            </button>

            {/* Fullscreen button */}
            <button
              id="btn-tv-fullscreen"
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition"
              title="Modo Tela Cheia (F11)"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Exit TV button */}
            <button
              id="btn-tv-exit"
              onClick={(e) => {
                e.stopPropagation();
                handleExit();
              }}
              className="flex items-center gap-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-200 border border-red-800/60 px-3 py-2 rounded-xl text-xs font-bold transition"
              title="Sair do Painel da TV"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Ready Orders Canvas */}
      <main className="flex-1 p-6 sm:p-10 flex flex-col justify-start">
        {/* Section Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-emerald-500 animate-ping"></div>
            <h2 className="text-2xl sm:text-3xl font-black text-emerald-400 uppercase tracking-wide">
              PEDIDOS PRONTOS PARA RETIRADA ({readyOrders.length})
            </h2>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            {isWakeLockActive && (
              <span className="hidden sm:inline-flex items-center gap-1 bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800 text-slate-400">
                <Sun className="w-3 h-3 text-amber-400" />
                <span>Tela sempre ativa</span>
              </span>
            )}
            <span className="font-semibold text-slate-300">
              Apresente o número do seu pedido no balcão de entrega
            </span>
          </div>
        </div>

        {/* Empty State */}
        {readyOrders.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/20 my-auto min-h-[400px]">
            <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center text-slate-600 mb-6 ring-4 ring-slate-800 shadow-2xl">
              <Tv className="w-12 h-12 text-amber-500/60" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-200">
              Nenhum pedido aguardando retirada no momento
            </h3>
            <p className="text-base text-slate-400 mt-3 max-w-xl leading-relaxed">
              Assim que a equipe ou o administrador marcar os pedidos como <strong>PRONTO PARA RETIRADA</strong> no painel de controle, eles aparecerão aqui instantaneamente acompanhados do <strong>aviso sonoro na TV</strong>.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-slate-500 bg-slate-900/80 px-6 py-3 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>URL Dedicada da TV: <strong className="text-amber-400">{getTvUrl()}</strong></span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleTestSound();
                }}
                className="text-amber-400 hover:text-amber-300 font-bold underline"
              >
                Testar Alto-Falantes da TV
              </button>
            </div>
          </div>
        ) : (
          /* Grid of Ready Orders */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {readyOrders.map((order) => {
              const isNewlyAdded = newlyAddedIds.has(order.id);
              return (
                <div
                  key={order.id}
                  id={`tv-order-card-${order.orderNumber}`}
                  className={`relative bg-gradient-to-b from-slate-900 to-slate-950 border-2 rounded-3xl p-6 sm:p-7 shadow-2xl transition-all duration-500 flex flex-col justify-between ${
                    isNewlyAdded
                      ? 'border-amber-400 ring-4 ring-amber-400/60 shadow-amber-500/20 scale-[1.02] animate-pulse bg-gradient-to-b from-amber-950/40 to-slate-950'
                      : 'border-emerald-500/70 hover:border-emerald-400'
                  }`}
                >
                  {/* Status Header */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center gap-1.5 bg-emerald-500 text-slate-950 font-black text-xs sm:text-sm px-3.5 py-1 rounded-full uppercase tracking-wider shadow">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>PRONTO</span>
                    </span>

                    {order.readyAt && (
                      <span className="text-xs font-mono font-bold text-slate-400">
                        Pronto às {formatTime(order.readyAt)}
                      </span>
                    )}
                  </div>

                  {/* High-Contrast Giant Order Number */}
                  <div className="my-3">
                    <div className="text-6xl sm:text-7xl font-black text-amber-400 tracking-tight font-mono drop-shadow-md">
                      #{order.orderNumber}
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-white mt-3 truncate uppercase tracking-tight">
                      {order.franchiseeName}
                    </div>
                  </div>

                  {/* Summary Details & Counter Deliver Action */}
                  <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <div>
                      <span className="font-bold text-slate-300">
                        {order.items.reduce((sum, i) => sum + i.quantity, 0)} itens
                      </span>
                      <span className="text-[11px] text-slate-500 ml-1.5">
                        ({order.paymentMethod === 'cash_on_pickup' ? 'Dinheiro' : order.paymentMethod === 'pix' ? 'PIX' : 'Cartão'})
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsPickedUp(order.id);
                      }}
                      className="bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 text-xs font-black py-2 px-3.5 rounded-xl transition border border-slate-700 shadow-sm"
                      title="Marcar como entregue ao franqueado/cliente"
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

      {/* TV Bottom Footer with Connection Info */}
      <footer className="bg-slate-900 border-t border-slate-800 py-3.5 px-6 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="font-bold text-slate-200">Recepção de Pedidos Online</span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 hidden sm:inline">
            Modo de Som: <strong>{soundMode === 'chime_and_voice' ? 'Sino + Chamada por Voz (TTS)' : soundMode === 'chime_only' ? 'Somente Sino' : 'Mudo'}</strong>
          </span>
        </div>

        <div className="font-mono text-[11px] text-slate-400 flex items-center gap-2">
          <span>Link TV:</span>
          <span className="text-amber-400 font-bold bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
            {getTvUrl()}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCopyTvUrl();
            }}
            className="hover:text-white underline text-[10px]"
          >
            {copiedUrl ? 'Copiado!' : 'Copiar'}
          </button>
        </div>
      </footer>
    </div>
  );
};
