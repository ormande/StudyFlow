import { useState } from 'react';
import { Lock, Mail, ArrowRight, ArrowLeft, MessageCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import { motion } from 'framer-motion';
import Button from './Button';

interface LoginScreenProps {
  onBack?: () => void;
  initialMode?: 'login' | 'forgot';
  onNavigateToSignup?: () => void;
}

export default function LoginScreen({ onBack, initialMode = 'login', onNavigateToSignup }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'forgot'>(initialMode);
  const { addToast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        addToast('Login realizado com sucesso!', 'success');
      } 
      else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}`,
        });
        if (error) throw error;
        addToast('Link de recuperação enviado para seu e-mail!', 'success');
        setMode('login');
      }
    } catch (err: any) {
      let msg = err.message;
      if (msg === 'Invalid login credentials') msg = 'E-mail ou senha incorretos.';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-6 text-gray-900 dark:text-gray-100 transition-colors duration-300 relative">
      {/* Botão Voltar (se houver onBack) - Fixo no canto superior esquerdo no desktop */}
      {onBack && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="absolute top-6 left-6 md:top-8 md:left-8 z-10"
        >
          <Button
            onClick={onBack}
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft size={18} />}
            className="text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400"
          >
            Voltar
          </Button>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-8"
      >

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center"
        >
          <div className="flex justify-center mb-4">
            <img 
              src="/icon-512.png" 
              alt="StudyFlow Logo" 
              className="w-20 h-20 rounded-lg mx-auto object-contain"
            />
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-2 text-gray-900 dark:text-white">STUDYFLOW</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {mode === 'login' && 'Entre para sincronizar seus estudos.'}
            {mode === 'forgot' && 'Recupere seu acesso.'}
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          onSubmit={handleAuth}
          className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 space-y-6 transition-colors duration-300"
        >
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">
              Seu E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl py-3 pl-10 pr-3 text-gray-900 dark:text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
            >
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="password" 
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl pl-10 pr-3 text-gray-900 dark:text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all h-12"
                  placeholder="••••••"
                />
              </div>
            </motion.div>
          )}

          <Button 
            type="submit"
            disabled={loading}
            variant="primary"
            fullWidth
            size="lg"
            isLoading={loading}
            leftIcon={!loading && (mode === 'login' ? <ArrowRight size={20} /> : <Mail size={20} />)}
            className="py-4 shadow-lg shadow-emerald-600/20 font-bold"
          >
            {mode === 'login' ? 'Entrar' : 'Enviar Link'}
          </Button>

          <Button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'forgot' : 'login')}
            variant="ghost"
            size="sm"
            fullWidth
            className="text-sm text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline mt-6"
          >
            {mode === 'login' ? 'Esqueceu sua senha?' : 'Voltar para o Login'}
          </Button>

          {mode === 'login' && onNavigateToSignup && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={onNavigateToSignup}
                className="text-sm text-gray-500 hover:text-emerald-600 transition-colors"
              >
                Não tem conta? <span className="font-bold underline text-emerald-500">Criar conta grátis</span>
              </button>
            </div>
          )}
        </motion.form>

        {/* Rodapé com Suporte */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-8 text-center"
        >
          <a
            href="https://t.me/studyflow_suporte_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block"
          >
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<MessageCircle size={16} />}
              className="text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400"
            >
              Problemas? Fale com o Suporte
            </Button>
          </a>
        </motion.div>
      </motion.div>
    </div>
  );
}

