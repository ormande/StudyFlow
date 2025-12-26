import { useState } from 'react';
import { Globe, Instagram, ArrowLeft, FileText, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import TermsModal from '../components/TermsModal';
import PrivacyModal from '../components/PrivacyModal';
import Button from '../components/Button';

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
        <div className="max-w-2xl lg:max-w-5xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-6">
            {/* Botão Voltar - Apenas Mobile */}
            {onNavigateBack && (
              <Button
                onClick={onNavigateBack}
                variant="ghost"
                size="md"
                leftIcon={<ArrowLeft size={20} />}
                className="md:hidden mb-4"
              >
                Voltar
              </Button>
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

          {/* Grid de Links - Desktop */}
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 lg:gap-8 lg:items-start">
            {/* Seção Redes Sociais */}
            <div className="flex flex-col w-full">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Redes Sociais
            </h2>
            <div className="space-y-3 flex-1 w-full">
              {/* Website Oficial */}
              <Button
                onClick={handleOpenWebsite}
                variant="ghost"
                fullWidth
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md min-h-[72px] h-[72px] w-full"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Globe size={20} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">Website Oficial</span>
                </div>
                <div className="w-16"></div>
              </Button>

              {/* Instagram */}
              <Button
                disabled
                variant="ghost"
                fullWidth
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between opacity-60 min-h-[72px] h-[72px] w-full"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Instagram size={20} className="text-pink-600 dark:text-pink-400" />
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">Instagram</span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium ml-3">Em breve</span>
              </Button>
            </div>
            </div>

            {/* Seção Legal */}
            <div className="flex flex-col w-full">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Legal
            </h2>
            <div className="space-y-3 flex-1 w-full">
              <Button
                onClick={() => setShowTermsModal(true)}
                variant="ghost"
                fullWidth
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md min-h-[72px] h-[72px] w-full"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                    <FileText size={20} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">Termos de Uso</span>
                </div>
                <div className="w-16"></div>
              </Button>

              <Button
                onClick={() => setShowPrivacyModal(true)}
                variant="ghost"
                fullWidth
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md min-h-[72px] h-[72px] w-full"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                    <Shield size={20} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">Política de Privacidade</span>
                </div>
                <div className="w-16"></div>
              </Button>
            </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center py-6 mt-10 border-t border-gray-200 dark:border-gray-700">
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

