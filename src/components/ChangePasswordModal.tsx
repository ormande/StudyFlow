import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Check, X, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { addToast } = useToast();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validações
    if (newPassword.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      
      if (updateError) throw updateError;
      
      addToast('Senha alterada com sucesso! 🔒', 'success');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao alterar senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500 rounded-xl text-white">
                  <Lock size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white">Alterar Senha</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Defina uma nova senha para sua conta
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={loading}
                className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X size={18} />
              </button>
            </div>

            {/* Conteúdo */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Input Nova Senha */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Nova Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                    required
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl py-3 pl-10 pr-3 text-gray-900 dark:text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Input Confirmar Senha */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Confirme a Nova Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Digite a senha novamente"
                    minLength={6}
                    required
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl py-3 pl-10 pr-3 text-gray-900 dark:text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Mensagem de Erro */}
              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                  <AlertCircle size={18} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Botões */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl font-semibold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || newPassword.length < 6 || confirmPassword.length < 6 || newPassword !== confirmPassword}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      <span>Salvar</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
