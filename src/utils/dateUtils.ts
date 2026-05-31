/**
 * Utilitários para manipulação de datas em timezone local
 * Evita problemas com UTC e garante formato YYYY-MM-DD consistente
 */

/**
 * Retorna a data atual em formato YYYY-MM-DD usando timezone local
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Normaliza qualquer entrada de data de log para YYYY-MM-DD (fuso local).
 * Evita toISOString() que desloca o dia em UTC-3/UTC-4.
 */
export function normalizeLogDate(date?: string | null): string {
  if (!date) return getLocalDateString();

  const trimmed = date.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.includes("T")) {
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return getLocalDateString(parsed);
    }
  }

  const slashMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (slashMatch) {
    const [, d, m, y] = slashMatch;
    return `${y}-${m}-${d}`;
  }

  return getLocalDateString();
}

/** Interpreta YYYY-MM-DD como meia-noite no fuso local (sem shift UTC). */
export function parseLocalDateString(dateString: string): Date {
  const normalized = normalizeLogDate(dateString);
  const [year, month, day] = normalized.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Exibe YYYY-MM-DD em pt-BR (dd/mm/aaaa). */
export function formatLocalDateDisplay(dateString: string): string {
  if (!dateString) return "";
  const normalized = normalizeLogDate(dateString);
  const [year, month, day] = normalized.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("pt-BR");
}

/** Máscara dd/mm/aaaa enquanto o usuário digita (somente números). */
export function formatDateInputMask(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/** Converte dd/mm/aaaa completo em YYYY-MM-DD; retorna null se inválido ou incompleto. */
export function parseMaskedDateToIso(masked: string): string | null {
  const match = masked.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900) {
    return null;
  }

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Chave dd/mm para gráficos — derivada só de log.date. */
export function formatLocalDateChartKey(dateString: string): string {
  const normalized = normalizeLogDate(dateString);
  const [, month, day] = normalized.split("-");
  return `${day}/${month}`;
}

/** Hora local do registro (timestamp em ms); fallback meio-dia. */
export function getLogHourFromTimestamp(timestamp?: number | null): number {
  if (!timestamp) return 12;
  return new Date(timestamp).getHours();
}

/**
 * Retorna a data de ontem em formato YYYY-MM-DD usando timezone local
 */
export function getYesterdayDateString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return getLocalDateString(yesterday);
}

/**
 * Retorna a data de amanhã em formato YYYY-MM-DD usando timezone local
 */
export function getTomorrowDateString(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return getLocalDateString(tomorrow);
}

/**
 * Calcula a diferença em dias entre duas datas (YYYY-MM-DD)
 * Resultado positivo = data1 é mais recente que data2
 */
export function getDaysDifference(
  dateString1: string,
  dateString2: string
): number {
  const date1 = new Date(dateString1 + "T00:00:00");
  const date2 = new Date(dateString2 + "T00:00:00");
  const diffTime = date1.getTime() - date2.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Retorna data anterior em formato YYYY-MM-DD
 */
export function getPreviousDateString(dateString: string): string {
  const date = new Date(dateString + "T00:00:00");
  date.setDate(date.getDate() - 1);
  return getLocalDateString(date);
}

/**
 * Retorna data posterior em formato YYYY-MM-DD
 */
export function getNextDateString(dateString: string): string {
  const date = new Date(dateString + "T00:00:00");
  date.setDate(date.getDate() + 1);
  return getLocalDateString(date);
}

/**
 * Intervalo de datas para filtros do histórico (fuso local).
 * - Hoje (1): somente o dia atual
 * - 7D, 30D…: últimos N dias de calendário incluindo hoje
 */
export function getLogDateRangeFilter(days: number | null): {
  from: string | null;
  to: string | null;
} {
  if (days === null) {
    return { from: null, to: null };
  }

  const today = getLocalDateString();

  if (days === 1) {
    return { from: today, to: today };
  }

  const fromDate = new Date();
  fromDate.setHours(0, 0, 0, 0);
  fromDate.setDate(fromDate.getDate() - (days - 1));
  return { from: getLocalDateString(fromDate), to: null };
}

/** Minutos totais de um registro de estudo. */
export function getLogTotalMinutes(log: {
  hours?: number;
  minutes?: number;
  seconds?: number;
}): number {
  return (
    (log.hours || 0) * 60 +
    (log.minutes || 0) +
    Math.floor((log.seconds || 0) / 60)
  );
}

/** Data local (YYYY-MM-DD) em que o ciclo atual começou. */
export function getCycleStartDateString(cycleStartDate: number): string {
  return getLocalDateString(new Date(cycleStartDate));
}

/** Registro pertence ao ciclo atual (usa log.date, não timestamp). */
export function isLogInCurrentCycle(
  log: { date: string },
  cycleStartDate: number
): boolean {
  return normalizeLogDate(log.date) >= getCycleStartDateString(cycleStartDate);
}

/**
 * Verifica se a data é hoje
 */
export function isToday(dateString: string): boolean {
  return dateString === getLocalDateString();
}

/**
 * Verifica se a data é ontem
 */
export function isYesterday(dateString: string): boolean {
  return dateString === getYesterdayDateString();
}

/**
 * Calcula a sequência atual (streak) de dias consecutivos com estudo
 * Baseado na lógica correta do HeatmapModal
 * @param logs Array de logs de estudo
 * @param maxDays Número máximo de dias para verificar (padrão: 365)
 * @returns Número de dias consecutivos estudados (do dia mais recente para trás)
 */
export function calculateCurrentStreak(
  logs: Array<{ date: string }>,
  maxDays: number = 365
): number {
  if (logs.length === 0) return 0;

  // Agrupar logs por data (YYYY-MM-DD)
  const groupedByDate: Record<string, boolean> = {};
  logs.forEach((log) => {
    groupedByDate[log.date] = true;
  });

  // Gerar array de últimos N dias (do mais antigo para o mais recente)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysArray: Date[] = [];
  for (let i = maxDays - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    daysArray.push(date);
  }

  // Calcular sequência atual (do dia mais recente para trás)
  let currentStreak = 0;
  for (let i = daysArray.length - 1; i >= 0; i--) {
    const dateStr = getLocalDateString(daysArray[i]);
    const hasStudy = groupedByDate[dateStr] || false;

    if (hasStudy) {
      currentStreak++;
    } else {
      break;
    }
  }

  return currentStreak;
}