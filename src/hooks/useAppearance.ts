import { useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark' | 'auto' | 'high-contrast';
export type FontSize = 'small' | 'medium' | 'large';

export interface AppearanceSettings {
  theme: Theme;
  fontSize: FontSize;
  animationsEnabled: boolean;
}

const defaultSettings: AppearanceSettings = {
  theme: 'auto',
  fontSize: 'medium', // 'medium' = nenhuma classe (tamanho natural do Tailwind: 16px)
  animationsEnabled: true,
};

const STORAGE_KEYS = {
  theme: 'studyflow_theme',
  fontSize: 'studyflow_font_size',
  animationsEnabled: 'studyflow_animations_enabled',
};

/**
 * Aplica o tema ao documento HTML
 */
const applyTheme = (theme: Theme) => {
  const html = document.documentElement;
  
  // Remover classes antigas
  html.classList.remove('light', 'dark', 'high-contrast');
  
  if (theme === 'auto') {
    // Verificar preferência do sistema
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    html.classList.add(isDark ? 'dark' : 'light');
  } else {
    html.classList.add(theme);
  }
};

/**
 * Aplica o tamanho de fonte ao documento HTML
 */
const applyFontSize = (fontSize: FontSize) => {
  const html = document.documentElement;
  
  // Mapear fontSize para nomes de classe CSS corretos
  // 'medium' = nenhuma classe (usa tamanho natural do Tailwind: 16px)
  const fontSizeClassMap: Record<FontSize, string | null> = {
    small: 'font-size-sm',
    medium: null, // Não aplicar classe - usa tamanho natural do Tailwind
    large: 'font-size-lg',
  };
  
  // Remover todas as classes de tamanho de fonte possíveis
  html.classList.remove('font-size-sm', 'font-size-base', 'font-size-lg', 'font-size-small', 'font-size-medium', 'font-size-large');
  
  // Adicionar a classe correta baseada no mapeamento (se não for null)
  const className = fontSizeClassMap[fontSize];
  if (className) {
    html.classList.add(className);
  }
};

/**
 * Aplica configuração de animações
 */
const applyAnimations = (enabled: boolean) => {
  const html = document.documentElement;
  
  if (enabled) {
    html.classList.remove('reduce-motion');
  } else {
    html.classList.add('reduce-motion');
  }
};

/**
 * Hook para gerenciar configurações de aparência
 */
export function useAppearance() {
  const [settings, setSettings] = useState<AppearanceSettings>(() => {
    // Carregar do localStorage na inicialização
    if (typeof window === 'undefined') return defaultSettings;
    
    const theme = (localStorage.getItem(STORAGE_KEYS.theme) as Theme) || defaultSettings.theme;
    const fontSize = (localStorage.getItem(STORAGE_KEYS.fontSize) as FontSize) || defaultSettings.fontSize;
    const animationsEnabled = localStorage.getItem(STORAGE_KEYS.animationsEnabled) !== 'false';
    
    return {
      theme,
      fontSize,
      animationsEnabled,
    };
  });

  // Aplicar configurações ao carregar
  useEffect(() => {
    applyTheme(settings.theme);
    applyFontSize(settings.fontSize);
    applyAnimations(settings.animationsEnabled);
    
    // Listener para mudanças no tema do sistema (quando theme === 'auto')
    if (settings.theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        const html = document.documentElement;
        html.classList.remove('light', 'dark');
        html.classList.add(e.matches ? 'dark' : 'light');
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [settings]);

  // Atualizar tema
  const updateTheme = useCallback((theme: Theme) => {
    setSettings(prev => ({ ...prev, theme }));
    localStorage.setItem(STORAGE_KEYS.theme, theme);
    applyTheme(theme);
  }, []);

  // Atualizar tamanho de fonte
  const updateFontSize = useCallback((fontSize: FontSize) => {
    setSettings(prev => ({ ...prev, fontSize }));
    localStorage.setItem(STORAGE_KEYS.fontSize, fontSize);
    applyFontSize(fontSize);
  }, []);

  // Atualizar animações
  const updateAnimations = useCallback((enabled: boolean) => {
    setSettings(prev => ({ ...prev, animationsEnabled: enabled }));
    localStorage.setItem(STORAGE_KEYS.animationsEnabled, String(enabled));
    applyAnimations(enabled);
  }, []);

  // Salvar todas as configurações
  const saveSettings = useCallback((newSettings: Partial<AppearanceSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    
    // Salvar no localStorage
    if (newSettings.theme !== undefined) {
      localStorage.setItem(STORAGE_KEYS.theme, updated.theme);
      applyTheme(updated.theme);
    }
    if (newSettings.fontSize !== undefined) {
      localStorage.setItem(STORAGE_KEYS.fontSize, updated.fontSize);
      applyFontSize(updated.fontSize);
    }
    if (newSettings.animationsEnabled !== undefined) {
      localStorage.setItem(STORAGE_KEYS.animationsEnabled, String(updated.animationsEnabled));
      applyAnimations(updated.animationsEnabled);
    }
    
    // Remover animações do localStorage se não foi passado (para limpar dados antigos)
    if (newSettings.animationsEnabled === undefined && !newSettings.theme && !newSettings.fontSize) {
      // Não fazer nada - manter compatibilidade
    }
  }, [settings]);

  // Hook para verificar se animações devem ser desabilitadas (para Framer Motion)
  const shouldReduceMotion = !settings.animationsEnabled;

  return {
    settings,
    updateTheme,
    updateFontSize,
    updateAnimations,
    saveSettings,
    shouldReduceMotion,
  };
}
