import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrivacyModal({ isOpen, onClose }: PrivacyModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl transition-colors flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900 flex-shrink-0">
              <h3 className="font-bold text-gray-800 dark:text-white text-lg">Política de Privacidade</h3>
              <button 
                onClick={onClose} 
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                aria-label="Fechar Modal"
                title="Fechar Modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">1. Informações que Coletamos</h4>
                  <p>
                    Coletamos informações que você nos fornece diretamente, como nome, e-mail e dados de uso do aplicativo. 
                    Seus dados de estudo (registros, matérias, estatísticas) são armazenados localmente no seu dispositivo 
                    e sincronizados com nosso banco de dados seguro (Supabase) para permitir acesso em múltiplos dispositivos.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">2. Como Usamos suas Informações</h4>
                  <p>
                    Utilizamos suas informações exclusivamente para:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                    <li>Fornecer e melhorar nossos serviços</li>
                    <li>Personalizar sua experiência no aplicativo</li>
                    <li>Enviar notificações relacionadas ao serviço (quando habilitadas)</li>
                    <li>Analisar padrões de uso para melhorar a plataforma</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">3. Armazenamento de Dados</h4>
                  <p>
                    Seus dados são armazenados de forma segura utilizando o Supabase, uma plataforma de banco de dados 
                    em nuvem que segue rigorosos padrões de segurança. Implementamos medidas técnicas e organizacionais 
                    adequadas para proteger seus dados contra acesso não autorizado, alteração, divulgação ou destruição.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">4. Compartilhamento de Dados</h4>
                  <p>
                    <strong className="text-gray-900 dark:text-white">Não compartilhamos seus dados pessoais com terceiros.</strong> 
                    Seus dados de estudo são privados e acessíveis apenas por você através de sua conta autenticada. 
                    Não vendemos, alugamos ou compartilhamos suas informações para fins comerciais.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">5. Seus Direitos (LGPD)</h4>
                  <p>
                    De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                    <li>Acessar seus dados pessoais</li>
                    <li>Corrigir dados incompletos ou desatualizados</li>
                    <li>Solicitar a exclusão de seus dados</li>
                    <li>Revogar seu consentimento a qualquer momento</li>
                    <li>Solicitar portabilidade dos dados</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">6. Cookies e Tecnologias Similares</h4>
                  <p>
                    Utilizamos tecnologias padrão da web para melhorar sua experiência, como armazenamento local do navegador. 
                    Essas informações são usadas apenas para funcionalidades do aplicativo e não são compartilhadas com terceiros.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">7. Segurança</h4>
                  <p>
                    Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados, incluindo 
                    criptografia, autenticação segura e controle de acesso baseado em permissões. No entanto, nenhum método 
                    de transmissão pela internet é 100% seguro.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">8. Alterações nesta Política</h4>
                  <p>
                    Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre mudanças 
                    significativas através do aplicativo ou por e-mail. Recomendamos revisar esta política regularmente.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">9. Contato</h4>
                  <p>
                    Se você tiver dúvidas sobre esta Política de Privacidade ou sobre como tratamos seus dados pessoais, 
                    entre em contato conosco através da funcionalidade de feedback no aplicativo.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex-shrink-0">
              <button
                onClick={onClose}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-all active:scale-95"
              >
                Entendi
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

