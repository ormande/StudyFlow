import { useState } from 'react';
import { ArrowLeft, Sun, Moon, RefreshCw, Circle, Palette, Info, Eye } from 'lucide-react';
import { useAppearance, Theme } from '../hooks/useAppearance';
import { useToast } from '../contexts/ToastContext';
import Button from '../components/Button';
import { motion } from 'framer-motion';

interface AppearancePageProps {
  onNavigateBack: () => void;
}

export default function AppearancePage({ onNavigateBack }: AppearancePageProps) {
  const { settings, saveSettings } = useAppearance();
  const { addToast } = useToast();
  
  // Estados locais para preview (não persistem até salvar)
  const [previewTheme, setPreviewTheme] = useState<Theme>(settings.theme);
  
  // Verificar se há mudanças pendentes
  const hasChanges = previewTheme !== settings.theme;

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
        cardBg: '#000000',
      };
    }
    
    if (isDark) {
      return {
        backgroundColor: '#1f2937',
        color: '#ffffff',
        borderColor: '#374151',
        progressBg: '#374151',
        progressFill: '#10b981',
        cardBg: '#1f2937',
      };
    }
    
    return {
      backgroundColor: '#ffffff',
      color: '#111827',
      borderColor: '#e5e7eb',
      progressBg: '#f3f4f6',
      progressFill: '#10b981',
      cardBg: '#ffffff',
    };
  };
  
  const previewColors = getPreviewColors();

  // Função para salvar alterações
  const handleSave = () => {
    saveSettings({
      theme: previewTheme,
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
  };

  // Função para resetar preview (voltar ao salvo)
  const handleReset = () => {
    setPreviewTheme(settings.theme);
    // Reverter tema do HTML para o salvo
    const html = document.documentElement;
    html.classList.remove('light', 'dark', 'high-contrast');
    if (settings.theme === 'auto') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      html.classList.add(isDark ? 'dark' : 'light');
    } else {
      html.classList.add(settings.theme);
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


  return (
    <div className="max-w-2xl mx-auto px-6 py-6 pb-24 md:pb-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          onClick={onNavigateBack}
          variant="ghost"
          size="md"
          leftIcon={<ArrowLeft size={20} />}
          className="md:hidden mb-4"
        >
          Voltar
        </Button>
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
                <motion.button
                  key={option.value}
                  onClick={() => setPreviewTheme(option.value)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
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
                </motion.button>
              );
            })}
          </div>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <Info className="text-gray-400" size={14} />
            Modo automático segue as configurações do seu sistema
          </p>
        </section>

        {/* SEÇÃO 2 - PREVIEW DO TEMA */}
        <section className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Eye size={20} />
            Visualização
          </h2>
          
          <motion.div 
            key={previewTheme}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="p-6 rounded-xl border-2 shadow-lg"
            style={{
              backgroundColor: previewColors.cardBg,
              color: previewColors.color,
              borderColor: previewColors.borderColor,
              transition: 'all 0.3s ease'
            }}
          >
            {/* Header do preview */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center justify-between pb-3 border-b-2 mb-4" 
              style={{ 
                borderColor: previewTheme === 'high-contrast' 
                  ? 'rgba(255,255,255,0.2)' 
                  : (previewTheme === 'dark' || (previewTheme === 'auto' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches)) 
                    ? 'rgba(255,255,255,0.1)' 
                    : 'rgba(0,0,0,0.1)' 
              }}
            >
              <div className="flex items-center gap-2">
                <img src="/icon-192.png" alt="SF" className="w-6 h-6 rounded-lg" />
                <span className="font-bold text-base">StudyFlow</span>
              </div>
            </motion.div>
            
            {/* Card de progresso */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-4 rounded-lg border mb-4" 
              style={{ 
                borderColor: previewColors.borderColor, 
                backgroundColor: previewColors.cardBg 
              }}
            >
              <p className="font-semibold mb-2 text-sm">Progresso Hoje</p>
              <p className="mb-3 opacity-80 text-xs">2h / 3h (67%)</p>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: previewColors.progressBg }}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '67%' }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    backgroundColor: previewColors.progressFill
                  }}
                />
              </div>
            </motion.div>
            
            {/* Card de desempenho */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-4 rounded-lg border mb-4" 
              style={{ 
                borderColor: previewColors.borderColor, 
                backgroundColor: previewColors.cardBg 
              }}
            >
              <p className="font-semibold mb-2 text-sm">Desempenho</p>
              <p className="opacity-80 text-xs">85% de acerto</p>
            </motion.div>
            
            {/* Botão exemplo */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-2 rounded-lg font-semibold transition-all text-sm"
              style={{ 
                backgroundColor: previewTheme === 'high-contrast' ? '#ffffff' : '#10b981',
                color: previewTheme === 'high-contrast' ? '#000000' : '#ffffff',
                border: previewTheme === 'high-contrast' ? '2px solid #ffffff' : 'none'
              }}
            >
              Botão Exemplo
            </motion.button>
          </motion.div>
        </section>

      </div>

      {/* Botões de ação - Parte do fluxo da página */}
      <div className="mt-8 flex gap-3">
        {hasChanges && (
          <Button
            onClick={handleReset}
            variant="secondary"
            fullWidth
            size="md"
            className="flex-1"
          >
            Cancelar
          </Button>
        )}
        <Button
          onClick={handleSave}
          disabled={!hasChanges}
          variant={hasChanges ? 'primary' : 'secondary'}
          fullWidth
          size="md"
          className={`flex-1 ${hasChanges ? 'shadow-lg shadow-emerald-500/30' : ''}`}
        >
          {hasChanges ? 'Salvar Alterações' : 'Nenhuma alteração'}
        </Button>
      </div>
    </div>
  );
}
