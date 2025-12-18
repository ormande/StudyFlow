import { useState, useEffect, useCallback } from 'react';
import Joyride, { CallBackProps, STATUS, Step, Styles } from 'react-joyride';

interface OnboardingTourProps {
  isDarkMode: boolean;
  onComplete?: () => void;
  onCloseSettings?: () => void;
}

const TOUR_STYLES: Partial<Styles> = {
  options: {
    primaryColor: '#10b981',
    textColor: '#111827',
    overlayColor: 'rgba(0, 0, 0, 0.5)',
    arrowColor: '#ffffff',
    backgroundColor: '#ffffff',
    beaconSize: 36,
    zIndex: 10000,
  },
  tooltip: {
    borderRadius: 12,
    padding: 20,
  },
  tooltipContainer: {
    textAlign: 'left',
  },
  buttonNext: {
    backgroundColor: '#10b981',
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 600,
    padding: '10px 20px',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
  },
  buttonBack: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: 500,
    padding: '10px 20px',
    marginRight: 10,
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
  },
  buttonSkip: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: 500,
  },
};

const TOUR_STYLES_DARK: Partial<Styles> = {
  options: {
    primaryColor: '#10b981',
    textColor: '#f9fafb',
    overlayColor: 'rgba(0, 0, 0, 0.7)',
    arrowColor: '#1f2937',
    backgroundColor: '#1f2937',
    beaconSize: 36,
    zIndex: 10000,
  },
  tooltip: {
    borderRadius: 12,
    padding: 20,
    backgroundColor: '#1f2937',
    color: '#f9fafb',
  },
  tooltipContainer: {
    textAlign: 'left',
  },
  buttonNext: {
    backgroundColor: '#10b981',
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 600,
    padding: '10px 20px',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
  },
  buttonBack: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: 500,
    padding: '10px 20px',
    marginRight: 10,
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
  },
  buttonSkip: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: 500,
  },
};

