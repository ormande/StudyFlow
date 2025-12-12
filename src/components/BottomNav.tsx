import { Home, Timer, PenLine, Target, Trophy } from 'lucide-react';
import { TabType } from '../types';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: 'dashboard' as TabType, icon: Home, label: 'Dashboard' },
    { id: 'timer' as TabType, icon: Timer, label: 'Timer' },
    { id: 'register' as TabType, icon: PenLine, label: 'Registrar' },
    { id: 'cycle' as TabType, icon: Target, label: 'Ciclo' },
    { id: 'gamification' as TabType, icon: Trophy, label: 'Conquistas' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 safe-area-bottom z-50 transition-colors duration-300 shadow-[0_-1px_10px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center h-14 md:h-16 max-w-lg md:max-w-5xl mx-auto px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`group flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 active:scale-90 outline-none rounded-xl ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              {/* Container do Ícone (Pula e ganha fundo quando ativo) */}
              <div className={`transition-all duration-300 p-1.5 rounded-xl ${
                  isActive ? 'bg-emerald-50 dark:bg-emerald-900/20 -translate-y-1' : 'translate-y-0'
              }`}>
                <Icon
                  className={`w-6 h-6 transition-transform duration-300 ${
                    isActive ? 'scale-110 stroke-[2.5]' : 'group-hover:scale-105'
                  }`}
                />
              </div>

              {/* Label (Texto) */}
              <span className={`text-[10px] transition-all duration-300 ${
                  isActive ? 'font-bold opacity-100 translate-y-0' : 'font-medium opacity-80 translate-y-1'
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}