export type StudyType = 'teoria' | 'questoes' | 'revisao';

export interface StudyLog {
  id: string;
  subjectId: string;
  type: StudyType;
  hours: number;
  minutes: number;
  seconds?: number;
  pages?: number;
  correct?: number;
  wrong?: number;
  blank?: number;
  notes?: string;
  date: string;
  timestamp: number;
  // Campos opcionais para histórico
  subject?: string;
  subtopicId?: string;
  subtopic?: string;
}

export interface Subtopic {
  id: string;
  name: string;
  completed: boolean;
}

export interface Subject {
  id: string;
  name: string;
  goalMinutes: number;
  subtopics: Subtopic[];
  color: string;
}

export interface DashboardStats {
  streak: number;
  todayMinutes: number;
  todaySubjects: number;
  todayQuestions: number;
}

export interface UserStats {
  total_minutes: number;
  total_questions: number;
  total_correct: number;
  total_pages?: number;
  total_logs?: number;
  total_xp: number;
}

export type TabType = 'dashboard' | 'timer' | 'register' | 'cycle' | 'achievements' | 'elo' | 'more' | 'goals' | 'appearance' | 'stats' | 'history' | 'about' | 'tutorial' | 'settings' | 'profile';

export type FeedbackType = 'bug' | 'suggestion' | 'compliment';

export interface Feedback {
  id?: string;
  user_id?: string;
  type: FeedbackType;
  message: string;
  email?: string;
  user_agent?: string;
  status?: 'pending' | 'reviewed' | 'resolved';
  created_at?: string;
}
