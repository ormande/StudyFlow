import { 
  Flame, Shield, Cpu, Activity, Briefcase, BookOpen, Target, Sparkles, 
  Crosshair, Book, BookMarked, Library, Layers, Brain, Palette, Sunrise, 
  Moon, Skull, CheckCircle2, Rocket, Zap, Footprints, RefreshCw, Award,
  Clock, Rainbow, Flag, Trophy, LucideIcon
} from 'lucide-react';

export interface Achievement {
  id: string;
  category: 'consistency' | 'volume' | 'accuracy' | 'reading' | 'diversity' | 'schedule' | 'goals' | 'milestones';
  name: string;
  description: string;
  icon: LucideIcon;
  color: string; // Tailwind color class
  levels: AchievementLevel[];
}

export interface AchievementLevel {
  level: 1 | 2 | 3;
  requirement: number;
  label: string; // Ex: "7 dias", "100 horas"
  xpReward: number; // XP ganho ao resgatar esta conquista
}

export interface UserAchievement {
  achievementId: string;
  level: 1 | 2 | 3;
  unlockedAt: number; // timestamp
  claimedAt: number | null; // timestamp ou null se não resgatado
  progress: number; // progresso atual (ex: 5 de 7 dias)
}

// Lista completa de conquistas
export const ACHIEVEMENTS: Achievement[] = [
  // CATEGORIA 1: CONSTÂNCIA
  {
    id: 'streak-fire',
    category: 'consistency',
    name: 'Ofensiva',
    description: 'Estude dias consecutivos sem falhar',
    icon: Flame,
    color: 'text-orange-500',
    levels: [
      { level: 1, requirement: 7, label: '7 dias', xpReward: 150 },
      { level: 2, requirement: 30, label: '30 dias', xpReward: 300 },
      { level: 3, requirement: 100, label: '100 dias', xpReward: 500 }
    ]
  },
  {
    id: 'unbreakable',
    category: 'consistency',
    name: 'Inabalável',
    description: 'Mantenha uma rotina de estudos sólida',
    icon: Shield,
    color: 'text-purple-500',
    levels: [
      { level: 1, requirement: 14, label: '14 dias', xpReward: 150 },
      { level: 2, requirement: 60, label: '60 dias', xpReward: 300 },
      { level: 3, requirement: 200, label: '200 dias', xpReward: 500 }
    ]
  },
  {
    id: 'machine',
    category: 'consistency',
    name: 'Máquina',
    description: 'Consistência robótica nos estudos',
    icon: Cpu,
    color: 'text-blue-500',
    levels: [
      { level: 1, requirement: 21, label: '21 dias', xpReward: 150 },
      { level: 2, requirement: 90, label: '90 dias', xpReward: 300 },
      { level: 3, requirement: 365, label: '365 dias', xpReward: 500 }
    ]
  },
  
  // CATEGORIA 2: VOLUME (Horas)
  {
    id: 'marathon',
    category: 'volume',
    name: 'Maratonista',
    description: 'Acumule horas de estudo',
    icon: Activity,
    color: 'text-emerald-500',
    levels: [
      { level: 1, requirement: 10, label: '10 horas', xpReward: 100 },
      { level: 2, requirement: 100, label: '100 horas', xpReward: 250 },
      { level: 3, requirement: 500, label: '500 horas', xpReward: 400 }
    ]
  },
  {
    id: 'workaholic',
    category: 'volume',
    name: 'Workaholic',
    description: 'Volume intenso de estudos',
    icon: Briefcase,
    color: 'text-gray-700',
    levels: [
      { level: 1, requirement: 50, label: '50 horas', xpReward: 100 },
      { level: 2, requirement: 250, label: '250 horas', xpReward: 250 },
      { level: 3, requirement: 1000, label: '1000 horas', xpReward: 400 }
    ]
  },
  {
    id: 'eternal-student',
    category: 'volume',
    name: 'Estudante Eterno',
    description: 'Dedicação absoluta aos estudos',
    icon: BookOpen,
    color: 'text-blue-600',
    levels: [
      { level: 1, requirement: 100, label: '100 horas', xpReward: 100 },
      { level: 2, requirement: 500, label: '500 horas', xpReward: 250 },
      { level: 3, requirement: 2000, label: '2000 horas', xpReward: 400 }
    ]
  },
  
  // CATEGORIA 3: QUESTÕES
  {
    id: 'shooter',
    category: 'accuracy',
    name: 'Atirador',
    description: 'Acerte questões consistentemente',
    icon: Target,
    color: 'text-red-500',
    levels: [
      { level: 1, requirement: 100, label: '100 acertos', xpReward: 100 },
      { level: 2, requirement: 500, label: '500 acertos', xpReward: 200 },
      { level: 3, requirement: 2000, label: '2000 acertos', xpReward: 400 }
    ]
  },
  {
    id: 'perfectionist',
    category: 'accuracy',
    name: 'Perfeccionista',
    description: 'Sessões com 100% de acerto',
    icon: Sparkles,
    color: 'text-yellow-500',
    levels: [
      { level: 1, requirement: 50, label: '50 sessões perfeitas', xpReward: 150 },
      { level: 2, requirement: 200, label: '200 sessões perfeitas', xpReward: 300 },
      { level: 3, requirement: 500, label: '500 sessões perfeitas', xpReward: 500 }
    ]
  },
  {
    id: 'sniper',
    category: 'accuracy',
    name: 'Sniper',
    description: 'Alta taxa de acerto geral',
    icon: Crosshair,
    color: 'text-indigo-600',
    levels: [
      { level: 1, requirement: 90, label: '90% acerto (100q)', xpReward: 150 },
      { level: 2, requirement: 95, label: '95% acerto (500q)', xpReward: 300 },
      { level: 3, requirement: 98, label: '98% acerto (1000q)', xpReward: 500 }
    ]
  },
  
  // CATEGORIA 4: PÁGINAS
  {
    id: 'reader',
    category: 'reading',
    name: 'Leitor',
    description: 'Leia páginas de teoria',
    icon: Book,
    color: 'text-amber-700',
    levels: [
      { level: 1, requirement: 100, label: '100 páginas', xpReward: 100 },
      { level: 2, requirement: 500, label: '500 páginas', xpReward: 200 },
      { level: 3, requirement: 2000, label: '2000 páginas', xpReward: 400 }
    ]
  },
  {
    id: 'devourer',
    category: 'reading',
    name: 'Devorador',
    description: 'Consuma teoria intensamente',
    icon: BookMarked,
    color: 'text-green-700',
    levels: [
      { level: 1, requirement: 500, label: '500 páginas', xpReward: 100 },
      { level: 2, requirement: 2000, label: '2000 páginas', xpReward: 250 },
      { level: 3, requirement: 10000, label: '10000 páginas', xpReward: 400 }
    ]
  },
  {
    id: 'library',
    category: 'reading',
    name: 'Biblioteca',
    description: 'Acumule conhecimento teórico',
    icon: Library,
    color: 'text-purple-600',
    levels: [
      { level: 1, requirement: 1000, label: '1000 páginas', xpReward: 100 },
      { level: 2, requirement: 5000, label: '5000 páginas', xpReward: 250 },
      { level: 3, requirement: 20000, label: '20000 páginas', xpReward: 400 }
    ]
  },
  
  // CATEGORIA 5: MATÉRIAS
  {
    id: 'multitask',
    category: 'diversity',
    name: 'Multitarefa',
    description: 'Estude matérias diversas',
    icon: Layers,
    color: 'text-pink-500',
    levels: [
      { level: 1, requirement: 3, label: '3 matérias', xpReward: 100 },
      { level: 2, requirement: 6, label: '6 matérias', xpReward: 200 },
      { level: 3, requirement: 12, label: '12 matérias', xpReward: 300 }
    ]
  },
  {
    id: 'polymath',
    category: 'diversity',
    name: 'Polímata',
    description: 'Domine múltiplas áreas',
    icon: Brain,
    color: 'text-pink-500',
    levels: [
      { level: 1, requirement: 5, label: '5 matérias', xpReward: 100 },
      { level: 2, requirement: 10, label: '10 matérias', xpReward: 200 },
      { level: 3, requirement: 20, label: '20 matérias', xpReward: 300 }
    ]
  },
  {
    id: 'renaissance',
    category: 'diversity',
    name: 'Renaissance',
    description: 'Estude várias matérias no mesmo dia',
    icon: Palette,
    color: 'text-violet-500',
    levels: [
      { level: 1, requirement: 5, label: '5 matérias/dia (7 dias)', xpReward: 150 },
      { level: 2, requirement: 8, label: '8 matérias/dia (7 dias)', xpReward: 250 },
      { level: 3, requirement: 12, label: '12 matérias/dia (7 dias)', xpReward: 400 }
    ]
  },
  
  // CATEGORIA 6: HORÁRIOS
  {
    id: 'early-bird',
    category: 'schedule',
    name: 'Madrugador',
    description: 'Estude de manhã cedo',
    icon: Sunrise,
    color: 'text-orange-400',
    levels: [
      { level: 1, requirement: 7, label: '7 dias (5h-8h)', xpReward: 100 },
      { level: 2, requirement: 30, label: '30 dias (5h-8h)', xpReward: 200 },
      { level: 3, requirement: 100, label: '100 dias (5h-8h)', xpReward: 300 }
    ]
  },
  {
    id: 'night-owl',
    category: 'schedule',
    name: 'Coruja',
    description: 'Estude de madrugada',
    icon: Moon,
    color: 'text-indigo-800',
    levels: [
      { level: 1, requirement: 7, label: '7 dias (22h-2h)', xpReward: 100 },
      { level: 2, requirement: 30, label: '30 dias (22h-2h)', xpReward: 200 },
      { level: 3, requirement: 100, label: '100 dias (22h-2h)', xpReward: 300 }
    ]
  },
  {
    id: 'weekend-warrior',
    category: 'schedule',
    name: 'Guerreiro FDS',
    description: 'Estude nos fins de semana',
    icon: Skull,
    color: 'text-gray-800',
    levels: [
      { level: 1, requirement: 1, label: '1 fim de semana', xpReward: 150 },
      { level: 2, requirement: 10, label: '10 fins de semana', xpReward: 300 },
      { level: 3, requirement: 50, label: '50 fins de semana', xpReward: 500 }
    ]
  },
  
  // CATEGORIA 7: METAS
  {
    id: 'achiever',
    category: 'goals',
    name: 'Cumpridor',
    description: 'Cumpra sua meta diária',
    icon: CheckCircle2,
    color: 'text-emerald-600',
    levels: [
      { level: 1, requirement: 7, label: '7 metas cumpridas', xpReward: 100 },
      { level: 2, requirement: 30, label: '30 metas cumpridas', xpReward: 250 },
      { level: 3, requirement: 100, label: '100 metas cumpridas', xpReward: 400 }
    ]
  },
  {
    id: 'over-achiever',
    category: 'goals',
    name: 'Over Achiever',
    description: 'Supere 150% da meta',
    icon: Rocket,
    color: 'text-blue-600',
    levels: [
      { level: 1, requirement: 7, label: '7 dias acima de 150%', xpReward: 150 },
      { level: 2, requirement: 30, label: '30 dias acima de 150%', xpReward: 300 },
      { level: 3, requirement: 100, label: '100 dias acima de 150%', xpReward: 500 }
    ]
  },
  {
    id: 'overcoming',
    category: 'goals',
    name: 'Superação',
    description: 'Supere 200% da meta',
    icon: Zap,
    color: 'text-yellow-600',
    levels: [
      { level: 1, requirement: 1, label: '1 dia acima de 200%', xpReward: 200 },
      { level: 2, requirement: 10, label: '10 dias acima de 200%', xpReward: 400 },
      { level: 3, requirement: 50, label: '50 dias acima de 200%', xpReward: 500 }
    ]
  },
  
  // CATEGORIA 8: MILESTONES
  {
    id: 'first-step',
    category: 'milestones',
    name: 'Primeiro Passo',
    description: 'Faça seus primeiros registros',
    icon: Footprints,
    color: 'text-green-400',
    levels: [
      { level: 1, requirement: 1, label: '1 registro', xpReward: 50 },
      { level: 2, requirement: 10, label: '10 registros', xpReward: 100 },
      { level: 3, requirement: 100, label: '100 registros', xpReward: 200 }
    ]
  },
  {
    id: 'cycle-master',
    category: 'milestones',
    name: 'Ciclo Master',
    description: 'Complete ciclos de estudo',
    icon: RefreshCw,
    color: 'text-emerald-500',
    levels: [
      { level: 1, requirement: 1, label: '1 ciclo completo', xpReward: 100 },
      { level: 2, requirement: 5, label: '5 ciclos completos', xpReward: 250 },
      { level: 3, requirement: 20, label: '20 ciclos completos', xpReward: 400 }
    ]
  },
  {
    id: 'veteran',
    category: 'milestones',
    name: 'Veterano',
    description: 'Tempo usando o StudyFlow',
    icon: Award,
    color: 'text-amber-500',
    levels: [
      { level: 1, requirement: 30, label: '30 dias no app', xpReward: 100 },
      { level: 2, requirement: 90, label: '90 dias no app', xpReward: 300 },
      { level: 3, requirement: 365, label: '365 dias no app', xpReward: 500 }
    ]
  }
];

