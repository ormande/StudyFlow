import React, { createContext, useContext, ReactNode } from 'react';
import { StudyLog } from '../types';
import { useXP } from '../hooks/useXP';
import { Elo } from '../types/elo';

interface XPContextData {
  totalXP: number;
  xpHistory: any[];
  progress: any;
  isLoading: boolean;
  addXP: (amount: number, reason: string, icon: string, isBonus?: boolean) => void;
  refreshXP: () => void;
}

const XPContext = createContext<XPContextData | undefined>(undefined);

interface XPProviderProps {
  children: ReactNode;
  logs: StudyLog[];
  userId?: string;
}

export function XPProvider({
  children,
  logs,
  userId
}: XPProviderProps) {
  const xpData = useXP({
    logs,
    userId
  });

  return (
    <XPContext.Provider value={xpData}>
      {children}
    </XPContext.Provider>
  );
}

export function useXPContext() {
  const context = useContext(XPContext);
  if (!context) {
    throw new Error('useXPContext must be used within XPProvider');
  }
  return context;
}
