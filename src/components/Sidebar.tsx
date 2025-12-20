import { 
  Home, Clock, Plus, Target, Trophy, Star, BarChart2, History, 
  Palette, Target as TargetIcon, MessageSquare, HelpCircle, Lock, LogOut, Settings, Info 
} from 'lucide-react';
import { TabType } from '../types';
import { motion } from 'framer-motion';

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  session: any;
  pendingAchievementsCount?: number;
  onOpenFeedback?: () => void;
  onOpenHistory?: () => void;
  onOpenTutorial?: () => void;
  onOpenSecurity?: () => void;
  onNavigateToStats?: () => void;
  onNavigateToAppearance?: () => void;
  onNavigateToGoals?: () => void;
  onNavigateToAbout?: () => void;
  onOpenSettings?: () => void;
  onLogout?: () => void;
  onNavigateToProfile?: () => void;
}

export default function Sidebar({ 
  activeTab, 
  onTabChange, 
  session,
  pendingAchievementsCount = 0,
  onOpenFeedback,
  onOpenHistory,
  onOpenTutorial,
  onOpenSecurity,
  onNavigateToStats,
  onNavigateToAppearance,
  onNavigateToGoals,
  onNavigateToAbout,
  onOpenSettings,
  onLogout,
  onNavigateToProfile,
}: SidebarProps) {
  const user = {
    name: session?.user?.user_metadata?.name || session?.user?.email?.split('@')[0] || 'Usuário',
    email: session?.user?.email || '',
  };

  // Itens organizados em grupos lógicos sem títulos
  const menuItems = [
    // GRUPO 1: PRINCIPAL
    { id: 'dashboard' as TabType, icon: Home, label: 'Dashboard' },
    { id: 'cycle' as TabType, icon: Target, label: 'Ciclo' },
    { id: 'timer' as TabType, icon: Clock, label: 'Timer' },
    { id: 'register' as TabType, icon: Plus, label: 'Registrar' },
    
    // GRUPO 2: DADOS (mt-6)
    { id: 'stats' as TabType, icon: BarChart2, label: 'Estatísticas', onClick: onNavigateToStats, mt: true },
    { id: 'history' as TabType, icon: History, label: 'Histórico', onClick: onOpenHistory },
    { id: 'goals' as TabType, icon: TargetIcon, label: 'Metas', onClick: onNavigateToGoals },
    
    // GRUPO 3: GAMIFICAÇÃO (mt-6)
    { id: 'achievements' as TabType, icon: Trophy, label: 'Conquistas', showBadge: true, badgeCount: (pendingAchievementsCount && pendingAchievementsCount > 0) ? pendingAchievementsCount : undefined, mt: true },
    { id: 'elo' as TabType, icon: Star, label: 'Elo' },
    
    // GRUPO 4: SISTEMA (mt-6)
    { id: 'appearance' as TabType, icon: Palette, label: 'Aparência', onClick: onNavigateToAppearance, mt: true },
    { id: 'security' as TabType, icon: Lock, label: 'Segurança', onClick: onOpenSecurity },
    { id: 'settings' as TabType, icon: Settings, label: 'Configurações', onClick: onOpenSettings },
    
    // GRUPO 5: RODAPÉ (mt-6)
    { id: 'tutorial' as TabType, icon: HelpCircle, label: 'Tutorial', onClick: onOpenTutorial, mt: true },
    { id: 'feedback' as TabType, icon: MessageSquare, label: 'Feedback', onClick: onOpenFeedback },
    { id: 'about' as TabType, icon: Info, label: 'Sobre', onClick: onNavigateToAbout },
  ];

  const renderNavButton = (
    id: TabType | string,
    icon: any,
    label: string,
    onClick?: () => void,
    showBadge?: boolean,
    badgeCount?: number
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
        <div className="relative">
          <Icon size={20} className={`transition-transform duration-300 ${isActive ? 'scale-110 stroke-[2.5]' : 'group-hover:scale-105'}`} />
          {showBadge && badgeCount !== undefined && badgeCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg"
            >
              {badgeCount > 9 ? '9+' : badgeCount}
            </motion.span>
          )}
        </div>
        <span className={`text-base font-medium transition-all flex-1 ${isActive ? 'font-bold' : ''}`}>
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
          <img src="/icon-192.png" alt="Logo" className="w-8 h-8 rounded-lg" />
          <div>
            <h1 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">StudyFlow</h1>
            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Versão 1.5.0
            </p>
          </div>
        </div>
      </div>

      {/* Navegação Principal */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2" data-tour="navigation">
        {menuItems.map((item) => {
          const button = renderNavButton(
            item.id,
            item.icon,
            item.label,
            item.onClick,
            item.showBadge,
            item.badgeCount
          );
          
          // Adicionar espaçamento mt-6 para itens que marcam início de grupo
          return (
            <div key={item.id} className={item.mt ? 'mt-6' : ''}>
              {button}
            </div>
          );
        })}
      </nav>

      {/* Footer - Perfil + Sair */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        {onNavigateToProfile ? (
          <button
            onClick={onNavigateToProfile}
            className="w-full flex items-center gap-3 mb-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold flex-shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
            </div>
          </button>
        ) : (
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold flex-shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
        )}
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