// Ordem das categorias para exibição
export const CATEGORY_ORDER: Achievement['category'][] = [
  'consistency',
  'volume',
  'accuracy',
  'reading',
  'diversity',
  'schedule',
  'goals',
  'milestones'
];

// Funções auxiliares
export const getLevelBadgeColor = (level: 1 | 2 | 3): string => {
  switch (level) {
    case 1: return 'bg-amber-700'; // Bronze
    case 2: return 'bg-gray-400';  // Prata
    case 3: return 'bg-yellow-500'; // Ouro
  }
};

export const getLevelRoman = (level: 1 | 2 | 3): string => {
  switch (level) {
    case 1: return 'I';
    case 2: return 'II';
    case 3: return 'III';
  }
};

export const getCategoryName = (category: Achievement['category']): string => {
  const names: Record<Achievement['category'], string> = {
    consistency: 'Constância',
    volume: 'Volume de Estudos',
    accuracy: 'Precisão nas Questões',
    reading: 'Leitura',
    diversity: 'Diversidade',
    schedule: 'Horários',
    goals: 'Metas',
    milestones: 'Marcos'
  };
  return names[category] || category;
};

export const getCategoryIcon = (category: Achievement['category']): LucideIcon => {
  const icons: Record<Achievement['category'], LucideIcon> = {
    consistency: Flame,
    volume: Clock,
    accuracy: Target,
    reading: Book,
    diversity: Rainbow,
    schedule: Sunrise,
    goals: Flag,
    milestones: Trophy
  };
  return icons[category] || Trophy;
};