export default function OnboardingTour({ isDarkMode, onComplete, onCloseSettings }: OnboardingTourProps) {
  const [runTour, setRunTour] = useState(false);

  // Gerar steps
  const getTourSteps = useCallback((): Step[] => {
    // Determina o target correto baseado no tamanho da tela
    // Usa o wrapper que contém apenas os cards de estatísticas (sem elo e meta diária)
    const isDesktop = window.innerWidth >= 1024; // lg breakpoint do Tailwind
    const dashboardStatsTarget = isDesktop 
      ? '[data-tour="stats-cards-wrapper"][data-tour-desktop="true"]'
      : '[data-tour="stats-cards-wrapper"][data-tour-mobile="true"]';
    
    return [
      {
        target: 'body',
        content: (
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Bem-vindo ao StudyFlow! 🎉
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              Seu app de gestão de estudos com gamificação para concursos.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Vamos fazer um tour rápido de <strong>5 minutos</strong> para você dominar todas as funcionalidades!
            </p>
          </div>
        ),
        placement: 'center' as const,
        disableBeacon: true,
      },
      {
        target: dashboardStatsTarget,
        content: (
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              📊 Estatísticas em Tempo Real
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              Acompanhe quanto você estudou <strong>hoje</strong>, total acumulado, páginas lidas e questões resolvidas.
            </p>
            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold">
              💡 Seu progresso atualiza automaticamente!
            </p>
          </div>
        ),
        placement: 'bottom',
        disableBeacon: false,
      },
      {
        target: 'body',
        content: (
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              ⏱️ Sistema de Timer
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              Use o <strong>Timer</strong> (na navegação lateral) para:
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside ml-2">
              <li><strong>Cronômetro:</strong> Sessões livres de estudo</li>
              <li><strong>Temporizador:</strong> Defina um tempo específico</li>
              <li><strong>Pomodoro:</strong> 25min foco + 5min pausa</li>
            </ul>
            <p className="text-sm text-amber-600 dark:text-amber-400 font-semibold mt-2">
              🔥 Quando o timer parar, você pode registrar automaticamente!
            </p>
          </div>
        ),
        placement: 'center' as const,
        disableBeacon: false,
      },
      {
        target: 'body',
        content: (
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              🔄 Ciclo de Estudos
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              Na aba <strong>Ciclo</strong>, você:
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside ml-2">
              <li>Cria matérias com <strong>metas de horas</strong></li>
              <li>Adiciona subtópicos para organizar</li>
              <li>Acompanha progresso visual por matéria</li>
              <li>Reordena matérias por prioridade</li>
            </ul>
            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold mt-2">
              📚 Comece criando suas matérias agora!
            </p>
          </div>
        ),
        placement: 'center' as const,
        disableBeacon: false,
      },
      {
        target: 'body',
        content: (
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              🎮 Gamificação
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              Na aba <strong>Conquistas</strong>, você ganha:
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside ml-2">
              <li><strong>XP</strong> por cada estudo registrado</li>
              <li><strong>Elos:</strong> Bronze → Prata → Ouro → Platina → Diamante</li>
              <li><strong>50+ Badges:</strong> Maratonista, Perfeccionista, etc</li>
              <li><strong>Ofensiva:</strong> Dias consecutivos de estudo</li>
            </ul>
            <p className="text-sm text-violet-600 dark:text-violet-400 font-semibold mt-2">
              🏆 Mantenha sua ofensiva e suba de elo!
            </p>
          </div>
        ),
        placement: 'center' as const,
        disableBeacon: false,
      },
      {
        target: 'body',
        content: (
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              🚀 Você está pronto!
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              <strong>Próximos passos:</strong>
            </p>
            <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-2 list-decimal list-inside ml-2">
              <li>Vá em <strong>Ciclo</strong> e crie suas matérias</li>
              <li>Use o <strong>Timer</strong> ou registre estudos manualmente</li>
              <li>Acompanhe progresso no <strong>Dashboard</strong></li>
              <li>Ganhe XP e badges em <strong>Conquistas</strong></li>
            </ol>
            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold mt-3">
              💡 Dica: Acesse <strong>Configurações ⚙️</strong> (canto superior) para personalizar metas, tema e muito mais!
            </p>
          </div>
        ),
        placement: 'center' as const,
        disableBeacon: false,
      },
    ];
  }, []);
  
  // Iniciar tour automaticamente
  useEffect(() => {
    const hasCompletedTour = localStorage.getItem('studyflow_onboarding_completed') === 'true';
    
    if (!hasCompletedTour) {
      const startTour = () => {
        // Verifica se o elemento stats-cards-wrapper existe e está visível antes de iniciar
        // Isso garante que o passo 2 não seja pulado
        const isDesktop = window.innerWidth >= 1024;
        const selector = isDesktop 
          ? '[data-tour="stats-cards-wrapper"][data-tour-desktop="true"]'
          : '[data-tour="stats-cards-wrapper"][data-tour-mobile="true"]';
        
        const dashboardStatsElement = document.querySelector(selector);
        
        if (dashboardStatsElement) {
          const el = dashboardStatsElement as HTMLElement;
          const rect = el.getBoundingClientRect();
          const isVisible = el.offsetParent !== null && rect.width > 0 && rect.height > 0;
          
          if (isVisible || document.readyState === 'complete') {
            // Aguarda um pouco mais para garantir que o DOM está totalmente renderizado
            setTimeout(() => {
              setRunTour(true);
            }, 300);
          } else {
            // Se não está visível ainda, tenta novamente após um pequeno delay
            setTimeout(startTour, 500);
          }
        } else if (document.readyState === 'complete') {
          // Se o documento está completo mas não encontrou o elemento, inicia mesmo assim
          // (pode ser que o usuário não tenha dados ainda)
          setTimeout(() => {
            setRunTour(true);
          }, 300);
        } else {
          // Se não encontrou, tenta novamente após um pequeno delay
          setTimeout(startTour, 500);
        }
      };
      
      const timer = setTimeout(startTour, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status, action, type } = data;

    console.log('Joyride callback:', { status, action, type });

    // Se fechou ou completou
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      console.log('Tour finalizado');
      localStorage.setItem('studyflow_onboarding_completed', 'true');
      setRunTour(false);
      
      if (onComplete) {
        onComplete();
      }
    }

    // Se fechou manualmente
    if (action === 'close') {
      console.log('Tour fechado');
      localStorage.setItem('studyflow_onboarding_completed', 'true');
      setRunTour(false);
    }
  }, [onComplete]);

  // Função para reiniciar o tour
  const restartTour = useCallback(() => {
    localStorage.removeItem('studyflow_onboarding_completed');
    
    if (onCloseSettings) {
      onCloseSettings();
    }
    
    setTimeout(() => {
      setRunTour(true);
    }, 300);
  }, [onCloseSettings]);

  // Expor função de restart
  useEffect(() => {
    (window as any).restartOnboardingTour = restartTour;
    return () => {
      delete (window as any).restartOnboardingTour;
    };
  }, [restartTour]);

  // Traduzir botões do Joyride para português
useEffect(() => {
    if (runTour) {
      const updateButtonText = () => {
        // Botão "Next"
        const nextButton = document.querySelector('button[data-action="primary"]') as HTMLButtonElement;
        if (nextButton && nextButton.textContent?.includes('Step')) {
          const match = nextButton.textContent.match(/Step (\d+) of (\d+)/);
          if (match) {
            nextButton.textContent = `Próximo (${match[1]} de ${match[2]})`;
          }
        }
        
        // Botão "Last" (último step)
        const lastButton = document.querySelector('button[data-action="primary"]') as HTMLButtonElement;
        if (lastButton && lastButton.textContent === 'Last') {
          lastButton.textContent = 'Finalizar';
        }
        
        // Botão "Back"
        const backButton = document.querySelector('button[data-action="back"]') as HTMLButtonElement;
        if (backButton && backButton.textContent === 'Back') {
          backButton.textContent = 'Voltar';
        }
        
        // Botão "Skip"
        const skipButton = document.querySelector('button[data-action="skip"]') as HTMLButtonElement;
        if (skipButton && skipButton.textContent?.includes('Skip')) {
          skipButton.textContent = 'Pular Tour';
        }
      };
  
      // Atualizar imediatamente e a cada 200ms (para pegar mudanças de step)
      updateButtonText();
      const interval = setInterval(updateButtonText, 200);
      
      return () => clearInterval(interval);
    }
  }, [runTour]);

  // Recalcular steps quando o tour iniciar para garantir que os elementos estejam disponíveis
  const [tourSteps, setTourSteps] = useState<Step[]>([]);

  useEffect(() => {
    if (runTour) {
      // Recalcula os steps quando o tour inicia para garantir que os elementos estejam disponíveis
      const steps = getTourSteps();
      setTourSteps(steps);
    }
  }, [runTour, getTourSteps]);

  // Inicializa os steps mesmo quando o tour não está rodando (para evitar erro)
  useEffect(() => {
    if (tourSteps.length === 0) {
      setTourSteps(getTourSteps());
    }
  }, [getTourSteps]);

  return (
    <Joyride
      steps={tourSteps}
      run={runTour}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={isDarkMode ? TOUR_STYLES_DARK : TOUR_STYLES}
      locale={{
        back: 'Voltar',
        close: 'Fechar',
        last: 'Finalizar',
        next: 'Próximo',
        skip: 'Pular Tour',
      }}
      disableOverlayClose={false}
      hideCloseButton={false}
      disableScrolling={false}
      spotlightClicks={false}
      disableScrollParentFix={false}
    />
  );
}

// Hook para reiniciar o tour
export const useRestartTour = () => {
  return useCallback(() => {
    if ((window as any).restartOnboardingTour) {
      (window as any).restartOnboardingTour();
    }
  }, []);
};