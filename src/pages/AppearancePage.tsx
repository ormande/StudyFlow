import { useState } from 'react';
import { ArrowLeft, Sun, Moon, RefreshCw, Circle, Palette, Eye, Type, Info, Home } from 'lucide-react';
import { useAppearance, Theme, FontSize } from '../hooks/useAppearance';
import { useToast } from '../contexts/ToastContext';

interface AppearancePageProps {
  onNavigateBack: () => void;
}

export default function AppearancePage({ onNavigateBack }: AppearancePageProps) {
  const { settings, saveSettings } = useAppearance();
  const { addToast } = useToast();
  
  // Estados locais para preview (não persistem até salvar)
  const [previewTheme, setPreviewTheme] = useState<Theme>(settings.theme);
  const [previewFontSize, setPreviewFontSize] = useState<FontSize>(settings.fontSize);
  
  // Verificar se há mudanças pendentes
  const hasChanges = 
    previewTheme !== settings.theme ||
    previewFontSize !== settings.fontSize;
  
  // Função auxiliar para converter tamanho em pixels
  const getFontSizeValue = (size: FontSize): string => {
    switch(size) {
      case 'small': return '14px';
      case 'large': return '17px';
      case 'medium':
      default: return '16px';
    }
  };
  
  // Função para obter cores do preview baseado no tema
  const getPreviewColors = () => {
    const isHighContrast = previewTheme === 'high-contrast';
    const isDark = previewTheme === 'dark' || (previewTheme === 'auto' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isHighContrast) {
      return {
        backgroundColor: '#000000',
        color: '#ffffff',
        borderColor: '#ffffff',
        progressBg: '#ffffff',
        progressFill: '#10b981',
      };
    }
    
    if (isDark) {
      return {
        backgroundColor: '#1f2937',
        color: '#ffffff',
        borderColor: '#374151',
        progressBg: '#374151',
        progressFill: '#10b981',
      };
    }
    
    return {
      backgroundColor: '#ffffff',
      color: '#111827',
      borderColor: '#e5e7eb',
      progressBg: '#f3f4f6',
      progressFill: '#10b981',
    };
  };
  
  const previewColors = getPreviewColors();

  // NÃO aplicar preview no HTML - apenas no preview isolado
  // O tema só será aplicado quando salvar

  // Função para salvar alterações
  const handleSave = () => {
    saveSettings({
      theme: previewTheme,
      fontSize: previewFontSize,
    });
    addToast('Aparência atualizada!', 'success');
    // Aplicar tema após salvar (duplicado do hook, mas garantindo aplicação)
    const html = document.documentElement;
    html.classList.remove('light', 'dark', 'high-contrast');
    if (previewTheme === 'auto') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      html.classList.add(isDark ? 'dark' : 'light');
    } else {
      html.classList.add(previewTheme);
    }
    // Aplicar fonte após salvar (duplicado do hook, mas garantindo aplicação)
    const fontSizeClassMap: Record<FontSize, string | null> = {
      small: 'font-size-sm',
      medium: null, // Não aplicar classe - usa tamanho natural do Tailwind
      large: 'font-size-lg',
    };
    html.classList.remove('font-size-sm', 'font-size-base', 'font-size-lg', 'font-size-small', 'font-size-medium', 'font-size-large');
    const fontSizeClass = fontSizeClassMap[previewFontSize];
    if (fontSizeClass) {
      html.classList.add(fontSizeClass);
    }
  };

  // Função para resetar preview (voltar ao salvo)
  const handleReset = () => {
    setPreviewTheme(settings.theme);
    setPreviewFontSize(settings.fontSize);
    // Reverter tema do HTML para o salvo
    const html = document.documentElement;
    html.classList.remove('light', 'dark', 'high-contrast');
    if (settings.theme === 'auto') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      html.classList.add(isDark ? 'dark' : 'light');
    } else {
      html.classList.add(settings.theme);
    }
    // Reverter fonte
    const fontSizeClassMap: Record<FontSize, string | null> = {
      small: 'font-size-sm',
      medium: null, // Não aplicar classe - usa tamanho natural do Tailwind
      large: 'font-size-lg',
    };
    html.classList.remove('font-size-sm', 'font-size-base', 'font-size-lg', 'font-size-small', 'font-size-medium', 'font-size-large');
    const fontSizeClass = fontSizeClassMap[settings.fontSize];
    if (fontSizeClass) {
      html.classList.add(fontSizeClass);
    }
  };

  const themeOptions: { value: Theme; icon: React.ReactNode; label: string; description: string }[] = [
    {
      value: 'light',
      icon: <Sun size={20} />,
      label: 'Claro',
      description: 'Background branco, texto escuro',
    },
    {
      value: 'dark',
      icon: <Moon size={20} />,
      label: 'Escuro',
      description: 'Background escuro, texto claro',
    },
    {
      value: 'auto',
      icon: <RefreshCw size={20} />,
      label: 'Automático',
      description: 'Segue sistema operacional',
    },
    {
      value: 'high-contrast',
      icon: <Circle size={20} />,
      label: 'Contraste Alto',
      description: 'Preto/branco puro, acessibilidade',
    },
  ];

  const fontSizeOptions: { value: FontSize; label: string; description: string }[] = [
    {
      value: 'small',
      label: 'Pequeno',
      description: '14px (87.5% do padrão)',
    },
    {
      value: 'medium',
      label: 'Médio',
      description: '16px (padrão do app)',
    },
    {
      value: 'large',
      label: 'Grande',
      description: '17px (mantém hierarquia)',
    },
  ];

  return (
    <div className="max-w-2xl mx-auto px-6 py-6 pb-24 md:pb-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={onNavigateBack}
          className="md:hidden flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span className="font-semibold">Voltar</span>
        </button>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1 flex items-center gap-2">
          <Palette size={28} className="text-emerald-500" />
          Aparência
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Personalize a aparência do app
        </p>
      </div>

      <div className="space-y-8">
        {/* SEÇÃO 1 - TEMA */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Moon className="text-emerald-500" size={20} />
            Tema
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {themeOptions.map((option) => {
              const isActive = previewTheme === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setPreviewTheme(option.value)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                    isActive
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/30'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <div className={isActive ? 'text-white' : 'text-gray-600 dark:text-gray-400'}>
                    {option.icon}
                  </div>
                  <span className="text-sm font-semibold">{option.label}</span>
                  <span className={`text-xs text-center ${isActive ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <Info className="text-gray-400" size={14} />
            Modo automático segue as configurações do seu sistema
          </p>
        </section>

        {/* SEÇÃO 2 - TAMANHO DO TEXTO */}
        <section className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Type className="text-emerald-500" size={20} />
            Tamanho do Texto
          </h2>
          
          <div className="flex flex-nowrap gap-2 md:gap-3 overflow-x-auto">
            {fontSizeOptions.map((option) => {
              const isActive = previewFontSize === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setPreviewFontSize(option.value)}
                  className={`flex-1 min-w-0 px-3 md:px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/30'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <span className="text-sm font-semibold block">{option.label}</span>
                  <p className={`text-xs mt-1 ${isActive ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Preview do tamanho de fonte */}
          <div 
            className="mt-4 p-4 rounded-xl border-2 shadow-lg"
            style={{
              fontSize: getFontSizeValue(previewFontSize),
              backgroundColor: previewColors.backgroundColor,
              color: previewColors.color,
              borderColor: previewColors.borderColor,
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{ fontSize: 'inherit' }}>
              <div className="flex items-center gap-2 mb-2">
                <Home className="text-emerald-500" size={16} />
                <span style={{ fontSize: '1.2em', fontWeight: 600 }}>Dashboard</span>
              </div>
              <p style={{ fontSize: '1em', marginBottom: '0.5rem', opacity: 0.8 }}>
                Você estudou 2h hoje
              </p>
              <p style={{ fontSize: '0.875em', opacity: 0.7, marginBottom: '0.5rem' }}>
                Meta: 3h/dia (67%)
              </p>
              <div className="w-full h-2 rounded-full overflow-hidden mt-2" style={{ backgroundColor: previewColors.progressBg }}>
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: '67%',
                    backgroundColor: previewColors.progressFill
                  }}
                />
              </div>
              <p style={{ fontSize: '0.75em', opacity: 0.6, marginTop: '0.5rem' }}>
                Barra de progresso
              </p>
            </div>
          </div>
        </section>

        {/* SEÇÃO 3 - PREVIEW GERAL */}
        <section className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Eye size={20} />
            Visualização
          </h2>
          
          <div 
            className="p-6 rounded-xl border-2 shadow-lg"
            style={{
              fontSize: getFontSizeValue(previewFontSize),
              backgroundColor: previewColors.backgroundColor,
              color: previewColors.color,
              borderColor: previewColors.borderColor,
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{ fontSize: 'inherit' }}>
              {/* Header do preview */}
              <div className="flex items-center justify-between pb-3 border-b-2 mb-4" style={{ borderColor: previewTheme === 'high-contrast' ? 'rgba(255,255,255,0.2)' : (previewTheme === 'dark' || (previewTheme === 'auto' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches)) ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                <div className="flex items-center gap-2">
                  <img src="/icon-192.png" alt="SF" className="w-6 h-6 rounded-lg" />
                  <span className="font-bold" style={{ fontSize: '1.125em' }}>StudyFlow</span>
                </div>
              </div>
              
              {/* Card de progresso */}
              <div className="p-4 rounded-lg border mb-4" style={{ borderColor: previewColors.borderColor, backgroundColor: previewColors.backgroundColor }}>
                <p className="font-semibold mb-2" style={{ fontSize: '0.875em' }}>Progresso Hoje</p>
                <p className="mb-3 opacity-80" style={{ fontSize: '0.75em' }}>2h / 3h (67%)</p>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: previewColors.progressBg }}>
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: '67%',
                      backgroundColor: previewColors.progressFill
                    }}
                  />
                </div>
              </div>
              
              {/* Card de desempenho */}
              <div className="p-4 rounded-lg border mb-4" style={{ borderColor: previewColors.borderColor, backgroundColor: previewColors.backgroundColor }}>
                <p className="font-semibold mb-2" style={{ fontSize: '0.875em' }}>Desempenho</p>
                <p className="opacity-80" style={{ fontSize: '0.75em' }}>85% de acerto</p>
              </div>
              
              {/* Botão exemplo */}
              <button
                className="w-full py-2 rounded-lg font-semibold transition-all"
                style={{ 
                  fontSize: '0.875em',
                  backgroundColor: previewTheme === 'high-contrast' ? '#ffffff' : '#10b981',
                  color: previewTheme === 'high-contrast' ? '#000000' : '#ffffff',
                  border: previewTheme === 'high-contrast' ? '2px solid #ffffff' : 'none'
                }}
              >
                Botão Exemplo
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Botões de ação - Parte do fluxo da página */}
      <div className="mt-8 flex gap-3">
        {hasChanges && (
          <button
            onClick={handleReset}
            className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-95"
          >
            Cancelar
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={!hasChanges}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all active:scale-95 ${
            hasChanges
              ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/30'
              : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
          }`}
        >
          {hasChanges ? 'Salvar Alterações' : 'Nenhuma alteração'}
        </button>
      </div>
    </div>
  );
}
