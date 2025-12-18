import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Target, 
  Trophy, 
  BarChart3, 
  Smartphone, 
  ArrowRight,
  ChevronDown,
  Instagram
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (screen: 'login' | 'signup') => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const features = [
    {
      icon: Target,
      title: 'Ciclos de Estudo',
      description: 'Organize suas matérias em ciclos personalizados e acompanhe seu progresso em tempo real.'
    },
    {
      icon: Trophy,
      title: 'Gamificação',
      description: 'Ganhe XP, suba de elo (Bronze → Diamante) e desbloqueie conquistas motivacionais.'
    },
    {
      icon: BarChart3,
      title: 'Métricas em Tempo Real',
      description: 'Acompanhe seu desempenho com gráficos detalhados e relatórios profissionais.'
    },
    {
      icon: Smartphone,
      title: 'PWA & Offline',
      description: 'Funciona como app nativo, funciona offline e sincroniza quando voltar online.'
    }
  ];

  const faqs = [
    {
      question: 'Funciona no celular?',
      answer: 'Sim! O StudyFlow é uma PWA (Progressive Web App) que funciona perfeitamente no celular, tablet e desktop. Você pode até instalar como app nativo.'
    },
    {
      question: 'Preciso de internet?',
      answer: 'Não! O StudyFlow funciona offline. Seus dados são salvos localmente e sincronizam automaticamente quando você voltar online.'
    },
    {
      question: 'Meus dados estão seguros?',
      answer: 'Sim! Utilizamos criptografia de ponta e seus dados são armazenados de forma segura. Você tem controle total sobre suas informações.'
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                <BookOpen size={20} />
              </div>
              <span className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                StudyFlow
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex items-center gap-3"
            >
              <button
                onClick={() => onNavigate('login')}
                className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                Entrar
              </button>
              <button
                onClick={() => onNavigate('signup')}
                className="px-6 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all transform active:scale-95 shadow-lg shadow-emerald-600/20"
              >
                Assine já
              </button>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 dark:text-white leading-tight"
            >
              Domine seus estudos com{' '}
              <span className="text-emerald-600 dark:text-emerald-400">inteligência</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed"
            >
              O sistema completo de gestão de estudos para concurseiros. 
              Organize, acompanhe e transforme sua preparação em resultados.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 pt-4"
            >
              <button
                onClick={() => onNavigate('login')}
                className="group px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all transform active:scale-95 shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2"
              >
                <span>Começar Agora</span>
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
              </button>
              <button
                onClick={() => {
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-8 py-4 border-2 border-gray-300 dark:border-gray-700 hover:border-emerald-600 dark:hover:border-emerald-400 text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-bold rounded-2xl transition-all"
              >
                Saiba Mais
              </button>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative w-full h-96 lg:h-[500px] flex items-center justify-center">
              <motion.div
                animate={{
                  y: [0, -20, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-3xl blur-3xl"
              />
              <motion.div
                animate={{
                  y: [0, 20, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5
                }}
                className="relative w-64 h-64 lg:w-80 lg:h-80 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-2xl"
              >
                <BookOpen size={120} className="text-white" />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
              Tudo que você precisa para{' '}
              <span className="text-emerald-600 dark:text-emerald-400">dominar</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 mt-4">
              Funcionalidades poderosas em um só lugar
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700"
              >
                <div className="w-14 h-14 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="text-emerald-600 dark:text-emerald-400" size={28} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
              Perguntas Frequentes
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Tire suas dúvidas sobre o StudyFlow
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <span className="font-bold text-gray-900 dark:text-white">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`text-gray-500 transition-transform duration-300 ${
                      openFaq === index ? 'rotate-180' : ''
                    }`}
                    size={20}
                  />
                </button>
                <AnimatePresence>
                  {openFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ 
                        duration: 0.3,
                        ease: [0.4, 0, 0.2, 1]
                      }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-4">
                        <p className="text-gray-600 dark:text-gray-400">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-emerald-500 to-teal-500">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Pronto para transformar seus estudos?
            </h2>
            <p className="text-xl text-emerald-50">
              Comece agora e veja a diferença na sua preparação
            </p>
            <button
              onClick={() => onNavigate('login')}
              className="group mt-8 px-10 py-5 bg-white hover:bg-gray-50 text-emerald-600 font-bold rounded-2xl transition-all transform active:scale-95 shadow-2xl flex items-center justify-center gap-2 mx-auto"
            >
              <span>Começar Agora</span>
              <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900 dark:bg-black text-gray-400">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white">
                <BookOpen size={20} />
              </div>
              <span className="text-xl font-black text-white">StudyFlow</span>
            </div>
            
            <div className="flex items-center gap-6">
              <a
                href="https://instagram.com/paiao.kayke"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 hover:text-emerald-400 transition-colors"
              >
                <Instagram size={20} />
                <span className="text-sm">@paiao.kayke</span>
              </a>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
            <p>© 2025 StudyFlow. Desenvolvido por Kayke Paião.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}