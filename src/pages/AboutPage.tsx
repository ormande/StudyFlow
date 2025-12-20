import { useState } from 'react';
import { Globe, Instagram, ArrowLeft, FileText, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import TermsModal from '../components/TermsModal';
import PrivacyModal from '../components/PrivacyModal';

interface AboutPageProps {
  onNavigateBack?: () => void;
}

export default function AboutPage({ onNavigateBack }: AboutPageProps) {
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const handleOpenWebsite = () => {
    // Adiciona parâmetro para forçar a landing page mesmo com sessão ativa
    const url = new URL(window.location.origin);
    url.searchParams.set('landing', 'true');
    window.open(url.toString(), '_blank');
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24"
      >
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-6">
            {/* Botão Voltar - Apenas Mobile */}
            {onNavigateBack && (
              <button
                onClick={onNavigateBack}
                className="md:hidden flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors mb-4"
              >
                <ArrowLeft size={20} />
                <span className="font-semibold">Voltar</span>
              </button>
            )}
            <div className="flex items-center gap-3 mb-2">
              <img src="/icon-192.png" alt="Logo" className="w-10 h-10 mr-4 rounded-lg" />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    StudyFlow
                  </h1>
                  <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold rounded-lg">
                    v1.5.0
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Sua aprovação começa aqui
                </p>
              </div>
            </div>
          </div>

          {/* Seção Redes Sociais */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
              Redes Sociais
            </h2>
            <div className="space-y-3">
              {/* Website Oficial */}
              <button
                onClick={handleOpenWebsite}
                className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-all active:scale-95"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                    <Globe size={20} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">Website Oficial</span>
                </div>
              </button>

              {/* Instagram */}
              <button
                disabled
                className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between opacity-60 cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center">
                    <Instagram size={20} className="text-pink-600 dark:text-pink-400" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-semibold text-gray-900 dark:text-white">Instagram</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 md:hidden">Em breve</span>
                  </div>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Em breve</span>
              </button>
            </div>
          </div>

          {/* Seção Legal */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
              Legal
            </h2>
            <div className="space-y-2">
              <button
                onClick={() => setShowTermsModal(true)}
                className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-all active:scale-95"
              >
                <div className="flex items-center gap-3">
                  <FileText size={20} className="text-blue-600 dark:text-blue-400" />
                  <span className="font-semibold text-gray-900 dark:text-white">Termos de Uso</span>
                </div>
              </button>

              <button
                onClick={() => setShowPrivacyModal(true)}
                className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-all active:scale-95"
              >
                <div className="flex items-center gap-3">
                  <Shield size={20} className="text-emerald-600 dark:text-emerald-400" />
                  <span className="font-semibold text-gray-900 dark:text-white">Política de Privacidade</span>
                </div>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center py-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © 2026 StudyFlow. Feito com <span className="text-emerald-500">💚</span> por Kayke Paião
            </p>
          </div>
        </div>
      </motion.div>

      {/* Modais */}
      <TermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
      <PrivacyModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />
    </>
  );
}

