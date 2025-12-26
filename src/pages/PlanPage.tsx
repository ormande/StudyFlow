import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Zap, Crown, ArrowLeft, MessageCircle, Star, Gift, CreditCard, Diamond, XCircle, AlertCircle, X } from 'lucide-react';
import Button from '../components/Button';
import CheckoutMensal from '../components/CheckoutMensal';
import CheckoutVitalicio from '../components/CheckoutVitalicio';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';

interface PlanPageProps {
  subscriptionStatus: string | null;
  subscriptionType: string | null;
  onNavigateBack: () => void;
}

export default function PlanPage({ 
  subscriptionStatus: initialStatus, 
  subscriptionType: initialType,
  onNavigateBack 
}: PlanPageProps) {
  const { addToast } = useToast();
  const [coupon, setCoupon] = useState('');
  const [isCouponApplied, setIsCouponApplied] = useState(false);
  const [showCheckoutMensal, setShowCheckoutMensal] = useState(false);
  const [showCheckoutVitalicio, setShowCheckoutVitalicio] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const [planStatus, setPlanStatus] = useState<{
    type: 'trial' | 'monthly' | 'lifetime' | 'none';
    status: string;
    trialEndsAt?: string;
    nextBillingDate?: string;
  }>({ 
    type: (initialStatus === 'trial' ? 'trial' : (initialStatus === 'active' ? (initialType === 'lifetime' ? 'lifetime' : 'monthly') : 'none')), 
    status: initialStatus || 'none' 
  });

  useEffect(() => {
    const fetchPlanStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('user_settings')
        .select('subscription_status, subscription_type, trial_ends_at, next_billing_date')
        .eq('user_id', session.user.id)
        .single();

      if (error || !data) {
        console.error('Erro ao buscar plano:', error);
        return;
      }

      // PRIORIDADE: subscription_status (não type!)
      if (data.subscription_status === 'trial') {
        setPlanStatus({
          type: 'trial',
          status: 'active',
          trialEndsAt: data.trial_ends_at,
        });
      } else if (data.subscription_status === 'active') {
        // Verificar se é mensal ou vitalício pelo tipo
        setPlanStatus({
          type: data.subscription_type === 'lifetime' ? 'lifetime' : 'monthly',
          status: 'active',
          nextBillingDate: data.next_billing_date,
        });
      } else {
        setPlanStatus({
          type: 'none',
          status: data.subscription_status || 'none',
        });
      }
    };

    fetchPlanStatus();
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

  const isSubscribed = planStatus.type !== 'none' && planStatus.status === 'active';

  const handleCancelSubscription = async () => {
    setCancelling(true);
    try {
      const { data, error } = await supabase.functions.invoke('efi-cancel-subscription');
      
      if (error) throw error;

      addToast('Assinatura cancelada com sucesso.', 'success');
      setPlanStatus(prev => ({ ...prev, status: 'cancelled' }));
      setShowCancelModal(false);
    } catch (err: any) {
      console.error('Erro ao cancelar:', err);
      addToast('Erro ao cancelar assinatura. Tente novamente mais tarde.', 'error');
    } finally {
      setCancelling(false);
    }
  };

  const daysLeft = useMemo(() => {
    if (planStatus.type === 'trial' && planStatus.trialEndsAt) {
      // Comparar apenas datas (sem horário) para contagem intuitiva
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const endDate = new Date(planStatus.trialEndsAt);
      endDate.setHours(0, 0, 0, 0);
      
      const diffMs = endDate.getTime() - today.getTime();
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      return days;
    }
    return null;
  }, [planStatus.type, planStatus.trialEndsAt]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 md:pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      {/* Header com botão voltar fixo no mobile */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onNavigateBack}
            className="md:hidden flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors font-semibold"
          >
            <ArrowLeft size={20} />
            Voltar
          </button>
          <div className="hidden md:block w-10 h-10" />
        </div>

        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-4">
            Assinatura StudyFlow
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {isSubscribed 
              ? 'Você já possui um plano ativo. Aproveite todos os recursos!' 
              : 'Escolha o plano ideal para sua rotina de estudos'}
          </p>
        </div>

        {/* Status da Assinatura Atual */}
        <div className="mb-12">
          {planStatus.type === 'trial' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 rounded-3xl p-6 shadow-lg shadow-yellow-400/10"
            >
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-white shadow-lg">
                    <Star size={24} fill="currentColor" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-yellow-800 dark:text-yellow-200 mb-1 flex items-center gap-2">
                      <Gift size={20} /> Plano Trial
                    </h3>
                    <p className="text-yellow-700 dark:text-yellow-300">
                      Você está testando o StudyFlow gratuitamente!
                    </p>
                  </div>
                </div>
                <div className="text-center md:text-right">
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 font-bold">
                    {daysLeft !== null && daysLeft <= 0 ? (
                      <span className="text-red-600 dark:text-red-400">Trial expirado</span>
                    ) : (
                      <span>{daysLeft} {daysLeft === 1 ? 'dia restante' : 'dias restantes'}</span>
                    )}
                  </p>
                  <p className="text-xs text-yellow-600/70 dark:text-yellow-400/70">
                    Expira em: {planStatus.trialEndsAt ? new Date(planStatus.trialEndsAt).toLocaleDateString('pt-BR') : '-'}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {planStatus.type === 'monthly' && (planStatus.status === 'active' || planStatus.status === 'cancelled') && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`border-2 rounded-3xl p-6 shadow-lg ${
                planStatus.status === 'active' 
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-400 shadow-emerald-400/10' 
                  : 'bg-gray-50 dark:bg-gray-800 border-gray-300 shadow-gray-400/10'
              }`}
            >
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg ${
                    planStatus.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'
                  }`}>
                    <Star size={24} fill="currentColor" />
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold mb-1 flex items-center gap-2 ${
                      planStatus.status === 'active' ? 'text-emerald-800 dark:text-emerald-200' : 'text-gray-800 dark:text-gray-200'
                    }`}>
                      <CreditCard size={20} /> 
                      {planStatus.status === 'active' ? 'Plano Mensal Ativo' : 'Assinatura Cancelada'}
                    </h3>
                    <p className={planStatus.status === 'active' ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-600 dark:text-gray-400'}>
                      {planStatus.status === 'active' ? 'R$ 9,90/mês' : 'Acesso limitado até o fim do período'}
                    </p>
                  </div>
                </div>
                <div className="text-center md:text-right flex flex-col items-center md:items-end gap-3">
                  <p className={`text-sm font-medium ${
                    planStatus.status === 'active' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {planStatus.status === 'active' ? 'Próxima cobrança: ' : 'Acesso até: '}
                    {planStatus.nextBillingDate ? new Date(planStatus.nextBillingDate).toLocaleDateString('pt-BR') : '-'}
                  </p>
                  
                  {planStatus.status === 'active' && (
                    <button
                      onClick={() => setShowCancelModal(true)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-600 transition-colors p-1"
                    >
                      <XCircle size={14} />
                      Cancelar assinatura
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {planStatus.type === 'lifetime' && planStatus.status === 'active' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-400 rounded-3xl p-6 shadow-lg shadow-purple-400/10"
            >
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white shadow-lg">
                    <Crown size={24} fill="currentColor" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-purple-800 dark:text-purple-200 mb-1 flex items-center gap-2">
                      <Diamond size={20} /> Acesso Vitalício
                    </h3>
                    <p className="text-purple-700 dark:text-purple-300">
                      Acesso ilimitado para sempre!
                    </p>
                  </div>
                </div>
                <div className="text-center md:text-right">
                  <span className="bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Vitalício
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Planos Disponíveis */}
        <div className={`grid md:grid-cols-2 gap-8 ${planStatus.type === 'lifetime' ? 'opacity-50 pointer-events-none' : ''}`}>
          {/* Plano Mensal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border-2 transition-all flex flex-col ${planStatus.type === 'monthly' ? 'border-emerald-500' : 'border-transparent hover:border-emerald-500'}`}
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
              disabled={planStatus.type === 'monthly' || planStatus.type === 'lifetime'}
              onClick={() => setShowCheckoutMensal(true)}
            >
              {planStatus.type === 'monthly' ? 'Plano Atual' : (planStatus.type === 'lifetime' ? 'Já Vitalício' : 'Assinar Mensal')}
            </Button>
          </motion.div>

          {/* Plano Vitalício */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border-2 border-emerald-500 relative overflow-hidden flex flex-col ${planStatus.type === 'lifetime' ? 'ring-4 ring-emerald-500/20' : ''}`}
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

            {planStatus.type !== 'lifetime' && (
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
            )}

            <Button
              fullWidth
              size="lg"
              variant="primary"
              disabled={planStatus.type === 'lifetime'}
              onClick={() => setShowCheckoutVitalicio(true)}
            >
              {planStatus.type === 'lifetime' ? 'Plano Atual' : 'Comprar Vitalício'}
            </Button>
          </motion.div>
        </div>

      </div>

      {/* Checkout Modals */}
      {showCheckoutMensal && (
        <CheckoutMensal onClose={() => setShowCheckoutMensal(false)} />
      )}
      {showCheckoutVitalicio && (
        <CheckoutVitalicio 
          onClose={() => setShowCheckoutVitalicio(false)} 
        />
      )}

      {/* Cancel Subscription Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-red-50 dark:bg-red-900/20">
                <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                  <AlertCircle size={24} />
                  <h3 className="text-xl font-bold">Cancelar Assinatura</h3>
                </div>
                <button 
                  onClick={() => setShowCancelModal(false)}
                  className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              <div className="p-6">
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Tem certeza que deseja cancelar sua assinatura mensal?
                </p>
                
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 mb-6">
                  <p className="text-sm text-amber-800 dark:text-amber-300">
                    Você ainda terá acesso a todos os recursos PRO até o dia <strong>{planStatus.nextBillingDate ? new Date(planStatus.nextBillingDate).toLocaleDateString('pt-BR') : '-'}</strong>. Após essa data, sua conta voltará ao plano gratuito.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCancelModal(false)}
                    disabled={cancelling}
                    className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all disabled:opacity-50"
                  >
                    Manter Plano
                  </button>
                  <button
                    onClick={handleCancelSubscription}
                    disabled={cancelling}
                    className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/25 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {cancelling ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Cancelando...
                      </>
                    ) : (
                      'Confirmar Cancelamento'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

