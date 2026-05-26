import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Star,
  BarChart3,
  History,
  Palette,
  Target,
  MessageSquare,
  HelpCircle,
  Lock,
  LogOut,
  ChevronRight,
  Settings,
  CreditCard,
  Info,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useToast } from "../contexts/ToastContext";
import Button from "../components/Button";

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
  onNavigateToPlans?: () => void;
  onLogout: () => void;
  onNavigateToProfile: () => void;
}

const PROFILE_CACHE_KEY = "studyflow_profile_cache";

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
  onNavigateToAbout,
  onNavigateToPlans,
  onLogout,
  onNavigateToProfile,
}: MorePageProps) {
  const { addToast } = useToast();
  const [imgError, setImgError] = useState(false);
  const [profileData, setProfileData] = useState<{
    firstName: string;
    avatarUrl: string | null;
  }>(() => {
    const cached = sessionStorage.getItem(PROFILE_CACHE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        return { firstName: "", avatarUrl: null };
      }
    }
    return { firstName: "", avatarUrl: null };
  });

  // Buscar dados do perfil
  useEffect(() => {
    if (!session?.user?.id) return;

    async function fetchProfile() {
      try {
        const { data, error } = await supabase
          .from("user_settings")
          .select("first_name, avatar_url")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (error && error.code !== "PGRST116") {
          console.error("Erro ao carregar perfil:", error);
        }

        if (data) {
          let avatarUrl = null;
          if (data.avatar_url) {
            const { data: urlData } = supabase.storage
              .from("avatars")
              .getPublicUrl(data.avatar_url);
            avatarUrl = urlData.publicUrl;
          }

          const newProfile = {
            firstName: data.first_name || "",
            avatarUrl,
          };

          setProfileData(newProfile);
          setImgError(false);
          sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(newProfile));
        }
      } catch (error: any) {
        console.error("Erro ao carregar perfil:", error);
      }
    }

    fetchProfile();
  }, [session?.user?.id]);

  // Determinar nome a exibir
  const displayName =
    profileData.firstName || session?.user?.email?.split("@")[0] || "Usuário";
  const userEmail = session?.user?.email || "";

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
      addToast("Navegação para estatísticas não disponível", "error");
    }
  };

  const handleAppearance = () => {
    onNavigateToAppearance();
  };

  const handleGoals = () => {
    onNavigateToGoals();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="max-w-lg mx-auto px-6 py-6 pb-24"
    >
      {/* Header - Perfil do usuário */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4 mb-6">
        <button
          type="button"
          onClick={onNavigateToProfile}
          className="flex items-center gap-3 w-full text-left rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors p-1 -m-1"
        >
          {profileData.avatarUrl && !imgError ? (
            <img
              src={profileData.avatarUrl}
              alt="Avatar"
              className="w-16 h-16 sm:w-20 sm:h-20 min-w-[4rem] sm:min-w-[5rem] aspect-square rounded-full object-cover object-center border-2 border-emerald-500 flex-shrink-0"
              loading="eager"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 min-w-[4rem] sm:min-w-[5rem] aspect-square rounded-full bg-emerald-500 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold border-2 border-emerald-600 flex-shrink-0">
              {getInitial()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">
              {displayName}
            </h2>
            <p className="text-base text-gray-600 dark:text-gray-400 truncate">
              {userEmail}
            </p>
          </div>
          <ChevronRight
            size={20}
            className="text-gray-400 flex-shrink-0"
            aria-hidden
          />
        </button>
        <Button
          onClick={onNavigateToProfile}
          variant="ghost"
          fullWidth
          size="md"
          className="mt-3 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
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
            <div className="flex items-center gap-3 min-w-0">
              <Trophy
                size={20}
                className="text-emerald-600 dark:text-emerald-400 flex-shrink-0"
              />
              <div className="flex flex-col items-start min-w-0 text-left">
                <span className="font-semibold text-gray-900 dark:text-white truncate">
                  Conquistas
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 md:hidden truncate">
                  Badges e medalhas desbloqueadas
                </span>
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
            <div className="flex items-center gap-3 min-w-0">
              <Star size={20} className="text-amber-500 flex-shrink-0" />
              <div className="flex flex-col items-start min-w-0 text-left">
                <span className="font-semibold text-gray-900 dark:text-white truncate">
                  Elo
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 md:hidden truncate">
                  Sistema de ranking e progressão
                </span>
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
            <div className="flex items-center gap-3 min-w-0">
              <BarChart3
                size={20}
                className="text-blue-600 dark:text-blue-400 flex-shrink-0"
              />
              <div className="flex flex-col items-start min-w-0 text-left">
                <span className="font-semibold text-gray-900 dark:text-white truncate">
                  Estatísticas
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 md:hidden truncate">
                  Gráficos e análises detalhadas
                </span>
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
            <div className="flex items-center gap-3 min-w-0">
              <History
                size={20}
                className="text-gray-600 dark:text-gray-400 flex-shrink-0"
              />
              <div className="flex flex-col items-start min-w-0 text-left">
                <span className="font-semibold text-gray-900 dark:text-white truncate">
                  Histórico
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 md:hidden truncate">
                  Todos os seus registros de estudo
                </span>
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
            <div className="flex items-center gap-3 min-w-0">
              <Settings
                size={20}
                className="text-emerald-600 dark:text-emerald-400 flex-shrink-0"
              />
              <div className="flex flex-col items-start min-w-0 text-left">
                <span className="font-semibold text-gray-900 dark:text-white truncate">
                  Configurações
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 md:hidden truncate">
                  Preferências e opções do app
                </span>
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
            <div className="flex items-center gap-3 min-w-0">
              <Palette
                size={20}
                className="text-purple-600 dark:text-purple-400 flex-shrink-0"
              />
              <div className="flex flex-col items-start min-w-0 text-left">
                <span className="font-semibold text-gray-900 dark:text-white truncate">
                  Aparência
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 md:hidden truncate">
                  Tema, fonte e animações
                </span>
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
            <div className="flex items-center gap-3 min-w-0">
              <Target
                size={20}
                className="text-orange-600 dark:text-orange-400 flex-shrink-0"
              />
              <div className="flex flex-col items-start min-w-0 text-left">
                <span className="font-semibold text-gray-900 dark:text-white truncate">
                  Metas
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 md:hidden truncate">
                  Configure suas metas diárias e semanais
                </span>
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
            <div className="flex items-center gap-3 min-w-0">
              <MessageSquare
                size={20}
                className="text-emerald-600 dark:text-emerald-400 flex-shrink-0"
              />
              <div className="flex flex-col items-start min-w-0 text-left">
                <span className="font-semibold text-gray-900 dark:text-white truncate">
                  Dar Feedback
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 md:hidden truncate">
                  Envie sugestões e reporte bugs
                </span>
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
            <div className="flex items-center gap-3 min-w-0">
              <HelpCircle
                size={20}
                className="text-blue-600 dark:text-blue-400 flex-shrink-0"
              />
              <div className="flex flex-col items-start min-w-0 text-left">
                <span className="font-semibold text-gray-900 dark:text-white truncate">
                  Tutorial
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 md:hidden truncate">
                  Guia interativo do app
                </span>
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
            <div className="flex items-center gap-3 min-w-0">
              <Lock
                size={20}
                className="text-gray-600 dark:text-gray-400 flex-shrink-0"
              />
              <div className="flex flex-col items-start min-w-0 text-left">
                <span className="font-semibold text-gray-900 dark:text-white truncate">
                  Segurança
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 md:hidden truncate">
                  Alterar senha e segurança
                </span>
              </div>
            </div>
          </Button>

          {onNavigateToPlans && (
            <Button
              onClick={onNavigateToPlans}
              variant="ghost"
              fullWidth
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md h-auto"
              rightIcon={<ChevronRight size={16} className="text-gray-400" />}
            >
              <div className="flex items-center gap-3 min-w-0">
                <CreditCard
                  size={20}
                  className="text-emerald-600 dark:text-emerald-400 flex-shrink-0"
                />
                <div className="flex flex-col items-start min-w-0 text-left">
                  <span className="font-semibold text-gray-900 dark:text-white truncate">
                    Planos
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 md:hidden truncate">
                    Assine um plano e desbloqueie recursos
                  </span>
                </div>
              </div>
            </Button>
          )}

          {onNavigateToAbout && (
            <Button
              onClick={onNavigateToAbout}
              variant="ghost"
              fullWidth
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md h-auto"
              rightIcon={<ChevronRight size={16} className="text-gray-400" />}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Info
                  size={20}
                  className="text-gray-600 dark:text-gray-400 flex-shrink-0"
                />
                <div className="flex flex-col items-start min-w-0 text-left">
                  <span className="font-semibold text-gray-900 dark:text-white truncate">
                    Sobre
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 md:hidden truncate">
                    Informações do app e contato
                  </span>
                </div>
              </div>
            </Button>
          )}
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
