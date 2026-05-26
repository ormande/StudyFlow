import { describe, it, expect } from 'vitest';
import { calculateXPFromLog, calculateXPFromLogs } from './xp';
import { StudyLog } from '../types';

describe('calculateXPFromLog', () => {
  it('aplica as regras oficiais de XP', () => {
    const log: StudyLog = {
      id: '1',
      subjectId: 's1',
      type: 'questoes',
      hours: 0,
      minutes: 45,
      seconds: 30,
      correct: 3,
      wrong: 10,
      blank: 5,
      pages: 2,
      timestamp: Date.now(),
      date: '2026-01-15',
    };

    // 45 min + 30s → 45 XP; acertos 15; páginas 4; erradas/branco = 0 XP
    expect(calculateXPFromLog(log)).toBe(64);
    expect(calculateXPFromLogs([log])).toBe(64);
  });
});
