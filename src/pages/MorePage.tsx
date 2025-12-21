import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, Star, BarChart3, History, Palette, Target, MessageSquare, 
  HelpCircle, Lock, LogOut, ChevronRight, Settings
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import Button from '../components/Button';

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
  const { addToast } = useToast();
  const [profileData, setProfileData] = useState<{ firstName: string; avatarUrl: string | null }>({
    firstName: '',
    avatarUrl: null,
  });

  // Buscar dados do perfil
  useEffect(() => {
    if (!session?.user?.id) return;

    async function fetchProfile() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, avatar_url')
          .eq('id', session.user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          // PGRST116 = nenhum resultado encontrado (ok para primeiro acesso)
          console.error('Erro ao carregar perfil:', error);
        }

        if (data) {
          let avatarUrl = null;
          if (data.avatar_url) {
            // Obter URL pública do avatar
            const { data: urlData } = supabase.storage
              .from('avatars')
              .getPublicUrl(data.avatar_url);
            avatarUrl = urlData.publicUrl;
          }

          setProfileData({
            firstName: data.first_name || '',
            avatarUrl,
          });
        }
      } catch (error: any) {
        console.error('Erro ao carregar perfil:', error);
      }
    }

    fetchProfile();
  }, [session?.user?.id]);

  // Determinar nome a exibir
  const displayName = profileData.firstName || session?.user?.email?.split('@')[0] || 'Usuário';
  const userEmail = session?.user?.email || '';
  
  // Obter inicial para fallback do avatar
  const getInitial = () => {
    if (profileData.firstName) {
      return profileData.firstName.charAt(0).toUpperCase();
    }
    return displayName.charAt(0).toUpperCase();
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
    if (onNavigateToStats) {
      onNavigateToStats();
    } else {
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
          {profileData.avatarUrl ? (
            <img
              src={profileData.avatarUrl}
              alt="Avatar"
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center text-white text-2xl font-bold">
              {getInitial()}
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{displayName}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">{userEmail}</p>
          </div>
        </div>
        <Button
          onClick={onNavigateToProfile ? onNavigateToProfile : handleEditProfile}
          variant="ghost"
          fullWidth
          size="sm"
          className="mt-4 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
        >
          Editar Perfil →
        </Button>
      </div>

      {/* Seção: Gamificação */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-2">
          Gamificação
        </h3>
        <div className="space-y-2">
          <Button
            type="button"
            onClick={handleNavigateToAchievements}
            variant="ghost"
            fullWidth
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md relative z-10 h-auto"
            rightIcon={<ChevronRight size={16} className="text-gray-400" />}
          >
            <div className="flex items-center gap-3">
              <Trophy size={20} className="text-emerald-600 dark:text-emerald-400" />
              <div className="flex flex-col items-start">
                <span className="font-semibold text-gray-900 dark:text-white">Conquistas</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 md:hidden">Badges e medalhas desbloqueadas</span>
              </div>
            </div>
          </Button>

          <Button
            type="button"
            onClick={onNavigateToElo}
            variant="ghost"
            fullWidth
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md relative z-10 h-auto"
            rightIcon={<ChevronRight size={16} className="text-gray-400" />}
          >
            <div className="flex items-center gap-3">
              <Star size={20} className="text-amber-500" />
              <div className="flex flex-col items-start">
                <span className="font-semibold text-gray-900 dark:text-white">Elo</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 md:hidden">Sistema de ranking e progressão</span>
              </div>
            </div>
          </Button>
        </div>
      </div>

      {/* Seção: Dados */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-2">
          Dados
        </h3>
        <div className="space-y-2">
          <Button
            onClick={handleStatistics}
            variant="ghost"
            fullWidth
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md h-auto"
            rightIcon={<ChevronRight size={16} className="text-gray-400" />}
          >
            <div className="flex items-center gap-3">
              <BarChart3 size={20} className="text-blue-600 dark:text-blue-400" />
              <div className="flex flex-col items-start">
                <span className="font-semibold text-gray-900 dark:text-white">Estatísticas</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 md:hidden">Gráficos e análises detalhadas</span>
              </div>
            </div>
          </Button>

          <Button
            onClick={handleOpenHistory}
            variant="ghost"
            fullWidth
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md h-auto"
            rightIcon={<ChevronRight size={16} className="text-gray-400" />}
          >
            <div className="flex items-center gap-3">
              <History size={20} className="text-gray-600 dark:text-gray-400" />
              <div className="flex flex-col items-start">
                <span className="font-semibold text-gray-900 dark:text-white">Histórico</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 md:hidden">Todos os seus registros de estudo</span>
              </div>
            </div>
          </Button>
        </div>
      </div>

      {/* Seção: Configurações */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-2">
          Configurações
        </h3>
        <div className="space-y-2">
          <Button
            onClick={onOpenSettings}
            variant="ghost"
            fullWidth
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md h-auto"
            rightIcon={<ChevronRight size={16} className="text-gray-400" />}
          >
            <div className="flex items-center gap-3">
              <Settings size={20} className="text-emerald-600 dark:text-emerald-400" />
              <div className="flex flex-col items-start">
                <span className="font-semibold text-gray-900 dark:text-white">Configurações</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 md:hidden">Preferências e opções do app</span>
              </div>
            </div>
          </Button>

          <Button
            onClick={handleAppearance}
            variant="ghost"
            fullWidth
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md h-auto"
            rightIcon={<ChevronRight size={16} className="text-gray-400" />}
          >
            <div className="flex items-center gap-3">
              <Palette size={20} className="text-purple-600 dark:text-purple-400" />
              <div className="flex flex-col items-start">
                <span className="font-semibold text-gray-900 dark:text-white">Aparência</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 md:hidden">Tema, fonte e animações</span>
              </div>
            </div>
          </Button>

          <Button
            onClick={handleGoals}
            variant="ghost"
            fullWidth
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md h-auto"
            rightIcon={<ChevronRight size={16} className="text-gray-400" />}
          >
            <div className="flex items-center gap-3">
              <Target size={20} className="text-orange-600 dark:text-orange-400" />
              <div className="flex flex-col items-start">
                <span className="font-semibold text-gray-900 dark:text-white">Metas</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 md:hidden">Configure suas metas diárias e semanais</span>
              </div>
            </div>
          </Button>

          <Button
            onClick={handleOpenFeedback}
            variant="ghost"
            fullWidth
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md h-auto"
            rightIcon={<ChevronRight size={16} className="text-gray-400" />}
          >
            <div className="flex items-center gap-3">
              <MessageSquare size={20} className="text-emerald-600 dark:text-emerald-400" />
              <div className="flex flex-col items-start">
                <span className="font-semibold text-gray-900 dark:text-white">Dar Feedback</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 md:hidden">Envie sugestões e reporte bugs</span>
              </div>
            </div>
          </Button>

          <Button
            onClick={handleOpenTutorial}
            variant="ghost"
            fullWidth
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md h-auto"
            rightIcon={<ChevronRight size={16} className="text-gray-400" />}
          >
            <div className="flex items-center gap-3">
              <HelpCircle size={20} className="text-blue-600 dark:text-blue-400" />
              <div className="flex flex-col items-start">
                <span className="font-semibold text-gray-900 dark:text-white">Tutorial</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 md:hidden">Guia interativo do app</span>
              </div>
            </div>
          </Button>

          <Button
            onClick={handleOpenSecurity}
            variant="ghost"
            fullWidth
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md h-auto"
            rightIcon={<ChevronRight size={16} className="text-gray-400" />}
          >
            <div className="flex items-center gap-3">
              <Lock size={20} className="text-gray-600 dark:text-gray-400" />
              <div className="flex flex-col items-start">
                <span className="font-semibold text-gray-900 dark:text-white">Segurança</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 md:hidden">Alterar senha e segurança</span>
              </div>
            </div>
          </Button>
        </div>
      </div>

      {/* Botão Sair */}
      <Button
        onClick={onLogout}
        variant="danger"
        fullWidth
        size="lg"
        leftIcon={<LogOut size={20} />}
        className="shadow-sm"
      >
        Sair
      </Button>
    </motion.div>
  );
}
