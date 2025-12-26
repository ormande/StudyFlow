import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TermsModal({ isOpen, onClose }: TermsModalProps) {
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
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">Termos de Uso</h3>
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
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">1. Aceitação dos Termos</h4>
                  <p>
                    Ao acessar e usar o StudyFlow, você concorda em cumprir e estar vinculado a estes Termos de Uso. 
                    Se você não concorda com alguma parte destes termos, não deve usar nosso serviço.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">2. Uso do Serviço</h4>
                  <p>
                    O StudyFlow é uma plataforma SaaS destinada a auxiliar estudantes em sua organização e acompanhamento de estudos. 
                    Você concorda em usar o serviço apenas para fins legais e de acordo com estes termos.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">3. Conta do Usuário</h4>
                  <p>
                    Você é responsável por manter a confidencialidade de sua conta e senha. Você concorda em notificar-nos 
                    imediatamente sobre qualquer uso não autorizado de sua conta. Cada conta é pessoal e intransferível.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">4. Isenção de Responsabilidade</h4>
                  <p>
                    O StudyFlow é fornecido "como está", sem garantias de qualquer tipo. Não garantimos que o serviço será 
                    ininterrupto, seguro ou livre de erros. Você usa o serviço por sua conta e risco.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">5. Propriedade Intelectual</h4>
                  <p>
                    Todo o conteúdo do StudyFlow, incluindo design, código, logotipos e textos, é propriedade do StudyFlow 
                    ou de seus licenciadores. É proibida a engenharia reversa, descompilação ou desmontagem do software.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">6. Limitação de Responsabilidade</h4>
                  <p>
                    Em nenhuma circunstância o StudyFlow será responsável por danos diretos, indiretos, incidentais ou 
                    consequenciais resultantes do uso ou incapacidade de usar o serviço.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">7. Modificações dos Termos</h4>
                  <p>
                    Reservamos o direito de modificar estes termos a qualquer momento. As alterações entrarão em vigor 
                    imediatamente após a publicação. O uso continuado do serviço constitui aceitação dos termos modificados.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">8. Encerramento</h4>
                  <p>
                    Podemos encerrar ou suspender sua conta imediatamente, sem aviso prévio, por violação destes termos 
                    ou por qualquer outro motivo que consideremos apropriado.
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

