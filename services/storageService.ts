
import { UserStats, Flashcard, TaskResult, ActivityLog, Mistake, Achievement } from '../types';
import { INITIAL_FLASHCARDS } from './vocabularyData';

const STATS_KEY = 'matura_master_stats';
const FLASHCARDS_KEY = 'matura_master_flashcards';
const VOCAB_INDICES_KEY = 'matura_master_vocab_indices';
const DAILY_PLAN_KEY = 'matura_master_daily_plan_v1';

// Helper to generate a fake activity history for the demo to look "lived in"
const generateMockActivity = (): ActivityLog[] => {
  const activity: ActivityLog[] = [];
  const today = new Date();
  for (let i = 30; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    // Random activity
    if (Math.random() > 0.4) {
      activity.push({
        date: d.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 4) + 1
      });
    }
  }
  return activity;
};

// Start with lastLogin as yesterday to guarantee a streak update on first load for demo purposes
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);

const INITIAL_STATS: UserStats = {
  name: 'Mateusz Wiśniewski',
  xp: 1250,
  streak: 5,
  level: 'Elementary (A2)',
  completedTasks: 4,
  lastLogin: yesterday.toISOString(), // Set to yesterday to trigger streak increment
  history: [],
  mistakes: [], 
  unlockedAchievements: [], // Start empty
  activity: generateMockActivity(),
  moduleProgress: {
    vocabulary: 15,
    grammar: 10,
    listening: 5,
    reading: 10,
    writing: 0,
    exam: 0
  }
};

