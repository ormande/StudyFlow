import { StudyLog } from '../types';

/**
 * Regras oficiais de XP:
 * - 1 minuto estudado = 1 XP
 * - 1 questão correta = 5 XP
 * - 1 página lida = 2 XP
 */
export function calculateXPFromLog(log: StudyLog): number {
  const totalMinutes =
    (log.hours || 0) * 60 + (log.minutes || 0) + (log.seconds || 0) / 60;
  const xpFromTime = Math.floor(totalMinutes);
  const xpFromQuestions = (log.correct || 0) * 5;
  const xpFromPages = (log.pages || 0) * 2;

  return xpFromTime + xpFromQuestions + xpFromPages;
}

export function calculateXPFromLogs(logs: StudyLog[]): number {
  return logs.reduce((sum, log) => sum + calculateXPFromLog(log), 0);
}
