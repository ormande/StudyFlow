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
