import { motion } from 'framer-motion';
import { 
  Trophy, Star, BarChart3, History, Palette, Target, MessageSquare, 
  HelpCircle, Lock, LogOut, ChevronRight, Settings, User
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

interface MorePageProps {
  session: any;
  onNavigateToAchievements: () => void;
  onNavigateToElo: () => void;
  onNavigateToGoals: () => void;
  onNavigateToStats?: () => void;
  onNavigateToAppearance: () => void;
  onOpenHistory: () => void;
  onOpenFeedback: () => void;
  onOpenTutorial: () => void;
  onOpenSecurity: () => void;
  onOpenSettings: () => void;
  onNavigateToAbout?: () => void;
  onLogout: () => void;
  onNavigateToProfile?: () => void;
}

export default function MorePage({
  session,
  onNavigateToAchievements,
  onNavigateToElo,
  onNavigateToGoals,
  onNavigateToStats,
  onNavigateToAppearance,
  onOpenHistory,
  onOpenFeedback,
  onOpenTutorial,
  onOpenSecurity,
  onOpenSettings,
  onNavigateToAbout: _onNavigateToAbout,
  onLogout,
  onNavigateToProfile,
}: MorePageProps) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/9795e9e2-8e7e-49d6-a28d-cdbcb2b11e2f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MorePage.tsx:36',message:'MorePage props received',data:{hasOnNavigateToStats:!!onNavigateToStats,type:typeof onNavigateToStats,hasOnNavigateToGoals:!!onNavigateToGoals,hasOnNavigateToAchievements:!!onNavigateToAchievements},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  const { addToast } = useToast();

  const user = {
    name: session?.user?.user_metadata?.name || session?.user?.email?.split('@')[0] || 'Usuário',
    email: session?.user?.email || '',
  };

  const handleNavigateToAchievements = () => {
    onNavigateToAchievements();
  };

  const handleOpenHistory = () => {
    onOpenHistory();
  };

  const handleOpenFeedback = () => {
    onOpenFeedback();
  };

  const handleOpenTutorial = () => {
    onOpenTutorial();
  };

  const handleOpenSecurity = () => {
    onOpenSecurity();
  };

  const handleStatistics = () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/9795e9e2-8e7e-49d6-a28d-cdbcb2b11e2f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MorePage.tsx:64',message:'handleStatistics called',data:{onNavigateToStats:typeof onNavigateToStats,isFunction:typeof onNavigateToStats==='function'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    if (onNavigateToStats) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/9795e9e2-8e7e-49d6-a28d-cdbcb2b11e2f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MorePage.tsx:67',message:'Calling onNavigateToStats',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      onNavigateToStats();
    } else {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/9795e9e2-8e7e-49d6-a28d-cdbcb2b11e2f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MorePage.tsx:71',message:'onNavigateToStats is undefined',data:{onNavigateToStats},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      addToast('Navegação para estatísticas não disponível', 'error');
    }
  };

  const handleAppearance = () => {
    onNavigateToAppearance();
  };

  const handleGoals = () => {
    onNavigateToGoals();
  };

  const handleEditProfile = () => {
    addToast('Edição de perfil em breve!', 'info');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="max-w-lg mx-auto px-6 py-6 pb-24"
    >
      {/* Header - Perfil do usuário */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-5 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center text-white text-2xl font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{user.name}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
          </div>
        </div>
        <button
          onClick={onNavigateToProfile ? onNavigateToProfile : handleEditProfile}
          className="mt-4 w-full text-center text-emerald-600 dark:text-emerald-400 text-sm font-semibold hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
        >
          Editar Perfil →
        </button>
      </div>

      {/* Seção: Perfil */}
      {onNavigateToProfile && (
        <div className="mb-6">
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-2">
            Conta
          </h3>
          <button
            type="button"
            onClick={onNavigateToProfile}
            className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-all active:scale-95 relative z-10"
          >
            <div className="flex items-center gap-3">
              <User size={20} className="text-emerald-600 dark:text-emerald-400" />
              <div className="flex flex-col items-start">
                <span className="font-semibold text-gray-900 dark:text-white">Meu Perfil</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 md:hidden">Edite suas informações pessoais</span>
              </div>
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </button>
        </div>
      )}

      {/* Seção: Gamificação */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-2">
          Gamificação
        </h3>
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleNavigateToAchievements}
            className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-all active:scale-95 relative z-10"
          >
            <div className="flex items-center gap-3">
              <Trophy size={20} className="text-emerald-600 dark:text-emerald-400" />
              <div className="flex flex-col items-start">
                <span className="font-semibold text-gray-900 dark:text-white">Conquistas</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 md:hidden">Badges e medalhas desbloqueadas</span>
              </div>
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </button>

          <button
            type="button"
            onClick={onNavigateToElo}
            className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-all active:scale-95 relative z-10"
          >
            <div className="flex items-center gap-3">
              <Star size={20} className="text-amber-500" />
              <div className="flex flex-col items-start">
                <span className="font-semibold text-gray-900 dark:text-white">Elo</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 md:hidden">Sistema de ranking e progressão</span>
              </div>
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Seção: Dados */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-2">
          Dados
        </h3>
        <div className="space-y-2">
          <button
            onClick={handleStatistics}
            className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-all active:scale-95"
          >
            <div className="flex items-center gap-3">
              <BarChart3 size={20} className="text-blue-600 dark:text-blue-400" />
              <div className="flex flex-col items-start">
                <span className="font-semibold text-gray-900 dark:text-white">Estatísticas</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 md:hidden">Gráficos e análises detalhadas</span>
              </div>
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </button>

          <button
            onClick={handleOpenHistory}
            className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-all active:scale-95"
          >
            <div className="flex items-center gap-3">
              <History size={20} className="text-gray-600 dark:text-gray-400" />
              <div className="flex flex-col items-start">
                <span className="font-semibold text-gray-900 dark:text-white">Histórico</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 md:hidden">Todos os seus registros de estudo</span>
              </div>
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Seção: Configurações */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-2">
          Configurações
        </h3>
        <div className="space-y-2">
          <button
            onClick={onOpenSettings}
            className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-all active:scale-95"
          >
            <div className="flex items-center gap-3">
              <Settings size={20} className="text-emerald-600 dark:text-emerald-400" />
              <div className="flex flex-col items-start">
                <span className="font-semibold text-gray-900 dark:text-white">Configurações</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 md:hidden">Preferências e opções do app</span>
              </div>
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </button>

          <button
            onClick={handleAppearance}
            className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-all active:scale-95"
          >
            <div className="flex items-center gap-3">
              <Palette size={20} className="text-purple-600 dark:text-purple-400" />
              <div className="flex flex-col items-start">
                <span className="font-semibold text-gray-900 dark:text-white">Aparência</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 md:hidden">Tema, fonte e animações</span>
              </div>
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </button>

          <button
            onClick={handleGoals}
            className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-all active:scale-95"
          >
            <div className="flex items-center gap-3">
              <Target size={20} className="text-orange-600 dark:text-orange-400" />
              <div className="flex flex-col items-start">
                <span className="font-semibold text-gray-900 dark:text-white">Metas</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 md:hidden">Configure suas metas diárias e semanais</span>
              </div>
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </button>

          <button
            onClick={handleOpenFeedback}
            className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-all active:scale-95"
          >
            <div className="flex items-center gap-3">
              <MessageSquare size={20} className="text-emerald-600 dark:text-emerald-400" />
              <div className="flex flex-col items-start">
                <span className="font-semibold text-gray-900 dark:text-white">Dar Feedback</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 md:hidden">Envie sugestões e reporte bugs</span>
              </div>
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </button>

          <button
            onClick={handleOpenTutorial}
            className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-all active:scale-95"
          >
            <div className="flex items-center gap-3">
              <HelpCircle size={20} className="text-blue-600 dark:text-blue-400" />
              <div className="flex flex-col items-start">
                <span className="font-semibold text-gray-900 dark:text-white">Tutorial</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 md:hidden">Guia interativo do app</span>
              </div>
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </button>

          <button
            onClick={handleOpenSecurity}
            className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-all active:scale-95"
          >
            <div className="flex items-center gap-3">
              <Lock size={20} className="text-gray-600 dark:text-gray-400" />
              <div className="flex flex-col items-start">
                <span className="font-semibold text-gray-900 dark:text-white">Segurança</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 md:hidden">Alterar senha e segurança</span>
              </div>
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Botão Sair */}
      <button
        onClick={onLogout}
        className="w-full bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-xl p-4 flex items-center justify-center gap-2 font-semibold transition-all active:scale-95 shadow-sm"
      >
        <LogOut size={20} />
        Sair
      </button>
    </motion.div>
  );
}
