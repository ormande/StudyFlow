import { 
  Home, Clock, Plus, Target, Trophy, Star, BarChart2, History, 
  Palette, Target as TargetIcon, MessageSquare, HelpCircle, Lock, LogOut, BookOpen, Settings 
} from 'lucide-react';
import { TabType } from '../types';
import { motion } from 'framer-motion';

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  session: any;
  onOpenFeedback?: () => void;
  onOpenHistory?: () => void;
  onOpenTutorial?: () => void;
  onOpenSecurity?: () => void;
  onOpenStatistics?: () => void;
  onOpenAppearance?: () => void;
  onOpenGoals?: () => void;
  onOpenSettings?: () => void;
  onLogout?: () => void;
}

export default function Sidebar({ 
  activeTab, 
  onTabChange, 
  session,
  onOpenFeedback,
  onOpenHistory,
  onOpenTutorial,
  onOpenSecurity,
  onOpenStatistics,
  onOpenAppearance,
  onOpenGoals,
  onOpenSettings,
  onLogout,
}: SidebarProps) {
  const user = {
    name: session?.user?.user_metadata?.name || session?.user?.email?.split('@')[0] || 'Usuário',
    email: session?.user?.email || '',
  };

  const mainTabs = [
    { id: 'dashboard' as TabType, icon: Home, label: 'Dashboard' },
    { id: 'timer' as TabType, icon: Clock, label: 'Timer' },
    { id: 'register' as TabType, icon: Plus, label: 'Registrar' },
    { id: 'cycle' as TabType, icon: Target, label: 'Ciclo' },
  ];

  const renderNavButton = (
    id: TabType | string,
    icon: any,
    label: string,
    onClick?: () => void
  ) => {
    const Icon = icon;
    const isActive = activeTab === id;
    const handleClick = onClick || (() => onTabChange(id as TabType));

    return (
      <motion.button
        key={id}
        onClick={handleClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${
          isActive
            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'
        }`}
      >
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-emerald-500 rounded-r-full" />
        )}
        <Icon size={20} className={`transition-transform duration-300 ${isActive ? 'scale-110 stroke-[2.5]' : 'group-hover:scale-105'}`} />
        <span className={`font-medium transition-all ${isActive ? 'font-bold' : ''}`}>
          {label}
        </span>
      </motion.button>
    );
  };

  return (
    <aside className="hidden md:flex md:flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen fixed left-0 top-0 z-40">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">StudyFlow</h1>
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Versão 1.5.0
            </p>
          </div>
        </div>
      </div>

      {/* Navegação Principal */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2" data-tour="navigation">
        {mainTabs.map((tab) => renderNavButton(tab.id, tab.icon, tab.label))}

        {/* Separador */}
        <div className="my-4 border-t border-gray-200 dark:border-gray-700"></div>
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase px-2 mb-2">Gamificação</p>
        {renderNavButton('gamification', Trophy, 'Conquistas')}
        {renderNavButton('gamification', Star, 'Ranking & Elo', () => onTabChange('gamification'))}

        <div className="my-4 border-t border-gray-200 dark:border-gray-700"></div>
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase px-2 mb-2">Dados</p>
        {renderNavButton('stats', BarChart2, 'Estatísticas', onOpenStatistics)}
        {renderNavButton('history', History, 'Histórico', onOpenHistory)}

        <div className="my-4 border-t border-gray-200 dark:border-gray-700"></div>
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase px-2 mb-2">Configurações</p>
        {renderNavButton('settings', Settings, 'Configurações', onOpenSettings)}
        {renderNavButton('appearance', Palette, 'Aparência', onOpenAppearance)}
        {renderNavButton('goals', TargetIcon, 'Metas', onOpenGoals)}
        {renderNavButton('feedback', MessageSquare, 'Dar Feedback', onOpenFeedback)}
        {renderNavButton('tutorial', HelpCircle, 'Tutorial', onOpenTutorial)}
        {renderNavButton('security', Lock, 'Segurança', onOpenSecurity)}
      </nav>

      {/* Footer - Perfil + Sair */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold flex-shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
          </div>
        </div>
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full text-red-600 dark:text-red-400 text-sm font-semibold flex items-center justify-center gap-2 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
          >
            <LogOut size={16} />
            Sair
          </button>
        )}
      </div>
    </aside>
  );
}
