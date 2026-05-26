import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, RefreshCw, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import Button from '../components/Button';

interface VerifyEmailPageProps {
  email: string;
  onNavigateToLogin: () => void;
  onNavigateToSignup: () => void;
}

export default function VerifyEmailPage({ email, onNavigateToLogin, onNavigateToSignup }: VerifyEmailPageProps) {
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60); // Inicia com 60s ao montar
  const { addToast } = useToast();

  useEffect(() => {
    let timer: number;
    if (countdown > 0) {
      timer = window.setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleResendEmail = async () => {
    if (countdown > 0 || loading) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: window.location.origin
        }
      });

      if (error) throw error;

      addToast('E-mail de confirmação reenviado!', 'success');
      setCountdown(60); // Timer de 60 segundos
    } catch (error: any) {
      console.error('Erro ao reenviar e-mail:', error);
      addToast(error.message || 'Erro ao reenviar e-mail.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-6 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="text-center">
          <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 text-white shadow-lg shadow-emerald-500/20">
            <Mail size={40} />
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-3 uppercase text-emerald-600 dark:text-emerald-500">
            Verifique seu e-mail
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">
            Enviamos um link de confirmação para <br />
            <span className="font-bold text-gray-900 dark:text-white">{email}</span>. <br />
            Clique no link para ativar sua conta.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 space-y-6">
          <div className="space-y-4">
            <Button
              onClick={handleResendEmail}
              disabled={loading || countdown > 0}
              variant="primary"
              fullWidth
              size="lg"
              isLoading={loading}
              leftIcon={!loading && <RefreshCw size={20} className={countdown > 0 ? 'animate-spin' : ''} />}
              className="py-4 shadow-lg shadow-emerald-600/20 font-bold"
            >
              {countdown > 0 ? `Reenviar em ${countdown}s` : 'Não recebeu? Reenviar e-mail'}
            </Button>

            <button
              onClick={onNavigateToLogin}
              className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors py-2"
            >
              <ArrowLeft size={16} />
              <span>Voltar para o Login</span>
            </button>
          </div>

          <div className="pt-6 border-t border-gray-100 dark:border-gray-700 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1.5">
              <CheckCircle size={14} className="text-emerald-500" />
              Já confirmou? Atualize a página
            </p>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={onNavigateToSignup}
            className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors font-medium"
          >
            Digitou o e-mail errado? <span className="underline">Criar outra conta</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

