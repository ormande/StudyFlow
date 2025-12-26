import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CheckoutMensalProps {
  onClose: () => void;
}

export default function CheckoutMensal({ onClose }: CheckoutMensalProps) {
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('efi-create-subscription', {
        body: {
          amount: 9.90,
          description: 'StudyFlow Mensal',
          type: 'mensal'
        }
      });

      if (error) throw error;

      if (data?.link) {
        window.location.href = data.link;
      } else {
        throw new Error('Link de pagamento não recebido');
      }
    } catch (error) {
      console.error('Erro no pagamento:', error);
      alert('Erro ao processar pagamento. Tente novamente mais tarde.');
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
            <h2 className="text-xl font-bold">Plano Mensal</h2>
            <p className="text-emerald-50 text-sm">
              R$ 9,90/mês • 7 dias grátis
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Finalizar Assinatura
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Você será redirecionado para o checkout seguro do Efi Bank onde poderá escolher entre Cartão ou Boleto.
          </p>
          <button
            onClick={onSubmit}
            disabled={loading}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Preparando...' : 'Ir para Pagamento'}
          </button>
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

