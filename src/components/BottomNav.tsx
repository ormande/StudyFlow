import { Home, Clock, Plus, Target, MoreHorizontal } from 'lucide-react';
import { TabType } from '../types';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: 'dashboard' as TabType, icon: Home, label: 'Início' },
    { id: 'timer' as TabType, icon: Clock, label: 'Timer' },
    { id: 'register' as TabType, icon: Plus, label: 'Registro' },
    { id: 'cycle' as TabType, icon: Target, label: 'Ciclo' },
    { id: 'more' as TabType, icon: MoreHorizontal, label: 'Mais' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 transition-colors duration-300">
      <div className="grid grid-cols-5 h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-500'
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] mt-1">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}