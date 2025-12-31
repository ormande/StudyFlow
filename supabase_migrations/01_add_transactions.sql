-- Tabela para armazenar transações PIX e vincular ao webhook
CREATE TABLE IF NOT EXISTS public.transactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    txid text UNIQUE NOT NULL,
    amount numeric NOT NULL,
    plan_type text NOT NULL CHECK (plan_type IN ('monthly', 'lifetime')),
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'expired')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Garantir que user_settings tenha os campos corretos conforme as novas regras
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS subscription_end_date timestamptz;

-- Habilitar RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Política para permitir que o sistema (service_role) faça tudo
CREATE POLICY "Service role can do everything" ON public.transactions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Política para usuários verem suas próprias transações
CREATE POLICY "Users can view own transactions" ON public.transactions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Comentários para documentação
COMMENT ON TABLE public.transactions IS 'Registra as intenções de pagamento via PIX para processamento via Webhook.';

