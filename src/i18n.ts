import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Recursos de tradução
const resources = {
  pt: {
    translation: {
      'cycle.title': 'Ciclo de Estudos',
      'settings.language': 'Idioma',
    },
  },
  en: {
    translation: {
      'cycle.title': 'Study Cycle',
      'settings.language': 'Language',
    },
  },
  es: {
    translation: {
      'cycle.title': 'Ciclo de Estudios',
      'settings.language': 'Idioma',
    },
  },
};

i18n
  .use(LanguageDetector) // Detecta o idioma do navegador
  .use(initReactI18next) // Passa o i18n para react-i18next
  .init({
    resources,
    fallbackLng: 'pt', // Idioma padrão caso não encontre tradução
    debug: false, // Desabilita logs de debug em produção
    
    interpolation: {
      escapeValue: false, // React já faz escape por padrão
    },
    
    react: {
      useSuspense: false, // Evita problemas com Suspense
      bindI18n: 'languageChanged', // Força re-render quando o idioma muda
    },
    
    detection: {
      // Ordem de detecção do idioma
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'], // Salva a preferência no localStorage
      lookupLocalStorage: 'i18nextLng', // Chave padrão do localStorage
    },
  });

export default i18n;
