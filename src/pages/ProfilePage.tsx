import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Camera, Save, Loader2, Crown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import Button from '../components/Button';

interface ProfilePageProps {
  session: any;
  onNavigateBack?: () => void;
}

interface ProfileData {
  first_name: string;
  last_name: string;
  birth_date: string;
  avatar_url: string | null;
}

export default function ProfilePage({ session, onNavigateBack }: ProfilePageProps) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    first_name: '',
    last_name: '',
    birth_date: '',
    avatar_url: null,
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carregar dados do perfil
  useEffect(() => {
    if (!session?.user?.id) return;

    async function fetchProfile() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, last_name, birth_date, avatar_url')
          .eq('id', session.user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          // PGRST116 = nenhum resultado encontrado (ok para primeiro acesso)
          console.error('Erro ao carregar perfil:', error);
          addToast('Erro ao carregar perfil. Detalhe: ' + error.message, 'error');
        }

        if (data) {
          setProfile({
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            birth_date: data.birth_date || '',
            avatar_url: data.avatar_url || null,
          });
          if (data.avatar_url) {
            // Obter URL pública do avatar
            const { data: urlData } = supabase.storage
              .from('avatars')
              .getPublicUrl(data.avatar_url);
            setAvatarPreview(urlData.publicUrl);
          }
        }
      } catch (error: any) {
        console.error('Erro ao carregar perfil:', error);
        addToast('Erro ao carregar perfil. Detalhe: ' + (error?.message || 'Erro desconhecido'), 'error');
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [session?.user?.id, addToast]);

  // Upload de avatar
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session?.user?.id) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      addToast('Por favor, selecione uma imagem válida.', 'error');
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      addToast('A imagem deve ter no máximo 5MB.', 'error');
      return;
    }

    setUploadingAvatar(true);

    try {
      // Criar preview local
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Preparar nome do arquivo: uid/timestamp.png
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop() || 'png';
      const fileName = `${session.user.id}/${timestamp}.${fileExt}`;

      // Upload para o bucket 'avatars'
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true, // Substitui se já existir
        });

      if (uploadError) {
        throw uploadError;
      }

      // Atualizar avatar_url no perfil
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          avatar_url: fileName,
        }, {
          onConflict: 'id',
        });

      if (updateError) {
        throw updateError;
      }

      setProfile(prev => ({ ...prev, avatar_url: fileName }));
      addToast('Foto de perfil atualizada com sucesso!', 'success');
    } catch (error: any) {
      console.error('Erro ao fazer upload do avatar:', error);
      addToast('Erro ao fazer upload da foto. Detalhe: ' + (error?.message || 'Erro desconhecido'), 'error');
      setAvatarPreview(null);
    } finally {
      setUploadingAvatar(false);
      // Limpar input para permitir selecionar o mesmo arquivo novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Salvar perfil
  const handleSave = async () => {
    if (!session?.user?.id) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          first_name: profile.first_name.trim(),
          last_name: profile.last_name.trim(),
          birth_date: profile.birth_date || null,
          avatar_url: profile.avatar_url,
        }, {
          onConflict: 'id',
        });

      if (error) {
        throw error;
      }

      addToast('Perfil salvo com sucesso!', 'success');
    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error);
      addToast('Erro ao salvar perfil. Detalhe: ' + (error?.message || 'Erro desconhecido'), 'error');
    } finally {
      setSaving(false);
    }
  };

  // Obter iniciais do nome
  const getInitials = () => {
    const firstName = profile.first_name?.charAt(0) || '';
    const lastName = profile.last_name?.charAt(0) || '';
    if (firstName || lastName) {
      return (firstName + lastName).toUpperCase();
    }
    return session?.user?.email?.charAt(0).toUpperCase() || 'U';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-emerald-500 w-8 h-8" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-2xl mx-auto px-6 py-8 pb-24 md:pb-8"
    >
      {/* Header */}
      <div className="mb-8">
        {/* Botão Voltar - Apenas Mobile */}
        {onNavigateBack && (
          <Button
            onClick={onNavigateBack}
            variant="ghost"
            size="md"
            leftIcon={<ArrowLeft size={20} />}
            className="md:hidden mb-4"
          >
            Voltar
          </Button>
        )}
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1 flex items-center gap-2">
          <User className="text-emerald-500" size={28} />
          Meu Perfil
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Gerencie suas informações pessoais
        </p>
      </div>

      {/* Card Principal */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 md:p-8 mb-6">
        {/* Foto de Perfil */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Avatar"
                className="w-32 h-32 rounded-full object-cover border-4 border-emerald-500 shadow-lg"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-emerald-500 flex items-center justify-center text-white text-4xl font-bold border-4 border-emerald-600 shadow-lg">
                {getInitials()}
              </div>
            )}
            <Button
              onClick={handleAvatarClick}
              disabled={uploadingAvatar}
              variant="primary"
              size="sm"
              isLoading={uploadingAvatar}
              className="absolute bottom-0 right-0 p-3 rounded-full shadow-lg hover:scale-110"
            >
              {!uploadingAvatar && <Camera size={20} />}
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Clique na câmera para alterar a foto
          </p>
        </div>

        {/* Dados Pessoais */}
        <div className="space-y-4 mb-6">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
            Dados Pessoais
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nome
              </label>
              <input
                type="text"
                value={profile.first_name}
                onChange={(e) => setProfile(prev => ({ ...prev, first_name: e.target.value }))}
                placeholder="Seu nome"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sobrenome
              </label>
              <input
                type="text"
                value={profile.last_name}
                onChange={(e) => setProfile(prev => ({ ...prev, last_name: e.target.value }))}
                placeholder="Seu sobrenome"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="min-w-0">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Data de Nascimento
            </label>
            <input
              type="date"
              value={profile.birth_date}
              onChange={(e) => setProfile(prev => ({ ...prev, birth_date: e.target.value }))}
              className="w-full max-w-full px-3 md:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent min-w-0"
            />
          </div>
        </div>

        {/* Conta (Read-only) */}
        <div className="space-y-4 mb-6">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
            Conta
          </h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              E-mail
            </label>
            <input
              type="email"
              value={session?.user?.email || ''}
              disabled
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              O e-mail não pode ser alterado
            </p>
          </div>
        </div>

        {/* Botão Salvar */}
        <Button
          onClick={handleSave}
          disabled={saving}
          variant="primary"
          fullWidth
          size="lg"
          isLoading={saving}
          leftIcon={!saving ? <Save size={20} /> : undefined}
        >
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>

      {/* Card de Status da Assinatura */}
      <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-2xl shadow-md p-6 md:p-8 border-2 border-amber-300 dark:border-amber-700">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-500 rounded-xl text-white">
            <Crown size={24} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
              Status da Assinatura
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Acesso Premium Ativo
            </p>
            <Button
              disabled
              variant="secondary"
              size="md"
              className="bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
            >
              Gerenciar Assinatura
            </Button>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Funcionalidade em breve
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

