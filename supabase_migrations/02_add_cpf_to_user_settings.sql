-- Adiciona CPF/CNPJ no perfil do usuário para uso no fluxo de pagamentos (Asaas)
ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS cpf_cnpj text;

COMMENT ON COLUMN public.user_settings.cpf_cnpj IS
'CPF/CNPJ do usuário usado no checkout e criação de customer em gateways de pagamento.';

