import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, CheckCircle, ArrowRight, User, Calendar, Camera, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import Button from '../components/Button';
import TermsModal from '../components/TermsModal';
import PrivacyModal from '../components/PrivacyModal';

interface SignupPageProps {
  onBack: () => void;
  onNavigateToLogin: () => void;
  onSuccess: () => void;
  onStartSignup?: () => void;
}

export default function SignupPage({ onBack, onNavigateToLogin, onSuccess, onStartSignup }: SignupPageProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { addToast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        addToast('A imagem deve ter no máximo 2MB', 'error');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const calculateAge = (birthday: string) => {
    const ageDifMs = Date.now() - new Date(birthday).getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim() || !lastName.trim()) {
      addToast('Nome e sobrenome são obrigatórios.', 'warning');
      return;
    }

    if (!birthDate) {
      addToast('Data de nascimento é obrigatória.', 'warning');
      return;
    }

    if (calculateAge(birthDate) < 13) {
      addToast('Você precisa ter pelo menos 13 anos para usar o StudyFlow.', 'warning');
      return;
    }

    if (password !== confirmPassword) {
      addToast('As senhas não coincidem.', 'warning');
      return;
    }

    if (!acceptedTerms) {
      addToast('Você precisa aceitar os termos de uso.', 'warning');
      return;
    }

    setLoading(true);
    if (onStartSignup) onStartSignup();

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;

      // AGUARDAR sessão estar disponível
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        let uploadedAvatarUrl = null;

        // Upload do avatar se houver
        if (avatarFile) {
          const fileExt = avatarFile.name.split('.').pop();
          const fileName = `${session.user.id}/avatar.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, avatarFile, { upsert: true });
          
          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('avatars')
              .getPublicUrl(fileName);
            uploadedAvatarUrl = publicUrl;
          } else {
            console.error('Erro upload avatar:', uploadError);
          }
        }

        // Dados para salvar no user_settings
        const settingsData = {
          user_id: session.user.id,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          birth_date: birthDate,
          avatar_url: uploadedAvatarUrl,
          terms_accepted: true,
          terms_accepted_at: new Date().toISOString(),
          subscription_status: 'trial',
          trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          cycle_start_date: Date.now(),
          daily_goal: 0,
          show_performance: true,
          tutorial_completed: false
        };

        const { error: settingsError } = await supabase
          .from('user_settings')
          .insert(settingsData);
        
        if (settingsError) {
          console.error('Erro ao criar trial (insert):', settingsError);
          // Tenta update como fallback
          await supabase
            .from('user_settings')
            .update(settingsData)
            .eq('user_id', session.user.id);
        }
      }

      addToast('Conta criada com sucesso! Aproveite seus 7 dias grátis.', 'success');
      onSuccess();
    } catch (error: any) {
      addToast(error.message, 'error');
      setLoading(false);
      onSuccess();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-6 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8 my-8"
      >
        <div className="text-center">
          <img src="/icon-512.png" alt="StudyFlow" className="w-20 h-20 mx-auto mb-4 rounded-2xl" />
          <h1 className="text-3xl font-black tracking-tight mb-2 uppercase text-emerald-600 dark:text-emerald-500">Crie sua conta</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Preencha seus dados para começar sua jornada.
          </p>
        </div>

        <motion.form
          onSubmit={handleSignup}
          className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 space-y-5"
        >
          {/* Foto de Perfil */}
          <div className="flex flex-col items-center gap-3 mb-2">
            <div 
              className="relative w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 overflow-hidden group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarPreview ? (
                <>
                  <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="text-white" size={24} />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center text-gray-400">
                  <Camera size={24} />
                  <span className="text-[10px] font-bold mt-1 uppercase">Foto</span>
                </div>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
            {avatarPreview && (
              <button 
                type="button" 
                onClick={() => { setAvatarFile(null); setAvatarPreview(null); }}
                className="text-xs text-red-500 font-bold hover:underline"
              >
                Remover foto
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1">
                Nome
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl py-2.5 pl-10 pr-3 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500 transition-all"
                  placeholder="Seu nome"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1">
                Sobrenome
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl py-2.5 px-4 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500 transition-all"
                  placeholder="Sobrenome"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1">
              Data de Nascimento
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="date"
                required
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl py-2.5 pl-10 pr-3 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500 transition-all [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1">
              Seu E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl py-2.5 pl-10 pr-3 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500 transition-all"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1">
              Senha (mín. 6 caracteres)
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl py-2.5 pl-10 pr-3 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500 transition-all"
                placeholder="••••••"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1">
              Confirmar Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl py-2.5 pl-10 pr-3 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500 transition-all"
                placeholder="••••••"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 cursor-pointer group" onClick={() => setAcceptedTerms(!acceptedTerms)}>
              <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${acceptedTerms ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 dark:border-gray-600'}`}>
                {acceptedTerms && <CheckCircle size={14} className="text-white" />}
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
                Eu aceito os <button type="button" onClick={(e) => { e.stopPropagation(); setShowTermsModal(true); }} className="text-emerald-500 font-bold underline hover:text-emerald-600 transition-colors">Termos de Uso</button> e a <button type="button" onClick={(e) => { e.stopPropagation(); setShowPrivacyModal(true); }} className="text-emerald-500 font-bold underline hover:text-emerald-600 transition-colors">Política de Privacidade</button>.
              </p>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            variant="primary"
            fullWidth
            size="lg"
            isLoading={loading}
            leftIcon={!loading && <ArrowRight size={20} />}
            className="py-4 shadow-lg shadow-emerald-600/20 font-bold"
          >
            Criar Conta Grátis
          </Button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="text-sm text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              Já tem conta? <span className="font-bold underline">Faça login</span>
            </button>
          </div>
        </motion.form>

        <div className="text-center">
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            Voltar para a página inicial
          </button>
        </div>
      </motion.div>

      {/* Modais */}
      <TermsModal 
        isOpen={showTermsModal} 
        onClose={() => setShowTermsModal(false)} 
      />
      <PrivacyModal 
        isOpen={showPrivacyModal} 
        onClose={() => setShowPrivacyModal(false)} 
      />
    </div>
  );
}
