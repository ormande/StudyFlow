import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  CheckCircle,
  ArrowRight,
  User,
  Camera,
  ArrowLeft,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useToast } from "../contexts/ToastContext";
import Button from "../components/Button";
import TermsModal from "../components/TermsModal";
import PrivacyModal from "../components/PrivacyModal";
import {
  formatDateInputMask,
  getLocalDateString,
  parseMaskedDateToIso,
} from "../utils/dateUtils";

interface SignupPageProps {
  onBack: () => void;
  onNavigateToLogin: () => void;
  onSuccess: (email?: string) => void;
  onStartSignup?: () => void;
}

export default function SignupPage({
  onBack,
  onNavigateToLogin,
  onSuccess,
  onStartSignup,
}: SignupPageProps) {
  const { addToast } = useToast();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDateMask, setBirthDateMask] = useState("");
  const [birthDate, setBirthDate] = useState(""); // YYYY-MM-DD
  const [isDateValid, setIsDateValid] = useState(true);
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formScrollRef = useRef<HTMLDivElement>(null);

  const scrollSignupToTop = () => {
    formScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  const validateBirthDate = (value: string): boolean => {
    if (!value) return true;
    const [y] = value.split("-").map(Number);
    if (y <= 1900) return false;
    return value <= getLocalDateString();
  };

  const handleBirthDateChange = (value: string) => {
    const formatted = formatDateInputMask(value);
    setBirthDateMask(formatted);

    if (!formatted) {
      setBirthDate("");
      setIsDateValid(true);
      return;
    }

    const iso = parseMaskedDateToIso(formatted);
    if (iso) {
      setBirthDate(iso);
      setIsDateValid(validateBirthDate(iso));
    } else if (formatted.length === 10) {
      setBirthDate("");
      setIsDateValid(false);
    } else {
      setBirthDate("");
      setIsDateValid(true);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        addToast("A imagem deve ter no máximo 2MB", "error");
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

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) {
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    }
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  };

  const isValidCpf = (rawCpf: string) => {
    const cpfDigits = rawCpf.replace(/\D/g, "");
    if (cpfDigits.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpfDigits)) return false;

    const calcDigit = (base: string, factor: number) => {
      let total = 0;
      for (const char of base) {
        total += Number(char) * factor;
        factor -= 1;
      }
      const remainder = (total * 10) % 11;
      return remainder === 10 ? 0 : remainder;
    };

    const d1 = calcDigit(cpfDigits.slice(0, 9), 10);
    const d2 = calcDigit(cpfDigits.slice(0, 10), 11);
    return d1 === Number(cpfDigits[9]) && d2 === Number(cpfDigits[10]);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    scrollSignupToTop();

    if (!firstName.trim() || !lastName.trim()) {
      addToast("Nome e sobrenome são obrigatórios.", "warning");
      return;
    }

    if (!birthDate) {
      addToast("Data de nascimento inválida.", "warning");
      return;
    }

    if (!isDateValid) {
      addToast("Data de nascimento inválida ou no futuro.", "warning");
      return;
    }

    const isoDate = birthDate;

    if (calculateAge(isoDate) < 13) {
      addToast(
        "Você precisa ter pelo menos 13 anos para usar o StudyFlow.",
        "warning"
      );
      return;
    }

    if (!cpf || !isValidCpf(cpf)) {
      addToast("CPF inválido. Verifique os números digitados.", "warning");
      return;
    }

    if (password.length < 8) {
      addToast("A senha deve ter pelo menos 8 caracteres.", "warning");
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      addToast(
        "A senha deve conter letras maiúsculas, minúsculas e números.",
        "warning"
      );
      return;
    }

    if (password !== confirmPassword) {
      addToast("As senhas não coincidem.", "warning");
      return;
    }

    if (!acceptedTerms) {
      addToast("Você precisa aceitar os termos de uso.", "warning");
      return;
    }

    setLoading(true);
    if (onStartSignup) onStartSignup();

    try {
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName.trim(),
              last_name: lastName.trim(),
              birth_date: isoDate,
              cpf_cnpj: cpf.replace(/\D/g, ""),
              terms_accepted: true,
              terms_accepted_at: new Date().toISOString(),
            },
          },
        });

      if (signUpError) throw signUpError;

      // Se não houver sessão imediata (ex: confirmação de email habilitada)
      if (!signUpData.session) {
        setLoading(false);
        addToast(
          "Conta criada! Verifique seu e-mail (incluindo spam) para ativar e fazer login.",
          "success"
        );
        onSuccess(email);
        return;
      }

      const session = signUpData.session;
      let uploadedAvatarUrl = null;

      // Upload do avatar se houver
      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop();
        const fileName = `${session.user.id}/avatar.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, avatarFile, { upsert: true });

        if (!uploadError) {
          uploadedAvatarUrl = fileName;
        } else {
          console.error("Erro upload avatar:", uploadError);
        }
      }

      // Dados para salvar no user_settings
      const settingsData = {
        user_id: session.user.id,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        birth_date: isoDate,
        cpf_cnpj: cpf.replace(/\D/g, ""),
        avatar_url: uploadedAvatarUrl,
        terms_accepted: true,
        terms_accepted_at: new Date().toISOString(),
        cycle_start_date: Date.now(),
        daily_goal: 0,
        show_performance: true,
        tutorial_completed: false,
      };

      // Usa upsert para garantir que as configurações sejam salvas mesmo se o trigger handle_new_user já as criou
      const { error: settingsError } = await supabase
        .from("user_settings")
        .upsert(settingsData, { onConflict: "user_id" });

      if (settingsError) {
        console.error(
          "Erro ao salvar configurações do usuário:",
          settingsError
        );
      }

      // Assinatura/trial agora vivem em user_subscriptions
      const trialEndsAt = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toISOString();
      const { error: subscriptionError } = await supabase
        .from("user_subscriptions")
        .upsert(
          {
            user_id: session.user.id,
            status: "trial",
            trial_ends_at: trialEndsAt,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

      if (subscriptionError) {
        console.error(
          "Erro ao salvar assinatura do usuário:",
          subscriptionError
        );
      }

      addToast(
        "Conta criada com sucesso! Aproveite seus 7 dias grátis.",
        "success"
      );
      setLoading(false);
      // Após cadastro bem-sucedido, chamar onSuccess sem email
      // para indicar que o usuário já está autenticado
      onSuccess();
    } catch (error: any) {
      console.error("Erro no signup:", error);
      addToast(error.message || "Erro ao criar conta.", "error");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row transition-colors duration-300">
      {/* Lado Esquerdo - Hero/Branding (Visível apenas no Desktop) */}
      <div className="hidden lg:flex lg:w-5/12 bg-emerald-600 dark:bg-emerald-700 items-center justify-center p-12 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-400 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl"></div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 text-white max-w-lg"
        >
          <img
            src="/icon-512.png"
            alt="StudyFlow"
            className="w-24 h-24 mb-8 rounded-2xl shadow-2xl brightness-110"
          />
          <h1 className="text-5xl font-black mb-6 leading-tight">
            Sua jornada rumo à aprovação começa agora.
          </h1>
          <p className="text-xl text-emerald-50 mb-12 opacity-90 leading-relaxed">
            Junte-se a milhares de estudantes e organize sua rotina com ciclos
            de estudo, gamificação e métricas reais.
          </p>

          <div className="space-y-6">
            {[
              "7 dias de acesso total grátis",
              "Ciclos de estudo personalizados",
              "Ranking e conquistas",
              "Sincronização em tempo real",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={18} className="text-white" />
                </div>
                <span className="text-lg font-medium">{item}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Lado Direito - Formulário */}
      <div
        ref={formScrollRef}
        className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative overflow-y-auto"
      >
        {/* Botão Voltar (Desktop/Mobile) */}
        {onBack && (
          <div className="absolute top-6 left-6 md:top-8 md:left-8 z-10">
            <Button
              onClick={onBack}
              variant="ghost"
              size="sm"
              leftIcon={<ArrowLeft size={18} />}
              className="text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400"
            >
              Voltar
            </Button>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl lg:max-w-[48vw] space-y-8 py-12 lg:py-0"
        >
          <div className="text-center lg:text-left">
            <img
              src="/icon-512.png"
              alt="StudyFlow"
              className="w-16 h-16 mx-auto lg:mx-0 mb-4 rounded-2xl lg:hidden"
            />
            <h2 className="text-3xl font-black tracking-tight mb-2 uppercase text-emerald-600 dark:text-emerald-500">
              Crie sua conta
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Preencha seus dados para começar sua jornada.
            </p>
          </div>

          <motion.form
            onSubmit={handleSignup}
            className="bg-white dark:bg-gray-800 p-6 md:p-10 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 space-y-6 transition-colors duration-300"
          >
            {/* Foto de Perfil - Estilo Profile Page */}
            <div className="flex flex-col md:flex-row items-center gap-8 mb-6 bg-gray-50 dark:bg-gray-700/30 p-6 rounded-2xl border border-dashed border-gray-200 dark:border-gray-600">
              <div
                className="relative w-24 h-24 md:w-28 md:h-28 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center border-2 border-emerald-500 shadow-md overflow-hidden group cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {avatarPreview ? (
                  <>
                    <img
                      src={avatarPreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="text-white" size={24} />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-gray-400">
                    <Camera size={28} />
                    <span className="text-[10px] font-bold mt-1 uppercase">
                      Foto
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 text-center md:text-left space-y-2">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Foto de Perfil
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Personalize seu perfil com uma foto (máx. 2MB)
                </p>
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarFile(null);
                      setAvatarPreview(null);
                    }}
                    className="text-xs text-red-500 font-bold hover:underline"
                  >
                    Remover foto
                  </button>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>

            {/* Linha 1: nome, sobrenome, nascimento (3 colunas iguais) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 ml-1">
                  Nome
                </label>
                <div className="relative">
                  <User
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    name="first_name"
                    autoComplete="given-name"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl py-3 pl-10 pr-3 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500 transition-all"
                    placeholder="Seu nome"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 ml-1">
                  Sobrenome
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="last_name"
                    autoComplete="family-name"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl py-3 px-4 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500 transition-all"
                    placeholder="Sobrenome"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 ml-1">
                  Nascimento
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="bday"
                  required
                  value={birthDateMask}
                  onChange={(e) => handleBirthDateChange(e.target.value)}
                  placeholder="dd/mm/aaaa"
                  aria-label="Data de nascimento"
                  className={`w-full bg-gray-50 dark:bg-gray-700 border rounded-xl py-3 px-4 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500 transition-all ${
                    !isDateValid
                      ? "border-red-500"
                      : "border-gray-200 dark:border-gray-600"
                  }`}
                />
                {!isDateValid && (
                  <p className="text-[10px] text-red-500 mt-1 ml-1 font-bold">
                    Data inválida ou no futuro
                  </p>
                )}
              </div>
            </div>

            {/* Linha 2: e-mail (2/3) + CPF (1/3) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 ml-1">
                  Seu E-mail
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl py-3 pl-10 pr-3 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500 transition-all"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 ml-1">
                  CPF
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={cpf}
                    onChange={(e) => setCpf(formatCpf(e.target.value))}
                    placeholder="000.000.000-00"
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl py-3 px-4 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Linha 3: senha + confirmar senha */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 ml-1">
                  Senha (mín. 8)
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="password"
                    name="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl py-3 pl-10 pr-3 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 ml-1">
                  Confirmar
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="password"
                    name="confirm_password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl py-3 pl-10 pr-3 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => setAcceptedTerms(!acceptedTerms)}
              >
                <div
                  className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    acceptedTerms
                      ? "bg-emerald-500 border-emerald-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                >
                  {acceptedTerms && (
                    <CheckCircle size={14} className="text-white" />
                  )}
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
                  Eu aceito os{" "}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowTermsModal(true);
                    }}
                    className="text-emerald-500 font-bold underline hover:text-emerald-600 transition-colors"
                  >
                    Termos de Uso
                  </button>{" "}
                  e a{" "}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPrivacyModal(true);
                    }}
                    className="text-emerald-500 font-bold underline hover:text-emerald-600 transition-colors"
                  >
                    Política de Privacidade
                  </button>
                  .
                </p>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !isDateValid}
              variant="primary"
              fullWidth
              size="lg"
              isLoading={loading}
              leftIcon={!loading && <ArrowRight size={20} />}
              className="py-4 shadow-lg shadow-emerald-600/20 font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Criar Conta Grátis
            </Button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="text-sm text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                Já tem conta?{" "}
                <span className="font-bold underline">Faça login</span>
              </button>
            </div>
          </motion.form>

          <div className="text-center lg:hidden">
            <button
              type="button"
              onClick={onBack}
              className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors font-medium"
            >
              Voltar para a página inicial
            </button>
          </div>
        </motion.div>
      </div>

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
