import { Home, Clock, Plus, Target, MoreHorizontal, Trophy } from 'lucide-react';
import { TabType } from '../types';
import { motion } from 'framer-motion';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  pendingAchievementsCount?: number;
}

export default function BottomNav({ activeTab, onTabChange, pendingAchievementsCount = 0 }: BottomNavProps) {
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
          const Icon = tab.id === 'more' ? Trophy : tab.icon;
          const isActive = activeTab === tab.id;
          const showBadge = tab.id === 'more' && pendingAchievementsCount > 0;

          // Mapear IDs do tour
          const tourIdMap: Record<string, string> = {
            dashboard: 'nav-dashboard',
            cycle: 'nav-cycle',
            timer: 'nav-timer',
            register: 'nav-register',
            more: 'nav-more',
            history: 'nav-history',
          };
          const tourId = tourIdMap[tab.id] || undefined;
          
          // #region agent log
          if (tourId) {
            fetch('http://127.0.0.1:7242/ingest/9795e9e2-8e7e-49d6-a28d-cdbcb2b11e2f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BottomNav.tsx:37',message:'BottomNav button rendering',data:{tabId:tab.id,tourId,willHaveId:!!tourId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
          }
          // #endregion

          return (
            <button
              key={tab.id}
              id={tourId}
              onClick={() => {
                if (tab.id === 'more' && pendingAchievementsCount > 0) {
                  onTabChange('achievements');
                } else {
                  onTabChange(tab.id);
                }
              }}
              className={`relative flex flex-col items-center justify-center transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-500'
              }`}
            >
              {tab.id === 'more' && showBadge ? (
                <Trophy size={20} />
              ) : (
                <Icon size={20} />
              )}
              <span className="text-[10px] mt-1">{tab.id === 'more' && showBadge ? 'Conquistas' : tab.label}</span>
              
              {/* Badge vermelha */}
              {showBadge && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg"
                >
                  {pendingAchievementsCount > 9 ? '9+' : pendingAchievementsCount}
                </motion.span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}