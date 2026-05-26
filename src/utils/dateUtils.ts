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