// --- ACHIEVEMENTS DEFINITION (20 ITEMS) ---
export const ACHIEVEMENTS_LIST: Achievement[] = [
  // XP & STREAK
  { id: 'streak_3', title: 'Rozgrzewka', description: 'Ucz się przez 3 dni z rzędu', icon: 'Flame', condition: (s) => s.streak >= 3, unlocked: false },
  { id: 'streak_7', title: 'Tygodniowa Passa', description: 'Ucz się przez 7 dni z rzędu', icon: 'Flame', condition: (s) => s.streak >= 7, unlocked: false },
  { id: 'streak_30', title: 'Nawyk Sukcesu', description: 'Ucz się przez 30 dni z rzędu', icon: 'Zap', condition: (s) => s.streak >= 30, unlocked: false },
  { id: 'xp_1000', title: 'Ambitny Uczeń', description: 'Zdobądź 1000 XP', icon: 'Star', condition: (s) => s.xp >= 1000, unlocked: false },
  { id: 'xp_5000', title: 'Matura Master', description: 'Zdobądź 5000 XP', icon: 'Trophy', condition: (s) => s.xp >= 5000, unlocked: false },
  
  // VOCABULARY
  { id: 'vocab_10', title: 'Pierwsze Słowa', description: 'Opanuj 10 fiszek (status: Umiem)', icon: 'BookA', condition: (s) => getFlashcards().filter(c => c.status === 'mastered').length >= 10, unlocked: false },
  { id: 'vocab_50', title: 'Poliglota', description: 'Opanuj 50 fiszek', icon: 'BookOpen', condition: (s) => getFlashcards().filter(c => c.status === 'mastered').length >= 50, unlocked: false },
  
  // GRAMMAR
  { id: 'grammar_5', title: 'Gramatyczny Ninja', description: 'Rozwiąż 5 zadań z gramatyki', icon: 'Library', condition: (s) => s.history.filter(h => h.module === 'grammar').length >= 5, unlocked: false },
  { id: 'grammar_perfect', title: 'Bezbłędny', description: 'Zdobądź 100% w zadaniu z gramatyki', icon: 'CheckCircle', condition: (s) => s.history.some(h => h.module === 'grammar' && h.score === h.maxScore && h.maxScore > 0), unlocked: false },

  // LISTENING & READING
  { id: 'listening_5', title: 'Dobre Ucho', description: 'Ukończ 5 zadań ze słuchu', icon: 'Headphones', condition: (s) => s.history.filter(h => h.module === 'listening').length >= 5, unlocked: false },
  { id: 'reading_5', title: 'Mól Książkowy', description: 'Ukończ 5 zadań z czytania', icon: 'FileText', condition: (s) => s.history.filter(h => h.module === 'reading').length >= 5, unlocked: false },

  // WRITING
  { id: 'writer_1', title: 'Pierwszy Tekst', description: 'Napisz i oceń 1 wypracowanie', icon: 'PenTool', condition: (s) => s.history.some(h => h.module === 'writing'), unlocked: false },
  { id: 'writer_high', title: 'Eseista', description: 'Uzyskaj min. 8/10 pkt z pisania', icon: 'Feather', condition: (s) => s.history.some(h => h.module === 'writing' && h.score >= 8), unlocked: false },

  // EXAMS
  { id: 'exam_finish', title: 'Pierwsze Starcie', description: 'Ukończ pełny arkusz próbny', icon: 'GraduationCap', condition: (s) => s.history.some(h => h.module === 'exam'), unlocked: false },
  { id: 'exam_pass', title: 'Zaliczone!', description: 'Zdaj próbny egzamin (>30%)', icon: 'Award', condition: (s) => s.history.some(h => h.module === 'exam' && (h.score / h.maxScore) >= 0.3), unlocked: false },
  { id: 'exam_top', title: 'Prymus', description: 'Uzyskaj wynik >80% z egzaminu', icon: 'Crown', condition: (s) => s.history.some(h => h.module === 'exam' && (h.score / h.maxScore) >= 0.8), unlocked: false },

  // TIME & EFFORT
  { id: 'night_owl', title: 'Nocny Marek', description: 'Ucz się po godzinie 22:00', icon: 'Moon', condition: (s) => {
      const last = new Date(s.lastLogin);
      return last.getHours() >= 22 || last.getHours() < 4;
  }, unlocked: false },
  { id: 'early_bird', title: 'Ranny Ptaszek', description: 'Ucz się przed 8:00 rano', icon: 'Sun', condition: (s) => {
      const last = new Date(s.lastLogin);
      return last.getHours() >= 5 && last.getHours() < 8;
  }, unlocked: false },

  // MISTAKES
  { id: 'mistake_add', title: 'Uczę się na błędach', description: 'Dodaj zadanie do Banku Błędów', icon: 'AlertOctagon', condition: (s) => s.mistakes.length > 0, unlocked: false },
  { id: 'mistake_clean', title: 'Czysta Karta', description: 'Wyczyść Bank Błędów (miej 0 po wcześniejszym dodaniu)', icon: 'Trash2', condition: (s) => s.mistakes.length === 0 && s.history.length > 10, unlocked: false }, 
];

