import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGamification } from './useGamification';
import { StudyLog } from '../types';

describe('useGamification', () => {
  it('deve calcular corretamente o XP de um log com 60 minutos e 10 acertos', () => {
    // Arrange: Criar um log de teste
    // 60 minutos = 1 hora
    // 10 questões corretas
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

    // Act: Calcular gamificação usando renderHook
    const { result } = renderHook(() => useGamification([testLog], 0));

    // Assert: Verificar o cálculo de XP
    // XP esperado:
    // - 60 minutos de estudo = 60 XP
    // - 10 questões registradas = 10 * 2 = 20 XP
    // - 10 questões corretas = 10 * 5 = 50 XP
    // Total = 60 + 20 + 50 = 130 XP
    expect(result.current.totalXP).toBe(130);
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

    // XP esperado:
    // Log 1: 30 minutos = 30 XP
    // Log 2: 15 minutos = 15 XP + (5+2+1)*2 = 16 XP de questões + 5*5 = 25 XP de acertos
    // Total = 30 + 15 + 16 + 25 = 86 XP
    expect(result.current.totalXP).toBe(86);
  });

  it('deve retornar o nível correto baseado no XP total', () => {
    // Criar logs suficientes para atingir um nível específico
    // Ferro: 0-500 XP
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

    // 60 XP deve estar no nível Ferro
    expect(result.current.level.name).toBe('Ferro');
    expect(result.current.totalXP).toBe(60);
  });
});
