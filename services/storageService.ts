
import { UserStats, Flashcard, TaskResult, ActivityLog, Mistake, Achievement, AppPreferences } from '../types';
import { INITIAL_FLASHCARDS } from './vocabularyData';

const STATS_KEY = 'matura_master_stats';
const FLASHCARDS_KEY = 'matura_master_flashcards';
const VOCAB_INDICES_KEY = 'matura_master_vocab_indices';
const DAILY_PLAN_KEY = 'matura_master_daily_plan_v1';
const PREFERENCES_KEY = 'matura_master_preferences_v1';
const REMINDER_LAST_SHOWN_KEY = 'matura_master_last_reminder_v1';

export const STATS_UPDATED_EVENT = 'stats-updated';
export const FLASHCARDS_UPDATED_EVENT = 'flashcards-updated';

const DEFAULT_PREFERENCES: AppPreferences = {
  soundEffects: true,
  studyReminders: true
};

const pad2 = (value: number): string => String(value).padStart(2, '0');

export const getLocalDateKey = (date: Date = new Date()): string => {
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
};

const getPreviousLocalDateKey = (date: Date = new Date()): string => {
  const d = new Date(date);
  d.setDate(d.getDate() - 1);
  return getLocalDateKey(d);
};

const INITIAL_STATS: UserStats = {
  name: 'Mateusz Wiśniewski',
  xp: 0,
  streak: 0,
  level: 'Starter (A0)',
  completedTasks: 0,
  lastLogin: '',
  updatedAt: Date.now(),
  history: [],
  mistakes: [],
  unlockedAchievements: [], // Start empty
  activity: [],
  moduleProgress: {
    vocabulary: 0,
    grammar: 0,
    listening: 0,
    reading: 0,
    writing: 0,
    exam: 0,
    speaking: 0
  }
};

interface FlashcardsStore {
  items: Flashcard[];
  updatedAt: number;
}

const MODULE_PROGRESS_TARGETS: Record<Exclude<TaskResult['module'], 'vocabulary'>, number> = {
  grammar: 20,
  listening: 12,
  reading: 12,
  writing: 8,
  exam: 4,
  speaking: 4
};

const computeProgressFromHistory = (history: TaskResult[], current: UserStats['moduleProgress']): UserStats['moduleProgress'] => {
  const next: UserStats['moduleProgress'] = {
    vocabulary: current.vocabulary || 0,
    grammar: 0,
    listening: 0,
    reading: 0,
    writing: 0,
    exam: 0,
    speaking: 0
  };

  (Object.keys(MODULE_PROGRESS_TARGETS) as Array<Exclude<TaskResult['module'], 'vocabulary'>>).forEach((module) => {
    const attempts = history.filter((entry) => entry.module === module).length;
    const target = MODULE_PROGRESS_TARGETS[module] || 1;
    const computed = Math.min(100, Math.round((attempts / target) * 100));
    next[module] = computed;
  });

  return next;
};

const computeCompletedTasks = (history: TaskResult[]): number => {
  return history.length;
};

