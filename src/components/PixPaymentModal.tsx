import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Timer, AlertCircle, QrCode, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';

interface PixPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: 'lifetime' | 'monthly';
  couponCode?: string;
  onPaymentConfirmed: () => void;
}

interface PixData {
  txid: string;
  pixCopiaECola: string;
  qrcode: string;
  valor: string | number;
  expiracao: number;
}

export default function PixPaymentModal({
  isOpen,
  onClose,
  plan,
  couponCode,
  onPaymentConfirmed
}: PixPaymentModalProps) {
  const { addToast } = useToast();
  const [status, setStatus] = useState<'loading' | 'ready' | 'success' | 'expired' | 'error'>('loading');
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(3600); // 1 hora em segundos
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Gerar PIX ao abrir
  useEffect(() => {
    if (isOpen) {
      generatePix();
    } else {
      // Resetar estados ao fechar
      setStatus('loading');
      setPixData(null);
      setTimeLeft(3600);
      setCopied(false);
      setError(null);
    }
  }, [isOpen]);

  const generatePix = async () => {
    setStatus('loading');
    setError(null);
    try {
      const { data, error: funcError } = await supabase.functions.invoke('pix-create', {
        body: { plan, coupon_code: couponCode }
      });

      if (funcError) throw funcError;
      if (!data.success) throw new Error(data.error || 'Erro ao gerar PIX');

      setPixData(data.data);
      setTimeLeft(data.data.expiracao || 3600);
      setStatus('ready');
    } catch (err: any) {
      console.error('Erro ao gerar PIX:', err);
      setError(err.message || 'Não foi possível gerar o QR Code PIX. Tente novamente.');
      setStatus('error');
    }
  };

  // Timer
  useEffect(() => {
    if (status !== 'ready' || timeLeft <= 0) {
      if (timeLeft <= 0 && status === 'ready') {
        setStatus('expired');
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [status, timeLeft]);

  // Polling
  useEffect(() => {
    if (!isOpen || status !== 'ready' || !pixData) return;

    const interval = setInterval(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error: fetchError } = await supabase
          .from('user_settings')
          .select('subscription_status')
          .eq('user_id', user.id)
          .single();

        if (fetchError) {
          console.error('Erro ao verificar status:', fetchError);
          return;
        }

        if (data?.subscription_status === 'active') {
          setStatus('success');
          clearInterval(interval);
          setTimeout(() => {
            onPaymentConfirmed();
            onClose();
          }, 2000);
        }
      } catch (err) {
        console.error('Erro no polling:', err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isOpen, status, pixData, onClose, onPaymentConfirmed]);

  const copyToClipboard = () => {
    if (!pixData) return;
    navigator.clipboard.writeText(pixData.pixCopiaECola);
    setCopied(true);
    addToast('Código PIX copiado!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden relative border border-gray-100 dark:border-gray-800"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-emerald-500 text-white">
          <div>
            <h2 className="text-xl font-bold">Pagamento PIX</h2>
            <p className="text-emerald-50 text-sm">
              {plan === 'lifetime' ? 'Plano Vitalício' : 'Plano Mensal'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {status === 'loading' && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12 gap-4"
              >
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-600 dark:text-gray-400 font-medium">Gerando seu QR Code PIX...</p>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center text-center py-8 gap-4"
              >
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400">
                  <AlertCircle size={32} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Ops! Algo deu errado</h3>
                  <p className="text-gray-500 dark:text-gray-400 mt-2">{error}</p>
                </div>
                <button
                  onClick={generatePix}
                  className="mt-4 px-6 py-2 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors"
                >
                  Tentar Novamente
                </button>
              </motion.div>
            )}

            {status === 'ready' && pixData && (
              <motion.div
                key="ready"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-6"
              >
                {/* Timer */}
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono text-sm ${timeLeft < 300 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>
                  <Timer size={16} />
                  <span>Expira em: {formatTime(timeLeft)}</span>
                </div>

                {/* QR Code */}
                <div className="bg-white p-4 rounded-2xl shadow-inner border border-gray-100 dark:border-gray-800">
                  {pixData.qrcode && (
                    <img
                      src={pixData.qrcode}
                      alt="QR Code PIX"
                      className="w-48 h-48 md:w-64 md:h-64 mx-auto"
                    />
                  )}
                </div>

                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    R$ {String(pixData.valor).replace('.', ',')}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                    Escaneie o código acima com o app do seu banco
                  </p>
                </div>

                {/* Copia e Cola */}
                <div className="w-full">
                  <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 text-center">
                    Ou use o Pix Copia e Cola
                  </label>
                  <div className="relative flex items-center bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 group">
                    <p className="text-xs font-mono text-gray-500 dark:text-gray-400 truncate pr-12">
                      {pixData.pixCopiaECola}
                    </p>
                    <button
                      onClick={copyToClipboard}
                      className="absolute right-2 p-2 bg-emerald-500 text-white rounded-xl shadow-lg hover:bg-emerald-600 transition-all active:scale-95"
                    >
                      {copied ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                  Aguardando confirmação do pagamento...
                </div>
              </motion.div>
            )}

            {status === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-8 text-center"
              >
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6">
                  <motion.div
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Check size={48} strokeWidth={3} />
                  </motion.div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Pagamento Confirmado!</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Parabéns! Seu acesso {plan === 'lifetime' ? 'vitalício' : 'mensal'} foi ativado com sucesso.
                </p>
                <div className="mt-8 flex items-center gap-2 text-emerald-600 font-semibold">
                  Redirecionando em instantes <ArrowRight size={18} className="animate-bounce-x" />
                </div>
              </motion.div>
            )}

            {status === 'expired' && (
              <motion.div
                key="expired"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center text-center py-8 gap-4"
              >
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Timer size={32} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">QR Code Expirado</h3>
                  <p className="text-gray-500 dark:text-gray-400 mt-2">
                    O tempo para pagamento deste QR Code expirou. Por favor, gere um novo código.
                  </p>
                </div>
                <button
                  onClick={generatePix}
                  className="mt-4 px-6 py-2 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors"
                >
                  Gerar Novo QR Code
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

