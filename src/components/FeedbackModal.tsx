import { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, Bug, Lightbulb, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import { FeedbackType } from '../types';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userId?: string;
}

const FEEDBACK_TYPES: { value: FeedbackType; label: string; icon: typeof Bug; emoji: string }[] = [
  { value: 'bug', label: 'Bug/Erro', icon: Bug, emoji: '🐛' },
  { value: 'suggestion', label: 'Sugestão de Melhoria', icon: Lightbulb, emoji: '💡' },
  { value: 'compliment', label: 'Elogio/Comentário Positivo', icon: Heart, emoji: '❤️' },
];

const PLACEHOLDERS: Record<FeedbackType, string> = {
  bug: 'Descreva o que aconteceu, quando ocorreu e o que você esperava...',
  suggestion: 'Conte sua ideia! O que você gostaria de ver no app?',
  compliment: 'Adoramos ouvir feedback positivo! O que você mais gostou?',
};

const SUCCESS_MESSAGES: Record<FeedbackType, string> = {
  bug: 'Obrigado por reportar! Vamos investigar.',
  suggestion: 'Adoramos a ideia! Vamos avaliar.',
  compliment: 'Isso nos motiva muito! ❤️',
};

const MAX_MESSAGE_LENGTH = 500;
const MIN_MESSAGE_LENGTH = 10;

export default function FeedbackModal({ isOpen, onClose, userEmail, userId }: FeedbackModalProps) {
  const [type, setType] = useState<FeedbackType>('bug');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(userEmail || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMinLengthError, setShowMinLengthError] = useState(false);
  const { addToast } = useToast();
  const typeSelectRef = useRef<HTMLButtonElement>(null);
  const messageTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Pré-preencher email se o usuário estiver autenticado
  useEffect(() => {
    if (userEmail && !email) {
      setEmail(userEmail);
    }
  }, [userEmail]);

  // Focar no primeiro campo ao abrir
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        typeSelectRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Resetar formulário ao fechar
  useEffect(() => {
    if (!isOpen) {
      setType('bug');
      setMessage('');
      setEmail(userEmail || '');
      setShowMinLengthError(false);
    }
  }, [isOpen, userEmail]);

  // Esconder erro quando a mensagem atingir o mínimo
  useEffect(() => {
    if (message.trim().length >= MIN_MESSAGE_LENGTH) {
      setShowMinLengthError(false);
    }
  }, [message]);

  // Fechar com ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Enviar com Ctrl/Cmd + Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && isOpen) {
        const trimmedMessage = message.trim();
        if (trimmedMessage.length >= MIN_MESSAGE_LENGTH && trimmedMessage.length <= MAX_MESSAGE_LENGTH) {
          handleSubmit(e);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, message]);

  const isValid = () => {
    return type && message.trim().length >= MIN_MESSAGE_LENGTH && message.length <= MAX_MESSAGE_LENGTH;
  };

  const handleSubmit = async (e?: React.FormEvent | KeyboardEvent) => {
    e?.preventDefault();

    // Validar comprimento mínimo
    if (message.trim().length < MIN_MESSAGE_LENGTH) {
      setShowMinLengthError(true);
      messageTextareaRef.current?.focus();
      return;
    }

    if (!isValid() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('feedback').insert([
        {
          user_id: userId || null,
          type,
          message: message.trim(),
          email: email.trim() || null,
          user_agent: navigator.userAgent,
          status: 'pending',
        },
      ]);

      if (error) {
        throw error;
      }

      // Sucesso
      addToast(`Feedback enviado com sucesso! ${SUCCESS_MESSAGES[type]}`, 'success');
      
      // Limpar formulário
      setMessage('');
      setType('bug');
      
      // Fechar modal após um pequeno delay
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error: any) {
      console.error('Erro ao enviar feedback:', error);
      addToast('Erro ao enviar feedback. Tente novamente.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const messageLength = message.length;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.3 }}
          className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg md:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                💬 Dar Feedback
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Ajude-nos a melhorar o StudyFlow
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Fechar"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Tipo de Feedback */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Tipo de Feedback <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {FEEDBACK_TYPES.map((feedbackType) => {
                  const Icon = feedbackType.icon;
                  const isSelected = type === feedbackType.value;

                  return (
                    <button
                      key={feedbackType.value}
                      ref={isSelected ? typeSelectRef : null}
                      type="button"
                      onClick={() => setType(feedbackType.value)}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:border-emerald-300 dark:hover:border-emerald-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Icon size={18} className={isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'} />
                        <span className="text-lg">{feedbackType.emoji}</span>
                      </div>
                      <p className={`text-sm font-medium break-words ${isSelected ? 'font-bold' : ''}`}>
                        {feedbackType.label}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mensagem */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Mensagem <span className="text-red-500">*</span>
              </label>
              <textarea
                ref={messageTextareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={PLACEHOLDERS[type]}
                rows={6}
                maxLength={MAX_MESSAGE_LENGTH}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 transition-colors resize-none"
                required
              />
              <div className="flex items-center justify-between mt-2">
                <p className={`text-xs ${showMinLengthError ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'}`}>
                  {showMinLengthError && messageLength < MIN_MESSAGE_LENGTH
                    ? `Mínimo ${MIN_MESSAGE_LENGTH} caracteres`
                    : `${messageLength} / ${MAX_MESSAGE_LENGTH} caracteres`}
                </p>
                {messageLength > MAX_MESSAGE_LENGTH * 0.9 && messageLength <= MAX_MESSAGE_LENGTH && (
                  <p className="text-xs text-amber-500">Aproximando do limite</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Email <span className="text-gray-400 dark:text-gray-500 text-xs">(opcional)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com (opcional)"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 transition-colors"
              />
              {userEmail && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Email da sua conta: {userEmail}
                </p>
              )}
            </div>
          </form>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={message.trim().length < MIN_MESSAGE_LENGTH || message.length > MAX_MESSAGE_LENGTH || isSubmitting}
              className="px-6 py-2.5 rounded-xl font-semibold bg-emerald-500 hover:bg-emerald-600 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Enviar Feedback
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
