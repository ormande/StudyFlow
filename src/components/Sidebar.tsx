import { Home, Timer, PenLine, Target, Trophy, BookOpen, Instagram } from 'lucide-react';
import { TabType } from '../types';

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const tabs = [
    { id: 'dashboard' as TabType, icon: Home, label: 'Dashboard' },
    { id: 'timer' as TabType, icon: Timer, label: 'Timer' },
    { id: 'register' as TabType, icon: PenLine, label: 'Registrar' },
    { id: 'cycle' as TabType, icon: Target, label: 'Ciclo' },
    { id: 'gamification' as TabType, icon: Trophy, label: 'Conquistas' },
  ];

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 z-40 transition-colors duration-300 shadow-lg">
      
      {/* Header / Logo */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-800 dark:text-white tracking-tight leading-none">
              StudyFlow
            </h1>
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Versão 1.5.0
            </p>
          </div>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <p className="px-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
          Menu Principal
        </p>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group relative overflow-hidden active:scale-95 ${
                isActive
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {/* Indicador lateral ativo */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-emerald-500 rounded-r-full" />
              )}

              <Icon
                size={20}
                className={`transition-transform duration-300 ${
                  isActive ? 'scale-110 stroke-[2.5]' : 'group-hover:scale-105'
                }`}
              />
              <span className={`font-medium transition-all ${isActive ? 'font-bold' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-[10px] font-semibold text-gray-800 dark:text-white mb-2">
            Desenvolvido por <strong className="text-emerald-600 dark:text-emerald-400">Kayke Paião</strong>
          </p>
          <a 
            href="https://instagram.com/paiao.kayke" 
            target="_blank" 
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline transition-colors"
          >
            <Instagram size={12} />
            @paiao.kayke
          </a>
          <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-2">Versão 1.5.0 • StudyFlow</p>
        </div>
      </div>
    </aside>
  );
}