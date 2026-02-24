
export type ViewState = 'dashboard' | 'vocabulary' | 'grammar' | 'listening' | 'reading' | 'writing' | 'exam' | 'speaking' | 'mistakes' | 'settings';

export interface TaskResult {
  taskId: string;
  module: 'vocabulary' | 'grammar' | 'listening' | 'reading' | 'writing' | 'exam' | 'speaking';
  score: number;
  maxScore: number;
  date: string;
}

export interface ActivityLog {
  date: string; // YYYY-MM-DD
  count: number; // intensity 0-4
}

export interface Mistake {
  id: string;
  module: string;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  context?: string; // e.g. sentence context
  timestamp: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // Icon name
  condition: (stats: UserStats) => boolean;
  unlocked: boolean; // UI state only
}

export interface UserStats {
  name: string;
  xp: number;
  streak: number;
  level: string; // Calculated dynamically
  completedTasks: number;
  lastLogin: string;
  updatedAt?: number;
  history: TaskResult[];
  activity: ActivityLog[];
  mistakes: Mistake[];
  unlockedAchievements: string[]; // NEW: Persist IDs of unlocked achievements
  // Progress per module (0-100)
  moduleProgress: {
    vocabulary: number;
    grammar: number;
    listening: number;
    reading: number;
    writing: number;
    exam: number;
    speaking: number;
  };
}

export interface AppPreferences {
  soundEffects: boolean;
  studyReminders: boolean;
}

export interface Flashcard {
  id: string;
  en: string;
  pl: string;
  category: string;
  status: 'new' | 'learning' | 'mastered';
  lastReview?: number;
}

export interface GrammarSection {
  id: string;
  title: string;
  description: string;
  tasks: GrammarTask[];
}

export interface GrammarTask {
  id: string;
  type: 'choice' | 'translation' | 'gaps';
  instruction: string;
  content?: string; // Context text for gaps/choice
  questions: {
    id: number;
    text?: string; // The sentence or gap context
    prefix?: string; // Before input
    suffix?: string; // After input
    options?: string[];
    correctAnswer: string | string[]; // String for choice, Array for text input (multiple possibilities)
  }[];
}

export interface WritingTask {
  id: string;
  type: 'email_informal' | 'email_formal' | 'blog' | 'description';
  title: string;
  instruction: string; // The prompt in Polish
  topic?: string;
  minWords?: number;
  maxWords?: number;
}

export interface WritingAssessment {
  tresc: { punkty: number; komentarz: string };
  spojnosc: { punkty: number; komentarz: string };
  zakres: { punkty: number; komentarz: string };
  poprawnosc: { punkty: number; komentarz: string; bledy: string[] };
  suma: number;
  podsumowanie: string;
  wskazowki: string[];
}

export interface SpeakingCriterionAssessment {
  score: number;
  maxScore: number;
  justification: string;
}

export interface SpeakingAssessment {
  totalScore: number;
  maxScore: number;
  communication: SpeakingCriterionAssessment;
  communicationTask1?: SpeakingCriterionAssessment;
  communicationTask2?: SpeakingCriterionAssessment;
  communicationTask3?: SpeakingCriterionAssessment;
  lexicalRange: SpeakingCriterionAssessment;
  grammaticalAccuracy: SpeakingCriterionAssessment;
  pronunciation: SpeakingCriterionAssessment;
  fluency: SpeakingCriterionAssessment;
  strengths: string[];
  improvements: string[];
}

export interface MockExam {
  id: string;
  title: string;
  duration: number; // minutes
  sections: {
    listening: any[]; // Simplified for demo
    reading: any[];
    writing: WritingTask;
  }
}
