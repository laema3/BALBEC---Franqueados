import { StoreScheduleSettings, DaySchedule, DayOfWeek } from '../types.js';

export const DEFAULT_STORE_SCHEDULE: StoreScheduleSettings = {
  enabled: true,
  manualOverride: 'auto',
  forceReason: '',
  closedMessage: 'No momento nossa loja de fábrica está fechada para novos pedidos. Consulte nossos horários de atendimento.',
  blockOrdersWhenClosed: true,
  days: [
    { day: 'monday', dayLabel: 'Segunda-feira', isOpen: true, openTime: '08:00', closeTime: '18:00' },
    { day: 'tuesday', dayLabel: 'Terça-feira', isOpen: true, openTime: '08:00', closeTime: '18:00' },
    { day: 'wednesday', dayLabel: 'Quarta-feira', isOpen: true, openTime: '08:00', closeTime: '18:00' },
    { day: 'thursday', dayLabel: 'Quinta-feira', isOpen: true, openTime: '08:00', closeTime: '18:00' },
    { day: 'friday', dayLabel: 'Sexta-feira', isOpen: true, openTime: '08:00', closeTime: '18:00' },
    { day: 'saturday', dayLabel: 'Sábado', isOpen: true, openTime: '08:00', closeTime: '14:00' },
    { day: 'sunday', dayLabel: 'Domingo', isOpen: false, openTime: '08:00', closeTime: '12:00' },
  ],
};

const DAY_MAP: Record<number, DayOfWeek> = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
};

export interface StoreStatusResult {
  isOpen: boolean;
  statusLabel: string;
  statusDescription: string;
  badgeClass: string;
  isOverride: boolean;
  currentDayLabel: string;
  currentTimeString: string;
  todaySchedule?: DaySchedule;
}

/**
 * Checks if the store is open right now according to the schedule configuration.
 */
export function checkStoreStatus(schedule?: StoreScheduleSettings | null): StoreStatusResult {
  const currentSchedule = schedule || DEFAULT_STORE_SCHEDULE;
  
  // Format current local time in Brazil/local
  const now = new Date();
  const dayOfWeekIndex = now.getDay();
  const currentDayKey = DAY_MAP[dayOfWeekIndex] || 'monday';
  
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMinutes = String(now.getMinutes()).padStart(2, '0');
  const currentTimeString = `${currentHours}:${currentMinutes}`;

  const todaySchedule = currentSchedule.days.find((d) => d.day === currentDayKey) || {
    day: currentDayKey,
    dayLabel: 'Hoje',
    isOpen: true,
    openTime: '08:00',
    closeTime: '18:00',
  };

  // 1. Check if schedule control is disabled
  if (!currentSchedule.enabled) {
    return {
      isOpen: true,
      statusLabel: 'Loja Aberta',
      statusDescription: 'Horário livre de atendimento (Controle automático desligado)',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      isOverride: false,
      currentDayLabel: todaySchedule.dayLabel,
      currentTimeString,
      todaySchedule,
    };
  }

  // 2. Check manual overrides
  if (currentSchedule.manualOverride === 'force_open') {
    return {
      isOpen: true,
      statusLabel: 'Aberta (Modo Manual)',
      statusDescription: 'Abertura manual forçada pelo administrador',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      isOverride: true,
      currentDayLabel: todaySchedule.dayLabel,
      currentTimeString,
      todaySchedule,
    };
  }

  if (currentSchedule.manualOverride === 'force_closed') {
    return {
      isOpen: false,
      statusLabel: 'Fechada (Modo Manual)',
      statusDescription: currentSchedule.forceReason || 'Fechamento temporário acionado pelo administrador',
      badgeClass: 'bg-red-100 text-red-800 border-red-300',
      isOverride: true,
      currentDayLabel: todaySchedule.dayLabel,
      currentTimeString,
      todaySchedule,
    };
  }

  // 3. Automatic calculation based on Day and Hours
  if (!todaySchedule.isOpen) {
    return {
      isOpen: false,
      statusLabel: 'Loja Fechada',
      statusDescription: `Fechada aos ${todaySchedule.dayLabel.toLowerCase()}s`,
      badgeClass: 'bg-slate-200 text-slate-700 border-slate-300',
      isOverride: false,
      currentDayLabel: todaySchedule.dayLabel,
      currentTimeString,
      todaySchedule,
    };
  }

  const { openTime, closeTime } = todaySchedule;

  // Compare HH:mm
  if (currentTimeString >= openTime && currentTimeString < closeTime) {
    return {
      isOpen: true,
      statusLabel: 'Loja Aberta',
      statusDescription: `Atendimento hoje até às ${closeTime}`,
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      isOverride: false,
      currentDayLabel: todaySchedule.dayLabel,
      currentTimeString,
      todaySchedule,
    };
  }

  if (currentTimeString < openTime) {
    return {
      isOpen: false,
      statusLabel: 'Loja Fechada',
      statusDescription: `Abre hoje às ${openTime}`,
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
      isOverride: false,
      currentDayLabel: todaySchedule.dayLabel,
      currentTimeString,
      todaySchedule,
    };
  }

  // currentTimeString >= closeTime
  return {
    isOpen: false,
    statusLabel: 'Loja Fechada',
    statusDescription: `Expediente de hoje encerrou às ${closeTime}`,
    badgeClass: 'bg-slate-200 text-slate-700 border-slate-300',
    isOverride: false,
    currentDayLabel: todaySchedule.dayLabel,
    currentTimeString,
    todaySchedule,
  };
}
