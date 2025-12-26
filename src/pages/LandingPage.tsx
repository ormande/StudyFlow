"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Target, Trophy, BarChart3, Smartphone, ArrowRight, ChevronDown, Instagram, MessageCircle, CreditCard, Shield } from "lucide-react"

interface LandingPageProps {
  onNavigate: (screen: "login" | "signup" | "pricing") => void
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  const [openFaq, setOpenFaq] = useState<string | null>(null)

  const features = [
    {
      icon: Target,
      title: "Ciclos de Estudo",
      description: "Organize suas matérias em ciclos personalizados e acompanhe seu progresso em tempo real.",
    },
    {
      icon: Trophy,
      title: "Gamificação",
      description: "Ganhe XP, suba de elo (Bronze → Diamante) e desbloqueie conquistas motivacionais.",
    },
    {
      icon: BarChart3,
      title: "Métricas em Tempo Real",
      description: "Acompanhe seu desempenho com gráficos detalhados e relatórios profissionais.",
    },
    {
      icon: Smartphone,
      title: "PWA & Offline",
      description: "Funciona como app nativo, funciona offline e sincroniza quando voltar online.",
    },
  ]

  const faqCategories = [
    {
      category: "Sobre o App",
      icon: Smartphone,
      faqs: [
        {
          question: "O que é o StudyFlow?",
          answer: "O StudyFlow é uma plataforma de gestão de estudos gamificada. Você registra suas horas de estudo, ganha XP, sobe de elo (Bronze até Diamante), desbloqueia conquistas e acompanha seu progresso com gráficos e estatísticas detalhadas."
        },
        {
          question: "O app funciona no celular?",
          answer: "Sim! O StudyFlow é um PWA (Progressive Web App) que funciona perfeitamente em celular, tablet e computador. Você pode instalar como um app nativo e usar offline. Seus dados sincronizam automaticamente na nuvem."
        },
        {
          question: "Posso usar em vários dispositivos?",
          answer: "Sim! Faça login em qualquer dispositivo e seus dados estarão lá, sempre sincronizados."
        },
        {
          question: "Como funciona o sistema de gamificação?",
          answer: "A cada minuto estudado você ganha 1 XP. Questões corretas valem 5 XP. Conforme acumula XP, você sobe de elo e desbloqueia conquistas especiais!"
        }
      ]
    },
    {
      category: "Pagamentos e Planos",
      icon: CreditCard,
      faqs: [
        {
          question: "Como funciona o período de teste?",
          answer: "Você tem 7 dias grátis para testar todas as funcionalidades do StudyFlow. Não é necessário cartão de crédito para começar. Após o teste, escolha entre o plano mensal (R$ 9,90) ou vitalício (pagamento único de R$ 97)."
        },
        {
          question: "Quais as formas de pagamento?",
          answer: "Aceitamos cartão de crédito e boleto através do Efi Bank, plataforma 100% segura com certificação PCI-DSS. O pagamento é processado de forma criptografada e seus dados nunca são armazenados em nossos servidores."
        },
        {
          question: "Posso cancelar a qualquer momento?",
          answer: "Sim! No plano mensal, você pode cancelar quando quiser, sem multas ou taxas. O acesso continua até o fim do período já pago. No plano vitalício, o acesso é para sempre."
        },
        {
          question: "Tem desconto para estudantes?",
          answer: "Sim! Use o cupom LANCA25 no plano vitalício e ganhe 25% de desconto (de R$ 97 por R$ 72,75). Cupom válido para os primeiros 100 usuários até 31/03/2026."
        }
      ]
    },
    {
      category: "Segurança e Dados",
      icon: Shield,
      faqs: [
        {
          question: "Meus dados estão seguros?",
          answer: "Totalmente! Usamos o Supabase, infraestrutura enterprise com segurança de nível bancário. Seus dados são criptografados, fazemos backup automático diário, e você pode exportar ou excluir seus dados a qualquer momento."
        },
        {
          question: "Preciso ter conexão com internet?",
          answer: "O app funciona offline para registrar estudos. A sincronização com a nuvem acontece automaticamente quando você conectar."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-300 font-sans antialiased">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-gray-950/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-3"
            >
              <img 
                src="/icon-192.png" 
                alt="StudyFlow Logo" 
                className="w-8 h-8 rounded-lg object-contain" 
              />
              <span className="text-xl font-black text-gray-900 dark:text-white tracking-tight">StudyFlow</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex items-center gap-3"
            >
              <button
                onClick={() => onNavigate("login")}
                className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => onNavigate("signup")}
                className="px-4 py-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
              >
                Cadastrar
              </button>
              <button
                onClick={() => onNavigate("pricing")}
                className="px-6 py-2 text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all"
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
              className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight"
            >
              <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">
                Domine seus estudos com{" "}
              </span>
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
                inteligência
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed"
            >
              O sistema completo de gestão de estudos para concurseiros. Organize, acompanhe e transforme sua preparação
              em resultados.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 pt-4"
            >
              <button
                onClick={() => onNavigate("signup")}
                className="group px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-xl shadow-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/40 transition-all duration-300 flex items-center justify-center gap-2"
              >
                Criar conta grátis
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
              </button>
              <button
                onClick={() => onNavigate("pricing")}
                className="px-8 py-4 bg-transparent border-2 border-gray-300 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-500 text-gray-900 dark:text-white font-bold rounded-xl transition-all duration-300"
              >
                Ver planos
              </button>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative w-full h-[500px] flex items-center justify-center">
              {/* Floating Animation Container */}
              <motion.div
                animate={{
                  y: [0, -15, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
                className="relative w-full max-w-md"
              >
                {/* Main Dashboard Card - Glassmorphism */}
                <div className="relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-3xl p-6 shadow-2xl">
                  {/* Header Bar */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                    </div>
                    <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  </div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <motion.div
                      animate={{ scale: [1, 1.02, 1] }}
                      transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, delay: 0.2 }}
                      className="bg-gradient-to-br from-emerald-400/20 to-teal-400/20 backdrop-blur-sm border border-emerald-200/30 dark:border-emerald-700/30 rounded-xl p-4"
                    >
                      <div className="w-8 h-8 bg-emerald-500/20 rounded-lg mb-2"></div>
                      <div className="w-16 h-2 bg-emerald-600/40 rounded-full mb-1"></div>
                      <div className="w-12 h-2 bg-emerald-500/30 rounded-full"></div>
                    </motion.div>
                    <motion.div
                      animate={{ scale: [1, 1.02, 1] }}
                      transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, delay: 0.5 }}
                      className="bg-gradient-to-br from-blue-400/20 to-cyan-400/20 backdrop-blur-sm border border-blue-200/30 dark:border-blue-700/30 rounded-xl p-4"
                    >
                      <div className="w-8 h-8 bg-blue-500/20 rounded-lg mb-2"></div>
                      <div className="w-16 h-2 bg-blue-600/40 rounded-full mb-1"></div>
                      <div className="w-12 h-2 bg-blue-500/30 rounded-full"></div>
                    </motion.div>
                  </div>

                  {/* Chart Area - Skeleton */}
                  <div className="bg-gradient-to-br from-gray-100/80 to-gray-50/80 dark:from-gray-900/80 dark:to-gray-800/80 backdrop-blur-sm border border-gray-200/30 dark:border-gray-700/30 rounded-2xl p-4 mb-4">
                    <div className="w-20 h-2 bg-gray-300 dark:bg-gray-700 rounded-full mb-4"></div>
                    <div className="flex items-end justify-between gap-2 h-32">
                      {[40, 70, 45, 85, 60, 90, 55].map((height, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${height}%` }}
                          transition={{ duration: 1, delay: i * 0.1, repeat: Number.POSITIVE_INFINITY, repeatDelay: 3 }}
                          className="flex-1 bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t-lg"
                        ></motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Progress Bars */}
                  <div className="space-y-3">
                    <div className="bg-gray-100/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200/30 dark:border-gray-700/30 rounded-xl p-3">
                      <div className="w-24 h-2 bg-gray-300 dark:bg-gray-700 rounded-full mb-2"></div>
                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: "0%" }}
                          animate={{ width: "75%" }}
                          transition={{ duration: 2, delay: 0.5, repeat: Number.POSITIVE_INFINITY, repeatDelay: 3 }}
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                        ></motion.div>
                      </div>
                    </div>
                    <div className="bg-gray-100/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200/30 dark:border-gray-700/30 rounded-xl p-3">
                      <div className="w-20 h-2 bg-gray-300 dark:bg-gray-700 rounded-full mb-2"></div>
                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: "0%" }}
                          animate={{ width: "60%" }}
                          transition={{ duration: 2, delay: 0.7, repeat: Number.POSITIVE_INFINITY, repeatDelay: 3 }}
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                        ></motion.div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Mini Card */}
                <motion.div
                  animate={{
                    y: [0, 15, 0],
                    x: [0, 10, 0],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                  className="absolute -right-4 -top-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-4 shadow-xl"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center mb-2">
                    <Trophy className="text-white" size={24} />
                  </div>
                  <div className="w-16 h-2 bg-emerald-500/40 rounded-full"></div>
                </motion.div>

                {/* Floating Progress Card */}
                <motion.div
                  animate={{
                    y: [0, -10, 0],
                    x: [0, -5, 0],
                  }}
                  transition={{
                    duration: 4.5,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                    delay: 0.5,
                  }}
                  className="absolute -left-4 bottom-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-4 shadow-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg"></div>
                    <div className="space-y-1">
                      <div className="w-20 h-2 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                      <div className="w-16 h-2 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Background Gradient Blur */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 dark:from-emerald-500/20 dark:via-teal-500/20 dark:to-cyan-500/20 rounded-3xl blur-3xl -z-10"></div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section - Clean Symmetrical Grid */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">
                Tudo que você precisa para{" "}
              </span>
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
                dominar
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 mt-4 leading-relaxed">
              Funcionalidades poderosas em um só lugar
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-200 dark:border-gray-700 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 cursor-pointer flex flex-col h-full"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="text-white" size={28} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{feature.description}</p>
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
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">
                Perguntas Frequentes
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
              Tire suas dúvidas sobre o StudyFlow
            </p>
          </motion.div>

          <div className="space-y-8">
            {faqCategories.map((category, catIndex) => (
              <div key={catIndex} className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-lg mb-4">
                  <category.icon size={20} />
                  <span>{category.category}</span>
                </div>
                
                <div className="space-y-3">
                  {category.faqs.map((faq, faqIndex) => {
                    const faqId = `${catIndex}-${faqIndex}`;
                    const isOpen = openFaq === faqId;
                    
                    return (
                      <motion.div
                        key={faqId}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: faqIndex * 0.1 }}
                        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-emerald-500/30 transition-colors"
                      >
                        <button
                          onClick={() => setOpenFaq(isOpen ? null : faqId)}
                          className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <span className="font-bold text-lg text-gray-900 dark:text-white">{faq.question}</span>
                          <ChevronDown
                            className={`text-gray-500 transition-transform duration-300 flex-shrink-0 ${
                              isOpen ? "rotate-180" : ""
                            }`}
                            size={20}
                          />
                        </button>
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{
                                duration: 0.3,
                                ease: [0.4, 0, 0.2, 1],
                              }}
                              className="overflow-hidden"
                            >
                              <div className="px-6 pb-5 pt-2">
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{faq.answer}</p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
              Pronto para transformar seus estudos?
            </h2>
            <p className="text-xl text-emerald-50 leading-relaxed">Comece agora e veja a diferença na sua preparação</p>
            <button
              onClick={() => onNavigate("signup")}
              className="group mt-8 px-10 py-5 bg-white hover:bg-gray-50 text-emerald-600 font-bold rounded-xl shadow-2xl hover:shadow-emerald-900/30 transition-all duration-300 inline-flex items-center gap-2"
            >
              Criar minha conta grátis
              <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900 dark:bg-black text-gray-400 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img 
                src="/icon-192.png" 
                alt="StudyFlow Logo" 
                className="w-8 h-8 rounded-lg object-contain" 
              />
              <span className="text-xl font-black text-white">StudyFlow</span>
            </div>

            <div className="flex items-center gap-6">
              <a
                href="https://t.me/studyflow_suporte_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-emerald-400 transition-colors"
              >
                <MessageCircle size={20} />
                <span className="text-sm">Suporte</span>
              </a>

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
  )
}
