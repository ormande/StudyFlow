import { createClient } from '@supabase/supabase-js';

// Busca as chaves que você colou no arquivo .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Garante que as chaves existem antes de tentar conectar
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Faltam as variáveis de ambiente do Supabase (.env)');
}

// Cria a conexão oficial
export const supabase = createClient(supabaseUrl, supabaseKey);