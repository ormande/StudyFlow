import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Camera, Save, Loader2, Crown, Star, Gift, CreditCard, Diamond } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import Button from '../components/Button';

interface ProfilePageProps {
  session: any;
  onNavigateBack?: () => void;
  subscriptionStatus?: string | null;
  subscriptionType?: string | null;
  trialEndsAt?: string | null;
  onNavigateToPlans?: () => void;
}

interface ProfileData {
  first_name: string;
  last_name: string;
  birth_date: string;
  avatar_url: string | null;
}

export default function ProfilePage({ 
  session, 
  onNavigateBack,
  subscriptionStatus = null,
  subscriptionType = null,
  trialEndsAt = null,
  onNavigateToPlans
}: ProfilePageProps) {
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
  const [nextBillingDate, setNextBillingDate] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carregar dados do perfil e assinatura
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

        // Buscar dados de assinatura
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from('user_settings')
          .select('subscription_status, subscription_type, trial_ends_at, next_billing_date')
          .eq('user_id', session.user.id)
          .single();

        if (!subscriptionError && subscriptionData) {
          setNextBillingDate(subscriptionData.next_billing_date || null);
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

  // Determinar tipo de plano
  const planType = useMemo(() => {
    if (subscriptionStatus === 'trial') return 'trial';
    if (subscriptionStatus === 'active') {
      return subscriptionType === 'lifetime' ? 'lifetime' : 'monthly';
    }
    return 'none';
  }, [subscriptionStatus, subscriptionType]);

  // Calcular dias restantes do trial
  const daysLeft = useMemo(() => {
    if (planType === 'trial' && trialEndsAt) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endDate = new Date(trialEndsAt);
      endDate.setHours(0, 0, 0, 0);
      const diffMs = endDate.getTime() - today.getTime();
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      return days;
    }
    return null;
  }, [planType, trialEndsAt]);

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
      className="max-w-2xl lg:max-w-6xl mx-auto px-6 py-8 pb-24 md:pb-8"
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
          <User className="text-emerald-500" size={28} />
          Meu Perfil
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Gerencie suas informações pessoais
        </p>
      </div>

      {/* Grid Layout - Desktop Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Coluna Esquerda - Cartão de Identidade */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6 lg:self-start">
          {/* Card de Perfil */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
            {/* Foto de Perfil */}
            <div className="flex flex-col items-center mb-6">
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

            {/* Nome Completo Display */}
            {(profile.first_name || profile.last_name) && (
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {profile.first_name} {profile.last_name}
                </h3>
              </div>
            )}

            {/* E-mail (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                E-mail
              </label>
              <input
                type="email"
                value={session?.user?.email || ''}
                disabled
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 cursor-not-allowed text-sm"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                O e-mail não pode ser alterado
              </p>
            </div>
          </div>

          {/* Card de Status da Assinatura */}
          {planType === 'trial' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 rounded-2xl shadow-md p-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-white shadow-lg flex-shrink-0">
                  <Star size={24} fill="currentColor" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-yellow-800 dark:text-yellow-200 mb-1 flex items-center gap-2">
                    <Gift size={18} /> Plano Trial
                  </h2>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                    Você está testando o StudyFlow gratuitamente!
                  </p>
                  {daysLeft !== null && daysLeft >= 0 && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mb-4 font-semibold">
                      {daysLeft === 0 ? 'Último dia!' : `${daysLeft} ${daysLeft === 1 ? 'dia restante' : 'dias restantes'}`}
                    </p>
                  )}
                  <Button
                    onClick={onNavigateToPlans}
                    variant="secondary"
                    size="sm"
                    className="w-full"
                  >
                    Gerenciar Assinatura
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {planType === 'monthly' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-400 rounded-2xl shadow-md p-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg flex-shrink-0">
                  <Star size={24} fill="currentColor" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-emerald-800 dark:text-emerald-200 mb-1 flex items-center gap-2">
                    <CreditCard size={18} /> Plano Mensal Ativo
                  </h2>
                  <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-2">
                    R$ 9,90/mês
                  </p>
                  {nextBillingDate && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-4">
                      Próxima cobrança: {new Date(nextBillingDate).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                  <Button
                    onClick={onNavigateToPlans}
                    variant="secondary"
                    size="sm"
                    className="w-full"
                  >
                    Gerenciar Assinatura
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {planType === 'lifetime' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-400 rounded-2xl shadow-md p-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white shadow-lg flex-shrink-0">
                  <Crown size={24} fill="currentColor" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-purple-800 dark:text-purple-200 mb-1 flex items-center gap-2">
                    <Diamond size={18} /> Acesso Vitalício
                  </h2>
                  <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
                    Acesso ilimitado para sempre!
                  </p>
                  <div className="mb-4">
                    <span className="bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      Vitalício
                    </span>
                  </div>
                  <Button
                    onClick={onNavigateToPlans}
                    variant="secondary"
                    size="sm"
                    className="w-full"
                  >
                    Gerenciar Assinatura
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Coluna Direita - Formulários */}
        <div className="lg:col-span-8">
          {/* Card de Dados Pessoais */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 md:p-8">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
              Dados Pessoais
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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

            <div className="min-w-0 mb-6">
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
        </div>
      </div>
    </motion.div>
  );
}

