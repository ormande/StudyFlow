import { useState } from 'react';
import { X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function CheckoutVitalicio({ 
  onClose 
}: { 
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Novos estados para cupom
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponData, setCouponData] = useState<{valid: boolean; discount_percent?: number; coupon_id?: string; error?: string} | null>(null);

  // Preço calculado
  const originalPrice = 97.00;
  const finalPrice = couponData?.valid && couponData?.discount_percent 
    ? originalPrice * (1 - couponData.discount_percent / 100) 
    : originalPrice;

  const validateCoupon = async () => {
    if (!couponCode.trim()) return;
    
    setCouponLoading(true);
    try {
      const { data, error: funcError } = await supabase.functions.invoke('validate-coupon', {
        body: { code: couponCode.trim() }
      });
      
      if (funcError) throw funcError;
      setCouponData(data);
    } catch (err) {
      console.error('Erro ao validar cupom:', err);
      setCouponData({ valid: false, error: 'Erro ao validar cupom' });
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setCouponData(null);
  };

  const redirectToCheckout = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('1. Preparando checkout vitalício...');

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        alert('Faça login primeiro');
        onClose();
        return;
      }

      console.log('2. Chamando API de pagamento...');

      const { data, error: funcError } = await supabase.functions.invoke('efi-create-charge', {
        body: {
          amount: finalPrice,
          description: 'StudyFlow Vitalício',
          type: 'vitalicio',
          coupon_id: couponData?.valid ? couponData.coupon_id : undefined
        }
      });

      if (funcError) {
        throw new Error(funcError.message || 'Erro ao criar checkout');
      }

      if (data?.link) {
        window.location.href = data.link;
      } else {
        throw new Error('Link de pagamento não recebido');
      }

    } catch (err: any) {
      console.error('Erro:', err);
      setError(err.message || 'Erro ao processar pagamento. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden relative animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-emerald-500 text-white">
          <div>
            <h2 className="text-xl font-bold">Plano Vitalício</h2>
            <p className="text-emerald-50 text-sm">
              {couponData?.valid ? (
                <>
                  <span className="line-through opacity-70">R$ 97,00</span>
                  {' '}
                  <span className="font-bold">R$ {finalPrice.toFixed(2).replace('.', ',')}</span>
                  {' '}• Pagamento Único
                </>
              ) : (
                'R$ 97,00 • Pagamento Único'
              )}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
            <div className="w-8 h-8 text-emerald-600 dark:text-emerald-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.25V15a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1.25M18 10h.01M18 14h.01M5 10h.01M5 14h.01" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
              </svg>
            </div>
          </div>
          
          {error ? (
            <>
              <div className="text-red-500 mb-4">
                <AlertTriangle size={48} className="mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Erro ao iniciar checkout</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
              <button 
                onClick={onClose}
                className="w-full py-3 bg-gray-200 dark:bg-gray-700 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white transition-colors"
              >
                Fechar
              </button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Acesso Vitalício
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Você será redirecionado para o checkout seguro do Efi Bank onde poderá escolher entre Cartão ou Boleto.
              </p>

              {/* Campo de cupom */}
              <div className="w-full mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-left">
                  Cupom de desconto
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Digite o cupom"
                    disabled={couponLoading || couponData?.valid}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 outline-none transition-all"
                  />
                  {couponData?.valid ? (
                    <button
                      onClick={removeCoupon}
                      className="px-4 py-2 text-sm text-red-500 hover:text-red-600 font-semibold transition-colors"
                    >
                      Remover
                    </button>
                  ) : (
                    <button
                      onClick={validateCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-xl font-semibold transition-colors disabled:opacity-50"
                    >
                      {couponLoading ? '...' : 'Aplicar'}
                    </button>
                  )}
                </div>
                
                {/* Feedback do cupom */}
                {couponData && (
                  <div className={`mt-2 text-xs flex items-center gap-1 justify-start ${couponData.valid ? 'text-emerald-600' : 'text-red-500'}`}>
                    {couponData.valid ? (
                      <>
                        <CheckCircle2 size={14} />
                        Cupom aplicado! {couponData.discount_percent}% de desconto
                      </>
                    ) : (
                      <>
                        <AlertTriangle size={14} />
                        {couponData.error || 'Cupom inválido'}
                      </>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={redirectToCheckout}
                disabled={loading}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Preparando...' : 'Ir para Pagamento'}
              </button>
            </>
          )}
        </div>

        {loading && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="font-semibold text-gray-700 dark:text-gray-200">Processando...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
