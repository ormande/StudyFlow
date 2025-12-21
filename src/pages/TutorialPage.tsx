import { motion } from 'framer-motion';
import { Target, Clock, Trophy, ArrowLeft } from 'lucide-react';
import Button from '../components/Button';

interface TutorialPageProps {
  onNavigateBack?: () => void;
}

export default function TutorialPage({ onNavigateBack }: TutorialPageProps) {
  const cards = [
    {
      icon: Target,
      title: 'Ciclo de Estudos',
      description: 'Gerencie suas matérias, configure metas de tempo e organize subtópicos. O ciclo ajuda você a acompanhar seu progresso e manter o foco nos seus objetivos de estudo.',
      color: 'emerald',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
    {
      icon: Clock,
      title: 'Timer & Registro',
      description: 'Use o Timer para cronometrar suas sessões automaticamente ou configure um temporizador/Pomodoro. Depois, registre seus estudos manualmente na aba Registrar com detalhes como páginas, acertos e erros.',
      color: 'blue',
      iconColor: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      icon: Trophy,
      title: 'Gamificação',
      description: 'Ganhe XP ao estudar e desbloqueie conquistas! O sistema de Elos mostra seu progresso e ranking. Quanto mais você estuda, mais você sobe de nível e desbloqueia novas conquistas.',
      color: 'amber',
      iconColor: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto px-6 py-8 pb-24 md:pb-8"
    >
      {/* Header */}
      <div className="text-center mb-8">
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
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
          Como usar o StudyFlow
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Aprenda a aproveitar ao máximo todas as funcionalidades do app
        </p>
      </div>

      {/* Cards de Informação */}
      <div className="space-y-6 mb-8">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`${card.bgColor} rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl bg-white dark:bg-gray-800 shadow-sm flex-shrink-0`}>
                  <Icon size={24} className={card.iconColor} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {card.title}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

    </motion.div>
  );
}

