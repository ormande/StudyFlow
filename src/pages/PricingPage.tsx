import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Zap, Crown, MessageCircle, ArrowLeft, X } from 'lucide-react';
import Button from '../components/Button';
import { supabase } from '../lib/supabase';
import CheckoutMensal from '../components/CheckoutMensal';
import CheckoutVitalicio from '../components/CheckoutVitalicio';

interface PricingPageProps {
  onBack?: () => void;
  onNavigateToLogin?: () => void;
  onNavigateToSignup?: () => void;
}

export default function PricingPage({ onBack, onNavigateToLogin, onNavigateToSignup }: PricingPageProps) {
  const [coupon, setCoupon] = useState('');
  const [isCouponApplied, setIsCouponApplied] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCheckoutMensal, setShowCheckoutMensal] = useState(false);
  const [showCheckoutVitalicio, setShowCheckoutVitalicio] = useState(false);

  // Verificar sessão ao montar o componente
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };
    checkSession();

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const originalLifetimePrice = 97.00;
  const discountedLifetimePrice = 72.75;
  const currentLifetimePrice = isCouponApplied ? discountedLifetimePrice : originalLifetimePrice;

  const handleApplyCoupon = () => {
    if (coupon.toUpperCase() === 'LANCA25') {
      setIsCouponApplied(true);
    } else {
      alert('Cupom inválido');
    }
  };

  const handlePlanClick = (plan: 'mensal' | 'vitalicio') => {
    if (!session) {
      setShowAuthModal(true);
      return;
    }
    
    // Já logado, processa plano
    if (plan === 'mensal') {
      setShowCheckoutMensal(true);
    } else {
      setShowCheckoutVitalicio(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-6 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Botão voltar: sempre no mobile, no desktop só se onBack existir (não está logado no app) */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors mb-8 font-semibold md:block"
          >
            <ArrowLeft size={20} />
            Voltar
          </button>
        )}
        
        <div className="text-center mb-16">
          <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-4">
            Escolha seu plano
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Desbloqueie todo o potencial do StudyFlow
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Plano Mensal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border-2 border-transparent hover:border-emerald-500 transition-all flex flex-col"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Mensal</h3>
                <span className="inline-block bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-2 py-1 rounded-lg mt-1">
                  7 DIAS GRÁTIS
                </span>
              </div>
              <Zap className="text-emerald-500" size={32} />
            </div>
            <div className="mb-8">
              <span className="text-4xl font-black text-gray-900 dark:text-white">R$ 9,90</span>
              <span className="text-gray-500 dark:text-gray-400">/mês</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                <Check size={20} className="text-emerald-500 flex-shrink-0" />
                Sincronização na nuvem
              </li>
              <li className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                <Check size={20} className="text-emerald-500 flex-shrink-0" />
                Métricas detalhadas
              </li>
              <li className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                <Check size={20} className="text-emerald-500 flex-shrink-0" />
                Suporte prioritário
              </li>
            </ul>
            <Button
              fullWidth
              size="lg"
              onClick={() => handlePlanClick('mensal')}
            >
              Assinar Mensal
            </Button>
          </motion.div>

          {/* Plano Vitalício */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border-2 border-emerald-500 relative overflow-hidden flex flex-col"
          >
            <div className="absolute top-0 right-0 bg-emerald-500 text-white px-4 py-1 text-sm font-bold rounded-bl-xl">
              MELHOR VALOR
            </div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Vitalício</h3>
                <p className="text-emerald-500 font-bold text-sm">Pagamento Único</p>
              </div>
              <Crown className="text-emerald-500" size={32} />
            </div>
            <div className="mb-8">
              <span className="text-4xl font-black text-gray-900 dark:text-white">
                R$ {currentLifetimePrice.toFixed(2).replace('.', ',')}
              </span>
              {isCouponApplied && (
                <span className="ml-2 text-lg text-gray-400 line-through">R$ 97,00</span>
              )}
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                <Check size={20} className="text-emerald-500 flex-shrink-0" />
                Tudo do plano mensal
              </li>
              <li className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                <Check size={20} className="text-emerald-500 flex-shrink-0" />
                Acesso para sempre
              </li>
              <li className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                <Check size={20} className="text-emerald-500 flex-shrink-0" />
                Sem mensalidades
              </li>
            </ul>

            <div className="mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Cupom de desconto"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2 text-sm outline-none focus:border-emerald-500 transition-all text-gray-900 dark:text-white"
                />
                <Button variant="secondary" size="sm" onClick={handleApplyCoupon}>
                  Aplicar
                </Button>
              </div>
            </div>

            <Button
              fullWidth
              size="lg"
              variant="primary"
              onClick={() => handlePlanClick('vitalicio')}
            >
              Comprar Vitalício
            </Button>
          </motion.div>
        </div>

        <div className="mt-12 text-center space-y-4">
          {onNavigateToLogin && (
            <p className="text-sm">
              <button 
                onClick={onNavigateToLogin}
                className="text-gray-500 hover:text-emerald-600 transition-colors"
              >
                Já tem conta? <span className="font-bold underline">Faça login</span>
              </button>
            </p>
          )}
          
          <p className="text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2 text-sm">
            Dúvidas? <MessageCircle size={18} /> 
            <a href="https://t.me/studyflow_suporte_bot" target="_blank" rel="noreferrer" className="text-emerald-500 hover:underline">
              Fale com o suporte
            </a>
          </p>
        </div>
      </div>

      {/* Modal de Autenticação */}
      <AnimatePresence>
        {showAuthModal && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAuthModal(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
                {/* Botão fechar */}
                <button
                  onClick={() => setShowAuthModal(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X size={24} />
                </button>

                {/* Conteúdo */}
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Faça login para continuar
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Crie sua conta grátis ou faça login para assinar o plano.
                  </p>
                </div>

                {/* Botões de ação */}
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setShowAuthModal(false);
                      if (onNavigateToSignup) onNavigateToSignup();
                    }}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-lg font-semibold transition-colors"
                  >
                    Criar conta grátis
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowAuthModal(false);
                      if (onNavigateToLogin) onNavigateToLogin();
                    }}
                    className="w-full border-2 border-gray-300 dark:border-gray-600 hover:border-emerald-500 dark:hover:border-emerald-500 text-gray-700 dark:text-gray-300 dark:hover:text-emerald-500 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Fazer login
                  </button>
                </div>

                {/* Botão cancelar */}
                <button
                  onClick={() => setShowAuthModal(false)}
                  className="w-full mt-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors text-sm"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Checkout Bricks - Plano Mensal */}
      {showCheckoutMensal && (
        <CheckoutMensal onClose={() => setShowCheckoutMensal(false)} />
      )}

      {/* Checkout Bricks - Plano Vitalício */}
      {showCheckoutVitalicio && (
        <CheckoutVitalicio 
          onClose={() => setShowCheckoutVitalicio(false)} 
        />
      )}
    </div>
  );
}
