import { createContext, useContext, ReactNode, useState, useEffect, useRef } from 'react';
import { StudyLog } from '../types';
import { useXP } from '../hooks/useXP';
import { Elo, getEloByXP } from '../types/elo';

interface XPContextData {
  totalXP: number;
  xpHistory: any[];
  progress: any;
  isLoading: boolean;
  addXP: (amount: number, reason: string, icon: string, isBonus?: boolean) => void;
  removeXP: (amount: number, reason: string) => void;
  refreshXP: () => void;
  showUpgradeModal: boolean;
  newLevelData: Elo | null;
  oldLevelData: Elo | null;
  closeUpgradeModal: () => void;
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

  // Estados para o modal de upgrade
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [newLevelData, setNewLevelData] = useState<Elo | null>(null);
  const [oldLevelData, setOldLevelData] = useState<Elo | null>(null);
  
  // Ref para armazenar o nível anterior
  const prevLevelRef = useRef<Elo | null>(null);
  const isInitializedRef = useRef(false);

  // Detectar mudança de nível
  useEffect(() => {
    if (xpData.isLoading) return;

    const currentElo = getEloByXP(xpData.totalXP);
    
    // Inicializar o nível anterior na primeira renderização (sem disparar modal)
    if (!isInitializedRef.current) {
      prevLevelRef.current = currentElo;
      isInitializedRef.current = true;
      return;
    }

    // Verificar se o nível mudou E aumentou (subiu de elo)
    if (prevLevelRef.current && prevLevelRef.current.id !== currentElo.id) {
      // Verificar se realmente subiu (comparando índices dos elos)
      const eloOrder = ['bronze', 'prata', 'ouro', 'platina', 'diamante'];
      const prevIndex = eloOrder.indexOf(prevLevelRef.current.id);
      const currentIndex = eloOrder.indexOf(currentElo.id);
      
      // Só disparar se o índice atual for maior (subiu de nível)
      if (currentIndex > prevIndex) {
        setOldLevelData(prevLevelRef.current);
        setNewLevelData(currentElo);
        setShowUpgradeModal(true);
      }
    }

    // Atualizar o nível anterior
    prevLevelRef.current = currentElo;
  }, [xpData.totalXP, xpData.isLoading]);

  const closeUpgradeModal = () => {
    setShowUpgradeModal(false);
    setNewLevelData(null);
    setOldLevelData(null);
  };

  return (
    <XPContext.Provider value={{
      ...xpData,
      showUpgradeModal,
      newLevelData,
      oldLevelData,
      closeUpgradeModal,
    }}>
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
