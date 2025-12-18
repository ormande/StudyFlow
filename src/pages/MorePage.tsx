import { motion } from 'framer-motion';
import { 
  Trophy, Star, BarChart2, History, Palette, Target, MessageSquare, 
  HelpCircle, Lock, LogOut, ChevronRight, Settings 
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

interface MorePageProps {
  session: any;
  onNavigateToGamification: () => void;
  onOpenHistory: () => void;
  onOpenFeedback: () => void;
  onOpenTutorial: () => void;
  onOpenSecurity: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
}

export default function MorePage({
  session,
  onNavigateToGamification,
  onOpenHistory,
  onOpenFeedback,
  onOpenTutorial,
  onOpenSecurity,
  onOpenSettings,
  onLogout,
}: MorePageProps) {
  const { addToast } = useToast();

  const user = {
    name: session?.user?.user_metadata?.name || session?.user?.email?.split('@')[0] || 'Usuário',
    email: session?.user?.email || '',
  };

  const handleNavigateToGamification = () => {
    onNavigateToGamification();
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
    addToast('Estatísticas detalhadas em breve!', 'info');
  };

  const handleAppearance = () => {
    addToast('Configuração de aparência em breve!', 'info');
  };

  const handleGoals = () => {
    addToast('Gerenciamento de metas em breve!', 'info');
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
          onClick={handleEditProfile}
          className="mt-4 w-full text-center text-emerald-600 dark:text-emerald-400 text-sm font-semibold hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
        >
          Editar Perfil →
        </button>
      </div>

      {/* Seção: Gamificação */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-2">
          Gamificação
        </h3>
        <div className="space-y-2">
          <button
            onClick={handleNavigateToGamification}
            className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-all active:scale-95"
          >
            <div className="flex items-center gap-3">
              <Trophy size={20} className="text-emerald-600 dark:text-emerald-400" />
              <span className="font-semibold text-gray-900 dark:text-white">Conquistas</span>
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </button>

          <button
            onClick={handleNavigateToGamification}
            className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-all active:scale-95"
          >
            <div className="flex items-center gap-3">
              <Star size={20} className="text-amber-500" />
              <span className="font-semibold text-gray-900 dark:text-white">Ranking & Elo</span>
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
              <BarChart2 size={20} className="text-blue-600 dark:text-blue-400" />
              <span className="font-semibold text-gray-900 dark:text-white">Estatísticas</span>
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </button>

          <button
            onClick={handleOpenHistory}
            className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-all active:scale-95"
          >
            <div className="flex items-center gap-3">
              <History size={20} className="text-gray-600 dark:text-gray-400" />
              <span className="font-semibold text-gray-900 dark:text-white">Histórico</span>
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
              <span className="font-semibold text-gray-900 dark:text-white">Configurações</span>
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </button>

          <button
            onClick={handleAppearance}
            className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-all active:scale-95"
          >
            <div className="flex items-center gap-3">
              <Palette size={20} className="text-purple-600 dark:text-purple-400" />
              <span className="font-semibold text-gray-900 dark:text-white">Aparência</span>
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </button>

          <button
            onClick={handleGoals}
            className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-all active:scale-95"
          >
            <div className="flex items-center gap-3">
              <Target size={20} className="text-orange-600 dark:text-orange-400" />
              <span className="font-semibold text-gray-900 dark:text-white">Metas</span>
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </button>

          <button
            onClick={handleOpenFeedback}
            className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-all active:scale-95"
          >
            <div className="flex items-center gap-3">
              <MessageSquare size={20} className="text-emerald-600 dark:text-emerald-400" />
              <span className="font-semibold text-gray-900 dark:text-white">Dar Feedback</span>
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </button>

          <button
            onClick={handleOpenTutorial}
            className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-all active:scale-95"
          >
            <div className="flex items-center gap-3">
              <HelpCircle size={20} className="text-blue-600 dark:text-blue-400" />
              <span className="font-semibold text-gray-900 dark:text-white">Tutorial</span>
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </button>

          <button
            onClick={handleOpenSecurity}
            className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-all active:scale-95"
          >
            <div className="flex items-center gap-3">
              <Lock size={20} className="text-gray-600 dark:text-gray-400" />
              <span className="font-semibold text-gray-900 dark:text-white">Segurança</span>
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Botão Sair */}
      <button
        onClick={onLogout}
        className="w-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl p-4 flex items-center justify-center gap-2 font-semibold hover:bg-red-100 dark:hover:bg-red-900/30 transition-all active:scale-95"
      >
        <LogOut size={20} />
        Sair
      </button>
    </motion.div>
  );
}
