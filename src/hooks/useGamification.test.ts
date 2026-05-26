import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGamification } from './useGamification';
import { calculateXPFromLog, calculateXPFromLogs } from '../utils/xp';
import { StudyLog } from '../types';

describe('useGamification', () => {
  it('deve calcular XP de um log com 60 minutos e 10 acertos', () => {
    const testLog: StudyLog = {
      id: 'test-1',
      subjectId: 'subject-1',
      type: 'questoes',
      hours: 1,
      minutes: 0,
      seconds: 0,
      correct: 10,
      wrong: 0,
      blank: 0,
      timestamp: Date.now(),
      date: new Date().toISOString().split('T')[0],
    };

    const { result } = renderHook(() => useGamification([testLog], 0));

    // 60 min = 60 XP + 10 acertos × 5 = 50 XP → 110 XP
    expect(calculateXPFromLog(testLog)).toBe(110);
    expect(result.current.totalXP).toBe(110);
  });

  it('deve calcular XP corretamente para múltiplos logs', () => {
    const logs: StudyLog[] = [
      {
        id: 'test-1',
        subjectId: 'subject-1',
        type: 'teoria',
        hours: 0,
        minutes: 30,
        seconds: 0,
        timestamp: Date.now(),
        date: new Date().toISOString().split('T')[0],
      },
      {
        id: 'test-2',
        subjectId: 'subject-1',
        type: 'questoes',
        hours: 0,
        minutes: 15,
        seconds: 0,
        correct: 5,
        wrong: 2,
        blank: 1,
        timestamp: Date.now(),
        date: new Date().toISOString().split('T')[0],
      },
    ];

    const { result } = renderHook(() => useGamification(logs, 0));

    // Log 1: 30 XP | Log 2: 15 + 25 = 40 XP → 70 XP
    expect(calculateXPFromLogs(logs)).toBe(70);
    expect(result.current.totalXP).toBe(70);
  });

  it('deve somar XP de páginas lidas (2 XP por página)', () => {
    const log: StudyLog = {
      id: 'test-pages',
      subjectId: 'subject-1',
      type: 'teoria',
      hours: 0,
      minutes: 10,
      seconds: 0,
      pages: 5,
      timestamp: Date.now(),
      date: new Date().toISOString().split('T')[0],
    };

    const { result } = renderHook(() => useGamification([log], 0));

    // 10 min + 5 páginas × 2 = 10 + 10 = 20 XP
    expect(result.current.totalXP).toBe(20);
  });

  it('deve retornar o nível correto baseado no XP total', () => {
    const logs: StudyLog[] = [
      {
        id: 'test-1',
        subjectId: 'subject-1',
        type: 'teoria',
        hours: 1,
        minutes: 0,
        seconds: 0,
        timestamp: Date.now(),
        date: new Date().toISOString().split('T')[0],
      },
    ];

    const { result } = renderHook(() => useGamification(logs, 0));

    expect(result.current.level.name).toBe('Ferro');
    expect(result.current.totalXP).toBe(60);
  });
});

describe('calculateXPFromLog', () => {
  it('deve estar alinhado com useGamification para qualquer log', () => {
    const log: StudyLog = {
      id: 'align-1',
      subjectId: 's1',
      type: 'questoes',
      hours: 0,
      minutes: 45,
      seconds: 30,
      correct: 3,
      pages: 2,
      timestamp: Date.now(),
      date: '2026-01-15',
    };

    const { result } = renderHook(() => useGamification([log], 0));

    // 45 min + 30s → floor(45.5) = 45 XP + 15 acertos + 4 páginas
    expect(calculateXPFromLog(log)).toBe(45 + 15 + 4);
    expect(result.current.totalXP).toBe(calculateXPFromLog(log));
  });
});