export const getDaysToMatura = (): number => {
  const now = new Date();
  const currentYear = now.getFullYear();
  let maturaDate = new Date(`${currentYear}-05-06T09:00:00`);
  if (now.getTime() > maturaDate.getTime()) {
    maturaDate = new Date(`${currentYear + 1}-05-06T09:00:00`);
  }
  const diffTime = maturaDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

export const getStats = (): UserStats => {
  const stored = localStorage.getItem(STATS_KEY);
  let stats: UserStats;

  if (!stored) {
    stats = { ...INITIAL_STATS };
  } else {
    stats = JSON.parse(stored);
    if (!stats.mistakes) stats.mistakes = [];
    if (!stats.unlockedAchievements) stats.unlockedAchievements = [];
  }

  // Handle Streak Logic
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const lastLoginDate = new Date(stats.lastLogin);
  const lastLoginStr = lastLoginDate.toISOString().split('T')[0];

  if (todayStr !== lastLoginStr) {
    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

    if (lastLoginStr === yesterdayStr) {
      stats.streak += 1;
    } else if (lastLoginStr !== todayStr) {
       if (new Date(lastLoginStr) < yesterdayDate) {
         stats.streak = 1;
       }
    }
    
    stats.lastLogin = now.toISOString();
    
    const existingActivity = stats.activity.find(a => a.date === todayStr);
    if (!existingActivity) {
      stats.activity.push({ date: todayStr, count: 1 });
    }
    
    saveStats(stats);
  }

  return stats;
};

const saveStats = (stats: UserStats) => {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
};

// Check for new achievements and return the updated stats object
const checkAchievements = (stats: UserStats): UserStats => {
  let hasNew = false;
  const currentUnlocked = new Set(stats.unlockedAchievements);
  
  ACHIEVEMENTS_LIST.forEach(ach => {
    // Only check if NOT already unlocked
    if (!currentUnlocked.has(ach.id)) {
      if (ach.condition(stats)) {
        currentUnlocked.add(ach.id);
        hasNew = true;
        // Dispatch event for UI Notification
        window.dispatchEvent(new CustomEvent('achievement-unlocked', { 
          detail: { title: ach.title, icon: ach.icon } 
        }));
      }
    }
  });

  if (hasNew) {
    return { ...stats, unlockedAchievements: Array.from(currentUnlocked) };
  }
  return stats;
};

export const updateStats = (newStats: Partial<UserStats>) => {
  let current = getStats();
  // Merge updates
  let updated = { ...current, ...newStats };
  
  // Check achievements on the updated stats (BEFORE saving)
  updated = checkAchievements(updated);

  saveStats(updated);
  return updated;
};

export const addXP = (amount: number) => {
  const current = getStats();
  const newXP = current.xp + amount;
  
  const today = new Date().toISOString().split('T')[0];
  const activityIndex = current.activity.findIndex(a => a.date === today);
  
  const newActivity = [...current.activity];
  if (activityIndex >= 0) {
    newActivity[activityIndex] = {
        ...newActivity[activityIndex],
        count: Math.min(4, newActivity[activityIndex].count + 1)
    };
  } else {
    newActivity.push({ date: today, count: 1 });
  }

  // updateStats will handle achievement checks
  updateStats({ xp: newXP, activity: newActivity });
  return newXP;
};

const calculateLevel = (progress: UserStats['moduleProgress']): string => {
  const values = Object.values(progress);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;

  if (avg < 20) return 'Starter (A0)';
  if (avg < 40) return 'Elementary (A1)';
  if (avg < 60) return 'Pre-Intermediate (A2)';
  if (avg < 80) return 'Intermediate (B1)';
  if (avg < 95) return 'Upper-Intermediate (B1+)';
  return 'Matura Ready (B1/B2) 🎓';
};

// --- PLANNER LOGIC ---

export const getDailyPlanStatus = (): boolean[] => {
  const today = new Date().toISOString().split('T')[0];
  const stored = localStorage.getItem(DAILY_PLAN_KEY);
  
  if (stored) {
    const parsed = JSON.parse(stored);
    if (parsed.date === today) {
      return parsed.completed;
    }
  }
  // New day or no data
  return [false, false]; // Default 2 tasks
};

export const toggleDailyPlanTask = (index: number) => {
  const today = new Date().toISOString().split('T')[0];
  const currentStatus = getDailyPlanStatus();
  const newStatus = [...currentStatus];
  newStatus[index] = !newStatus[index];
  
  localStorage.setItem(DAILY_PLAN_KEY, JSON.stringify({
    date: today,
    completed: newStatus
  }));
  
  return newStatus;
};

// --- MISTAKE MANAGEMENT ---

export const saveMistake = (
  module: string,
  question: string,
  userAnswer: string,
  correctAnswer: string,
  context?: string
) => {
  const stats = getStats();
  const currentMistakes = stats.mistakes || [];
  
  const exists = currentMistakes.some(m => m.question === question && m.module === module);
  
  if (!exists) {
    const newMistake: Mistake = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      module,
      question,
      userAnswer,
      correctAnswer,
      context,
      timestamp: Date.now()
    };
    
    const updatedMistakes = [newMistake, ...currentMistakes].slice(0, 50); 
    updateStats({ mistakes: updatedMistakes });
  }
};

