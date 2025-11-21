export type StudyType = 'teoria' | 'questoes' | 'revisao';

export interface StudyLog {
  id: string;
  subjectId: string;
  type: StudyType;
  hours: number;
  minutes: number;
  seconds?: number; // NOVO: Campo opcional de segundos
  pages?: number;
  correct?: number;
  wrong?: number;
  blank?: number;
  notes?: string;
  date: string;
  timestamp: number;
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

export type TabType = 'dashboard' | 'timer' | 'register' | 'cycle';