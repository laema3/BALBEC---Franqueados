import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  Save,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  ShieldAlert,
  Info,
  Store,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { DayOfWeek, DaySchedule, StoreScheduleSettings } from '../../types.js';
import { checkStoreStatus, DEFAULT_STORE_SCHEDULE } from '../../utils/schedule.js';

export const StoreScheduleManager: React.FC = () => {
  const { settings, refreshSettings, showToast } = useApp();

  const [schedule, setSchedule] = useState<StoreScheduleSettings>(() => {
    return settings?.storeSchedule || DEFAULT_STORE_SCHEDULE;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(() => checkStoreStatus(schedule));

  // Sync state if settings update
  useEffect(() => {
    if (settings?.storeSchedule) {
      setSchedule(settings.storeSchedule);
      setCurrentStatus(checkStoreStatus(settings.storeSchedule));
    }
  }, [settings?.storeSchedule]);

  // Update live status every 15 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStatus(checkStoreStatus(schedule));
    }, 15000);
    return () => clearInterval(timer);
  }, [schedule]);

  const handleDayChange = (dayKey: DayOfWeek, updates: Partial<DaySchedule>) => {
    setSchedule((prev) => {
      const newDays = prev.days.map((d) => (d.day === dayKey ? { ...d, ...updates } : d));
      const updated = { ...prev, days: newDays };
      setCurrentStatus(checkStoreStatus(updated));
      return updated;
    });
  };

  const handleApplyPresetCommercial = () => {
    setSchedule((prev) => {
      const newDays: DaySchedule[] = [
        { day: 'monday', dayLabel: 'Segunda-feira', isOpen: true, openTime: '08:00', closeTime: '18:00' },
        { day: 'tuesday', dayLabel: 'Terça-feira', isOpen: true, openTime: '08:00', closeTime: '18:00' },
        { day: 'wednesday', dayLabel: 'Quarta-feira', isOpen: true, openTime: '08:00', closeTime: '18:00' },
        { day: 'thursday', dayLabel: 'Quinta-feira', isOpen: true, openTime: '08:00', closeTime: '18:00' },
        { day: 'friday', dayLabel: 'Sexta-feira', isOpen: true, openTime: '08:00', closeTime: '18:00' },
        { day: 'saturday', dayLabel: 'Sábado', isOpen: true, openTime: '08:00', closeTime: '14:00' },
        { day: 'sunday', dayLabel: 'Domingo', isOpen: false, openTime: '08:00', closeTime: '12:00' },
      ];
      const updated = { ...prev, days: newDays };
      setCurrentStatus(checkStoreStatus(updated));
      return updated;
    });
    showToast('Horário Comercial Padrão aplicado (Seg a Sex: 08h-18h | Sáb: 08h-14h | Dom: Fechado).');
  };

  const handleCopyMondayToWeekdays = () => {
    const monday = schedule.days.find((d) => d.day === 'monday');
    if (!monday) return;

    setSchedule((prev) => {
      const weekdays: DayOfWeek[] = ['tuesday', 'wednesday', 'thursday', 'friday'];
      const newDays = prev.days.map((d) => {
        if (weekdays.includes(d.day)) {
          return { ...d, isOpen: monday.isOpen, openTime: monday.openTime, closeTime: monday.closeTime };
        }
        return d;
      });
      const updated = { ...prev, days: newDays };
      setCurrentStatus(checkStoreStatus(updated));
      return updated;
    });
    showToast('Horários de Segunda-feira copiados para Terça, Quarta, Quinta e Sexta!');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeSchedule: schedule }),
      });

      if (res.ok) {
        await refreshSettings();
        setCurrentStatus(checkStoreStatus(schedule));
        showToast('Horários e regras de abertura/fechamento salvos com sucesso!');
      } else {
        showToast('Erro ao salvar horários de funcionamento.');
      }
    } catch {
      showToast('Falha na comunicação com o servidor.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Real-time Store Status Banner */}
      <div
        className={`rounded-2xl p-6 text-slate-900 border shadow-md transition ${
          currentStatus.isOpen
            ? 'bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 text-white border-emerald-400'
            : 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border-slate-700'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={`p-3.5 rounded-2xl shrink-0 ${
                currentStatus.isOpen ? 'bg-white/20 text-white' : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}
            >
              <Store className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                    currentStatus.isOpen
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'bg-red-500 text-white shadow-xs'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${currentStatus.isOpen ? 'bg-emerald-600 animate-pulse' : 'bg-white'}`}></span>
                  {currentStatus.statusLabel}
                </span>

                {currentStatus.isOverride && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400 text-slate-950 uppercase">
                    Modo Manual Ativo
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-black mt-1.5 text-white tracking-tight">
                {currentStatus.isOpen ? 'Loja de Salgados BALBEC Aberta' : 'Loja de Salgados BALBEC Fechada'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-2xl leading-relaxed">
                {currentStatus.statusDescription} • Horário local atual: <strong className="text-white">{currentStatus.currentTimeString}</strong> ({currentStatus.currentDayLabel})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto bg-black/20 p-2 rounded-xl backdrop-blur-xs border border-white/10">
            <div className="text-right px-2">
              <span className="text-[10px] uppercase tracking-wider block text-slate-300 font-bold">Controle Automático</span>
              <span className="text-xs font-black text-white">
                {schedule.enabled ? 'Ativo por Horários' : 'Desativado (Sempre Aberta)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Card: Modo de Funcionamento & Exceções */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                Regras de Abertura e Fechamento
              </h3>
              <p className="text-xs text-slate-500">
                Configure os dias da semana e os horários para o sistema abrir e fechar os pedidos automaticamente.
              </p>
            </div>

            <label className="flex items-center gap-3 cursor-pointer bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-700">Controle por Horários:</span>
              <input
                type="checkbox"
                checked={schedule.enabled}
                onChange={(e) => {
                  const updated = { ...schedule, enabled: e.target.checked };
                  setSchedule(updated);
                  setCurrentStatus(checkStoreStatus(updated));
                }}
                className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 border-slate-300"
              />
            </label>
          </div>

          {/* Modo Manual de Emergência */}
          <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200">
            <label className="block text-xs font-black uppercase tracking-wider text-amber-900 mb-2">
              Modo de Operação Imediato
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => {
                  const updated = { ...schedule, manualOverride: 'auto' as const };
                  setSchedule(updated);
                  setCurrentStatus(checkStoreStatus(updated));
                }}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  schedule.manualOverride === 'auto'
                    ? 'bg-amber-500 text-slate-950 font-bold border-amber-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-black">Automático (Recomendado)</div>
                <div className="text-[11px] opacity-80 mt-0.5">
                  Abre e fecha rigorosamente conforme a tabela abaixo.
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  const updated = { ...schedule, manualOverride: 'force_open' as const };
                  setSchedule(updated);
                  setCurrentStatus(checkStoreStatus(updated));
                }}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  schedule.manualOverride === 'force_open'
                    ? 'bg-emerald-600 text-white font-bold border-emerald-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-black">Forçar Aberta Agora</div>
                <div className="text-[11px] opacity-80 mt-0.5">
                  Mantém a loja recebendo pedidos mesmo fora do horário.
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  const updated = { ...schedule, manualOverride: 'force_closed' as const };
                  setSchedule(updated);
                  setCurrentStatus(checkStoreStatus(updated));
                }}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  schedule.manualOverride === 'force_closed'
                    ? 'bg-red-600 text-white font-bold border-red-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-black">Forçar Fechada Agora</div>
                <div className="text-[11px] opacity-80 mt-0.5">
                  Fecha a loja de imediato para feriados ou manutenções.
                </div>
              </button>
            </div>

            {schedule.manualOverride === 'force_closed' && (
              <div className="mt-3">
                <label className="block text-xs font-bold text-amber-900 mb-1">
                  Motivo do Fechamento Temporário (Exibido aos Franqueados):
                </label>
                <input
                  type="text"
                  value={schedule.forceReason || ''}
                  onChange={(e) => setSchedule({ ...schedule, forceReason: e.target.value })}
                  placeholder="Ex: Feriado Nacional de Páscoa / Manutenção programada da fábrica"
                  className="w-full text-xs p-2.5 rounded-xl border border-amber-300 bg-white"
                />
              </div>
            )}
          </div>

          {/* Quick Presets Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs font-bold text-slate-500">Ações Rápidas:</span>
            <button
              type="button"
              onClick={handleApplyPresetCommercial}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
            >
              Horário Comercial Padrão (08h às 18h)
            </button>
            <button
              type="button"
              onClick={handleCopyMondayToWeekdays}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
            >
              Copiar Segunda para Terça a Sexta
            </button>
          </div>
        </div>

        {/* Tabela de Dias da Semana */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Tabela Semanal de Funcionamento
              </h3>
              <p className="text-xs text-slate-500">
                Defina os horários de início e término do expediente para cada dia da semana.
              </p>
            </div>
            <Calendar className="w-5 h-5 text-slate-400" />
          </div>

          <div className="divide-y divide-slate-100">
            {schedule.days.map((dayItem) => {
              const isToday = currentStatus.todaySchedule?.day === dayItem.day;
              return (
                <div
                  key={dayItem.day}
                  className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${
                    isToday ? 'bg-amber-50/40' : 'hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-[180px]">
                    <button
                      type="button"
                      onClick={() => handleDayChange(dayItem.day, { isOpen: !dayItem.isOpen })}
                      className={`p-1 rounded-lg transition cursor-pointer ${
                        dayItem.isOpen ? 'text-emerald-600' : 'text-slate-400'
                      }`}
                      title={dayItem.isOpen ? 'Clique para fechar neste dia' : 'Clique para abrir neste dia'}
                    >
                      {dayItem.isOpen ? (
                        <ToggleRight className="w-7 h-7" />
                      ) : (
                        <ToggleLeft className="w-7 h-7" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900">{dayItem.dayLabel}</span>
                        {isToday && (
                          <span className="text-[10px] font-black uppercase bg-amber-500 text-slate-950 px-2 py-0.2 rounded-full">
                            Hoje
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-xs font-bold ${
                          dayItem.isOpen ? 'text-emerald-700' : 'text-slate-400'
                        }`}
                      >
                        {dayItem.isOpen ? 'Aberto para pedidos' : 'Fechado o dia todo'}
                      </span>
                    </div>
                  </div>

                  {/* Horários de Início e Término */}
                  {dayItem.isOpen ? (
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-bold">Abertura:</span>
                        <input
                          type="time"
                          value={dayItem.openTime}
                          onChange={(e) => handleDayChange(dayItem.day, { openTime: e.target.value })}
                          className="px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <span className="text-slate-400 font-bold">até</span>

                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-bold">Fechamento:</span>
                        <input
                          type="time"
                          value={dayItem.closeTime}
                          onChange={(e) => handleDayChange(dayItem.day, { closeTime: e.target.value })}
                          className="px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 italic">
                      Nenhum pedido recebido neste dia da semana.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Políticas de Envio e Mensagens */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-base font-black text-slate-900">Políticas de Atendimento e Pedidos</h3>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                Bloquear Finalização de Pedidos Quando a Loja Estiver Fechada
              </span>
              <span className="text-[11px] text-slate-500">
                Impede que os franqueados concluam o checkout fora do horário de atendimento cadastrado.
              </span>
            </div>
            <input
              type="checkbox"
              checked={schedule.blockOrdersWhenClosed}
              onChange={(e) => setSchedule({ ...schedule, blockOrdersWhenClosed: e.target.checked })}
              className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 border-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mensagem de Loja Fechada (Exibida aos Franqueados no Cardápio)
            </label>
            <textarea
              rows={2}
              value={schedule.closedMessage}
              onChange={(e) => setSchedule({ ...schedule, closedMessage: e.target.value })}
              className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
              placeholder="Digite a mensagem informativa exibida aos clientes..."
            />
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-400" />
            <span>As alterações entram em vigor imediatamente para todo o sistema e portal dos franqueados.</span>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-6 py-2.5 rounded-xl uppercase tracking-wider text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Salvando...' : 'Salvar Horários da Loja'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