const sanitizeActivity = (activity: ActivityLog[]): ActivityLog[] => {
  const merged = new Map<string, number>();
  activity.forEach((entry) => {
    if (!entry || typeof entry.date !== 'string') return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) return;
    const current = merged.get(entry.date) || 0;
    const nextCount = Math.max(0, Math.min(4, Number(entry.count) || 0));
    merged.set(entry.date, Math.max(current, nextCount));
  });
  return Array.from(merged.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

const deriveStreakFromActivity = (activity: ActivityLog[]): number => {
  const days = new Set(activity.filter((entry) => entry.count > 0).map((entry) => entry.date));
  let streak = 0;
  const cursor = new Date();

  while (true) {
    const key = getLocalDateKey(cursor);
    if (!days.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
};

const computeXpFromData = (history: TaskResult[], flashcards: Flashcard[]): number => {
  const fromHistory = history.reduce((sum, entry) => sum + Math.ceil(Math.max(0, entry.score) * 2.5), 0);
  const mastered = flashcards.filter((card) => card.status === 'mastered').length;
  const learning = flashcards.filter((card) => card.status === 'learning').length;
  const fromVocab = mastered * 5 + learning * 2;
  return fromHistory + fromVocab;
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
  {
    id: 'night_owl', title: 'Nocny Marek', description: 'Ucz się po godzinie 22:00', icon: 'Moon', condition: (s) => {
      const last = new Date(s.lastLogin);
      return last.getHours() >= 22 || last.getHours() < 4;
    }, unlocked: false
  },
  {
    id: 'early_bird', title: 'Ranny Ptaszek', description: 'Ucz się przed 8:00 rano', icon: 'Sun', condition: (s) => {
      const last = new Date(s.lastLogin);
      return last.getHours() >= 5 && last.getHours() < 8;
    }, unlocked: false
  },

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
  let shouldPersist = false;

  if (!stored) {
    stats = { ...INITIAL_STATS };
    shouldPersist = true;
  } else {
    stats = safeParse<UserStats>(stored, { ...INITIAL_STATS });
    if (!stats.mistakes) {
      stats.mistakes = [];
      shouldPersist = true;
    }
    if (!stats.unlockedAchievements) {
      stats.unlockedAchievements = [];
      shouldPersist = true;
    }
    if (!stats.activity) {
      stats.activity = [];
      shouldPersist = true;
    }
    if (!stats.moduleProgress) {
      stats.moduleProgress = { ...INITIAL_STATS.moduleProgress };
      shouldPersist = true;
    }
    if (typeof stats.moduleProgress.speaking !== 'number') {
      stats.moduleProgress.speaking = 0;
      shouldPersist = true;
    }
  }

  // Legacy demo-data migration: reset inflated demo counters
  const isLegacyDemoSeed =
    (stats.xp >= 1200 && stats.level === 'Elementary (A2)' && stats.completedTasks <= 6) ||
    (stats.history.length === 0 && stats.activity.length >= 10);

  if (isLegacyDemoSeed) {
    stats.xp = 0;
    stats.streak = 0;
    stats.completedTasks = 0;
    stats.activity = [];
    stats.lastLogin = '';
    stats.moduleProgress = {
      vocabulary: 0,
      grammar: 0,
      listening: 0,
      reading: 0,
      writing: 0,
      exam: 0,
      speaking: 0
    };
    shouldPersist = true;
  }

  const flashcards = getFlashcards();
  const masteredCount = flashcards.filter((card) => card.status === 'mastered').length;
  const vocabProgress = flashcards.length > 0 ? Math.round((masteredCount / flashcards.length) * 100) : 0;

  const sanitizedActivity = sanitizeActivity(stats.activity || []);
  if (JSON.stringify(stats.activity || []) !== JSON.stringify(sanitizedActivity)) {
    stats.activity = sanitizedActivity;
    shouldPersist = true;
  }

  const shouldResetEmptyProfile = stats.history.length === 0 && vocabProgress === 0;
  if (shouldResetEmptyProfile) {
    if (stats.xp !== 0) {
      stats.xp = 0;
      shouldPersist = true;
    }
    if (stats.streak !== 0) {
      stats.streak = 0;
      shouldPersist = true;
    }
    if (stats.activity.length !== 0) {
      stats.activity = [];
      shouldPersist = true;
    }
  }

  const normalizedProgress = computeProgressFromHistory(stats.history || [], {
    ...stats.moduleProgress,
    vocabulary: vocabProgress
  });
  const normalizedCompletedTasks = computeCompletedTasks(stats.history || []);
  const normalizedLevel = calculateLevel(normalizedProgress);
  const normalizedStreak = deriveStreakFromActivity(stats.activity || []);
  const normalizedXP = computeXpFromData(stats.history || [], flashcards);

  const progressChanged = JSON.stringify(stats.moduleProgress) !== JSON.stringify(normalizedProgress);
  if (progressChanged) {
    stats.moduleProgress = normalizedProgress;
    shouldPersist = true;
  }

  if ((stats.completedTasks || 0) !== normalizedCompletedTasks) {
    stats.completedTasks = normalizedCompletedTasks;
    shouldPersist = true;
  }

  if ((stats.level || '') !== normalizedLevel) {
    stats.level = normalizedLevel;
    shouldPersist = true;
  }

  if ((stats.streak || 0) !== normalizedStreak) {
    stats.streak = normalizedStreak;
    shouldPersist = true;
  }

  if ((stats.xp || 0) !== normalizedXP) {
    stats.xp = normalizedXP;
    shouldPersist = true;
  }

  const withAchievements = checkAchievements(stats);
  if (withAchievements !== stats) {
    stats = withAchievements;
    shouldPersist = true;
  }

  if (shouldPersist) {
    // Use silent save to avoid triggering STATS_UPDATED_EVENT during reads
    stats = saveStatsSilent(stats);
  }

  return stats;
};

// Silent internal save — used by getStats() to persist normalised data
// WITHOUT emitting STATS_UPDATED_EVENT, which would cause an infinite loop:
// getStats() → saveStats() → STATS_UPDATED_EVENT → refreshStats() → getStats() → ...
const saveStatsSilent = (stats: UserStats): UserStats => {
  const payload: UserStats = {
    ...stats,
    updatedAt: Date.now()
  };
  localStorage.setItem(STATS_KEY, JSON.stringify(payload));
  return payload;
};

const saveStats = (stats: UserStats) => {
  const payload = saveStatsSilent(stats);
  window.dispatchEvent(new CustomEvent(STATS_UPDATED_EVENT, { detail: payload }));
};

const touchDailyActivity = (stats: UserStats, intensityStep: number = 1): Pick<UserStats, 'activity' | 'streak' | 'lastLogin'> => {
  const now = new Date();
  const today = getLocalDateKey(now);
  const lastLoginDate = new Date(stats.lastLogin);
  const lastLoginDay = getLocalDateKey(lastLoginDate);
  const yesterday = getPreviousLocalDateKey(now);

  const activity = [...(stats.activity || [])];
  const activityIndex = activity.findIndex((entry) => entry.date === today);
  if (activityIndex >= 0) {
    activity[activityIndex] = {
      ...activity[activityIndex],
      count: Math.min(4, activity[activityIndex].count + Math.max(1, intensityStep))
    };
  } else {
    activity.push({ date: today, count: Math.min(4, Math.max(1, intensityStep)) });
  }

  let streak = stats.streak || 0;
  if (lastLoginDay !== today) {
    if (lastLoginDay === yesterday) {
      streak += 1;
    } else {
      streak = 1;
    }
  }

  return {
    activity,
    streak,
    lastLogin: now.toISOString()
  };
};

const safeParse = <T>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
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
  const activityPatch = touchDailyActivity(current, 1);

  // updateStats will handle achievement checks
  updateStats({ xp: newXP, ...activityPatch });
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

export const getPreferences = (): AppPreferences => {
  const stored = safeParse<Partial<AppPreferences>>(localStorage.getItem(PREFERENCES_KEY), {});
  return {
    soundEffects: stored.soundEffects ?? DEFAULT_PREFERENCES.soundEffects,
    studyReminders: stored.studyReminders ?? DEFAULT_PREFERENCES.studyReminders
  };
};

export const updatePreferences = (patch: Partial<AppPreferences>) => {
  const current = getPreferences();
  const updated: AppPreferences = { ...current, ...patch };
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
  return updated;
};

export const shouldShowStudyReminder = (): boolean => {
  const prefs = getPreferences();
  if (!prefs.studyReminders) return false;

  const today = getLocalDateKey(new Date());
  const lastShown = localStorage.getItem(REMINDER_LAST_SHOWN_KEY);
  if (lastShown === today) return false;

  localStorage.setItem(REMINDER_LAST_SHOWN_KEY, today);
  return true;
};

export const playFeedbackSound = (kind: 'success' | 'error' = 'success') => {
  const { soundEffects } = getPreferences();
  if (!soundEffects || typeof window === 'undefined') return;

  try {
    const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = kind === 'success' ? 880 : 220;

    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);

    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.12);

    oscillator.onended = () => {
      ctx.close().catch(() => undefined);
    };
  } catch {
    // no-op
  }
};

// --- PLANNER LOGIC ---

export const getDailyPlanStatus = (): boolean[] => {
  const today = getLocalDateKey(new Date());
  const parsed = safeParse<{ date?: string; completed?: boolean[] }>(localStorage.getItem(DAILY_PLAN_KEY), {});

  if (parsed.date === today && Array.isArray(parsed.completed)) {
    return parsed.completed;
  }
  // New day or no data
  return [false, false]; // Default 2 tasks
};

export const toggleDailyPlanTask = (index: number) => {
  const today = getLocalDateKey(new Date());
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
  const activityPatch = touchDailyActivity(current, 1);

  // IMPORTANT: We do not call updateStats here directly to avoid double saving, 
  // but we construct the object for updateStats to handle achievements.

  updateStats({
    history: newHistory,
    ...activityPatch
  });
};

export const getFlashcards = (): Flashcard[] => {
  return getFlashcardsStore().items;
};

const getFlashcardsStore = (): FlashcardsStore => {
  const raw = localStorage.getItem(FLASHCARDS_KEY);
  if (!raw) {
    const seed: FlashcardsStore = { items: INITIAL_FLASHCARDS, updatedAt: Date.now() };
    localStorage.setItem(FLASHCARDS_KEY, JSON.stringify(seed));
    return seed;
  }

  const parsedUnknown = safeParse<unknown>(raw, null);
  if (Array.isArray(parsedUnknown)) {
    const migrated: FlashcardsStore = {
      items: parsedUnknown as Flashcard[],
      updatedAt: Date.now()
    };
    localStorage.setItem(FLASHCARDS_KEY, JSON.stringify(migrated));
    return migrated;
  }

  const parsed = parsedUnknown as Partial<FlashcardsStore> | null;
  if (parsed && Array.isArray(parsed.items)) {
    return {
      items: parsed.items,
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : Date.now()
    };
  }

  const fallback: FlashcardsStore = { items: INITIAL_FLASHCARDS, updatedAt: Date.now() };
  localStorage.setItem(FLASHCARDS_KEY, JSON.stringify(fallback));
  return fallback;
};

const saveFlashcardsStore = (items: Flashcard[], updatedAt?: number) => {
  const payload: FlashcardsStore = {
    items,
    updatedAt: updatedAt ?? Date.now()
  };
  localStorage.setItem(FLASHCARDS_KEY, JSON.stringify(payload));
  window.dispatchEvent(new CustomEvent(FLASHCARDS_UPDATED_EVENT, { detail: payload }));
  return payload;
};

export const getFlashcardsSyncPayload = (): FlashcardsStore => getFlashcardsStore();

export const replaceLocalStats = (stats: UserStats) => {
  saveStats(stats);
};

export const replaceLocalFlashcards = (payload: { items: Flashcard[]; updatedAt?: number }) => {
  saveFlashcardsStore(payload.items, payload.updatedAt);
};

export const updateFlashcardStatus = (id: string, status: Flashcard['status']) => {
  const cards = getFlashcards();
  const updated = cards.map(c => c.id === id ? { ...c, status } : c);
  saveFlashcardsStore(updated);

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
  const indices = safeParse<Record<string, number>>(localStorage.getItem(VOCAB_INDICES_KEY), {});
  return indices[category] || 0;
};

export const saveCategoryIndex = (category: string, index: number) => {
  const indices = safeParse<Record<string, number>>(localStorage.getItem(VOCAB_INDICES_KEY), {});
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