export const removeMistake = (id: string) => {
  const stats = getStats();
  const currentMistakes = stats.mistakes || [];
  const updatedMistakes = currentMistakes.filter(m => m.id !== id);
  updateStats({ mistakes: updatedMistakes });
};

// --- END MISTAKE MANAGEMENT ---

export const saveTaskResult = (
  module: TaskResult['module'], 
  score: number, 
  maxScore: number,
  specificTaskId?: string 
) => {
  const current = getStats();
  
  const result: TaskResult = {
    taskId: specificTaskId || Date.now().toString(), 
    module,
    score,
    maxScore,
    date: new Date().toISOString()
  };
  
  const newHistory = [...current.history, result];
  
  const wasAlreadyCompleted = specificTaskId 
    ? current.history.some(h => h.taskId === specificTaskId) 
    : false;

  const newCompletedCount = wasAlreadyCompleted ? current.completedTasks : current.completedTasks + 1;
  
  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
  const progressIncrement = percentage >= 80 ? 10 : percentage >= 50 ? 5 : 2;
  
  const currentModuleProgress = current.moduleProgress[module] || 0;
  const newModuleProgress = Math.min(100, currentModuleProgress + progressIncrement);

  const updatedProgress = {
    ...current.moduleProgress,
    [module]: newModuleProgress
  };

  const newLevel = calculateLevel(updatedProgress);
  const xpGained = Math.ceil(score * 2.5); 

  // IMPORTANT: We do not call updateStats here directly to avoid double saving, 
  // but we construct the object for updateStats to handle achievements.
  
  updateStats({
    history: newHistory,
    completedTasks: newCompletedCount,
    moduleProgress: updatedProgress,
    level: newLevel,
    xp: current.xp + xpGained
  });
  
  // Update activity log
  addXP(0); 
};

export const getFlashcards = (): Flashcard[] => {
  const stored = localStorage.getItem(FLASHCARDS_KEY);
  if (!stored) {
    localStorage.setItem(FLASHCARDS_KEY, JSON.stringify(INITIAL_FLASHCARDS));
    return INITIAL_FLASHCARDS;
  }
  return JSON.parse(stored);
};

export const updateFlashcardStatus = (id: string, status: Flashcard['status']) => {
  const cards = getFlashcards();
  const updated = cards.map(c => c.id === id ? { ...c, status } : c);
  localStorage.setItem(FLASHCARDS_KEY, JSON.stringify(updated));

  const masteredCount = updated.filter(c => c.status === 'mastered').length;
  const totalCount = updated.length;
  const vocabProgress = Math.round((masteredCount / totalCount) * 100);
  
  const currentStats = getStats();
  updateStats({
    moduleProgress: {
      ...currentStats.moduleProgress,
      vocabulary: vocabProgress
    }
  });
};

export const getCategoryIndex = (category: string): number => {
  const stored = localStorage.getItem(VOCAB_INDICES_KEY);
  if (!stored) return 0;
  const indices = JSON.parse(stored);
  return indices[category] || 0;
};

export const saveCategoryIndex = (category: string, index: number) => {
  const stored = localStorage.getItem(VOCAB_INDICES_KEY);
  const indices = stored ? JSON.parse(stored) : {};
  indices[category] = index;
  localStorage.setItem(VOCAB_INDICES_KEY, JSON.stringify(indices));
};

export const getAverageScore = (): number => {
  const stats = getStats();
  if (stats.history.length === 0) return 0;
  
  const totalPercentage = stats.history.reduce((acc, curr) => {
    return acc + (curr.maxScore > 0 ? (curr.score / curr.maxScore) : 0);
  }, 0);
  
  return Math.round((totalPercentage / stats.history.length) * 100);
};
