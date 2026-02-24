import { getCompletion } from './geminiService';
import { SpeakingAssessment } from '../types';

interface TranscriptEntry {
  role: 'user' | 'assistant';
  text: string;
  stage?: string;
}

interface SpeakingAssessmentInput {
  examTitle: string;
  rolePlayPoints: string[];
  task2Elements: string[];
  task3Elements: string[];
  transcript: TranscriptEntry[];
}

const MAX_SCORES = {
  communicationTask: 6,
  lexicalRange: 4,
  grammaticalAccuracy: 4,
  pronunciation: 2,
  fluency: 2
} as const;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const tableAScore = (addressedRaw: number, developedRaw: number): number => {
  const addressed = clamp(Math.round(addressedRaw), 0, 4);
  const developed = clamp(Math.round(developedRaw), 0, addressed);

  if (addressed === 4) {
    if (developed === 0) return 2;
    if (developed === 1) return 3;
    if (developed === 2) return 4;
    if (developed === 3) return 5;
    return 6;
  }

  if (addressed === 3) {
    if (developed === 0) return 1;
    if (developed === 1) return 2;
    if (developed === 2) return 3;
    return 4;
  }

  if (addressed === 2) {
    if (developed === 0) return 1;
    if (developed === 1) return 2;
    return 3;
  }

  if (addressed === 1) {
    if (developed === 0) return 0;
    return 1;
  }

  return 0;
};

const parseDeduction = (value: number): number => {
  const rounded = Math.round(value);
  if (rounded <= -2) return -2;
  if (rounded === -1) return -1;
  return 0;
};

const tokenize = (value: string): string[] =>
  value
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 3);

const countCoveredPrompts = (userText: string, prompts: string[]): number => {
  const userTokens = new Set(tokenize(userText));
  let covered = 0;

  prompts.forEach((prompt) => {
    const promptTokens = tokenize(prompt);
    const matches = promptTokens.filter((token) => userTokens.has(token)).length;
    if (promptTokens.length > 0 && matches / promptTokens.length >= 0.2) {
      covered += 1;
    }
  });

  return covered;
};

const buildCommunicationCriterion = (score: number, taskName: string, details: string) => ({
  score,
  maxScore: MAX_SCORES.communicationTask,
  justification: `${taskName}: ${details}`
});

const DEFAULT_ASSESSMENT: SpeakingAssessment = {
  totalScore: 0,
  maxScore: 30,
  communication: { score: 0, maxScore: 18, justification: 'Brak danych.' },
  communicationTask1: { score: 0, maxScore: 6, justification: 'Brak danych dla zadania 1.' },
  communicationTask2: { score: 0, maxScore: 6, justification: 'Brak danych dla zadania 2.' },
  communicationTask3: { score: 0, maxScore: 6, justification: 'Brak danych dla zadania 3.' },
  lexicalRange: { score: 0, maxScore: MAX_SCORES.lexicalRange, justification: 'Brak danych.' },
  grammaticalAccuracy: { score: 0, maxScore: MAX_SCORES.grammaticalAccuracy, justification: 'Brak danych.' },
  pronunciation: { score: 0, maxScore: MAX_SCORES.pronunciation, justification: 'Brak danych.' },
  fluency: { score: 0, maxScore: MAX_SCORES.fluency, justification: 'Brak danych.' },
  strengths: ['Uczen zakonczyl probe ustna.'],
  improvements: ['Rozszerz wypowiedzi i uzywaj wiekszej liczby struktur.']
};

interface RawTaskCommunication {
  addressed: number;
  developed: number;
  deduction: number;
  justification: string;
}

interface RawAssessment {
  communicationTask1: RawTaskCommunication;
  communicationTask2: RawTaskCommunication;
  communicationTask3: RawTaskCommunication;
  lexicalRange: { score: number; justification: string };
  grammaticalAccuracy: { score: number; justification: string };
  pronunciation: { score: number; justification: string };
  fluency: { score: number; justification: string };
  strengths: string[];
  improvements: string[];
}

const normalizeTaskCommunication = (task: RawTaskCommunication): { score: number; justification: string } => {
  const base = tableAScore(task.addressed, task.developed);
  const deduction = parseDeduction(task.deduction);
  const finalScore = clamp(base + deduction, 0, MAX_SCORES.communicationTask);
  return {
    score: finalScore,
    justification: `${task.justification} (Tabela A: ${base} pkt, Tabela B: ${deduction} pkt)`
  };
};

const parseAssessment = (raw: string): SpeakingAssessment | null => {
  try {
    const parsed = JSON.parse(raw) as Partial<RawAssessment>;
    if (
      !parsed.communicationTask1 ||
      !parsed.communicationTask2 ||
      !parsed.communicationTask3 ||
      !parsed.lexicalRange ||
      !parsed.grammaticalAccuracy ||
      !parsed.pronunciation ||
      !parsed.fluency
    ) {
      return null;
    }

    const t1 = normalizeTaskCommunication(parsed.communicationTask1);
    const t2 = normalizeTaskCommunication(parsed.communicationTask2);
    const t3 = normalizeTaskCommunication(parsed.communicationTask3);

    const communicationTotal = t1.score + t2.score + t3.score;
    const lexicalScore = clamp(Number(parsed.lexicalRange.score || 0), 0, MAX_SCORES.lexicalRange);
    const grammarScore = clamp(Number(parsed.grammaticalAccuracy.score || 0), 0, MAX_SCORES.grammaticalAccuracy);
    const pronunciationScore = clamp(Number(parsed.pronunciation.score || 0), 0, MAX_SCORES.pronunciation);
    const fluencyScore = clamp(Number(parsed.fluency.score || 0), 0, MAX_SCORES.fluency);

    const total = communicationTotal + lexicalScore + grammarScore + pronunciationScore + fluencyScore;

    return {
      totalScore: total,
      maxScore: 30,
      communication: {
        score: communicationTotal,
        maxScore: 18,
        justification: `Suma zadan: Z1 ${t1.score}/6, Z2 ${t2.score}/6, Z3 ${t3.score}/6.`
      },
      communicationTask1: buildCommunicationCriterion(t1.score, 'Zadanie 1', t1.justification),
      communicationTask2: buildCommunicationCriterion(t2.score, 'Zadanie 2', t2.justification),
      communicationTask3: buildCommunicationCriterion(t3.score, 'Zadanie 3', t3.justification),
      lexicalRange: {
        score: lexicalScore,
        maxScore: MAX_SCORES.lexicalRange,
        justification: parsed.lexicalRange.justification || 'Brak uzasadnienia.'
      },
      grammaticalAccuracy: {
        score: grammarScore,
        maxScore: MAX_SCORES.grammaticalAccuracy,
        justification: parsed.grammaticalAccuracy.justification || 'Brak uzasadnienia.'
      },
      pronunciation: {
        score: pronunciationScore,
        maxScore: MAX_SCORES.pronunciation,
        justification: parsed.pronunciation.justification || 'Brak uzasadnienia.'
      },
      fluency: {
        score: fluencyScore,
        maxScore: MAX_SCORES.fluency,
        justification: parsed.fluency.justification || 'Brak uzasadnienia.'
      },
      strengths: parsed.strengths && parsed.strengths.length > 0 ? parsed.strengths : ['Widoczna gotowosc do komunikacji.'],
      improvements: parsed.improvements && parsed.improvements.length > 0 ? parsed.improvements : ['Pracuj nad precyzja jezykowa i argumentacja.']
    };
  } catch {
    return null;
  }
};

const fallbackCommunicationForTask = (text: string, prompts: string[], taskName: string): SpeakingAssessment['communicationTask1'] => {
  const addressed = countCoveredPrompts(text, prompts);
  const developed = clamp(Math.round(addressed * 0.75), 0, addressed);
  const base = tableAScore(addressed, developed);
  const score = clamp(base, 0, 6);
  return {
    score,
    maxScore: 6,
    justification: `${taskName}: ocena awaryjna na podstawie pokrycia elementow (${addressed}/4) i rozwiniecia (${developed}/4).`
  };
};

const fallbackAssessment = (
  transcript: TranscriptEntry[],
  rolePlayPoints: string[],
  task2Elements: string[],
  task3Elements: string[]
): SpeakingAssessment => {
  const userTexts = transcript.filter((entry) => entry.role === 'user').map((entry) => entry.text.trim()).filter(Boolean);
  const userJoined = userTexts.join(' ');
  const totalWords = userJoined.split(/\s+/).filter(Boolean).length;
  const avgLength = userTexts.length > 0 ? totalWords / userTexts.length : 0;

  const task1Text = transcript.filter((entry) => entry.role === 'user' && entry.stage?.includes('task1')).map((entry) => entry.text).join(' ');
  const task2Text = transcript.filter((entry) => entry.role === 'user' && entry.stage?.includes('task2')).map((entry) => entry.text).join(' ');
  const task3Text = transcript.filter((entry) => entry.role === 'user' && entry.stage?.includes('task3')).map((entry) => entry.text).join(' ');

  const communicationTask1 = fallbackCommunicationForTask(task1Text || userJoined, rolePlayPoints, 'Zadanie 1');
  const communicationTask2 = fallbackCommunicationForTask(task2Text || userJoined, task2Elements, 'Zadanie 2');
  const communicationTask3 = fallbackCommunicationForTask(task3Text || userJoined, task3Elements, 'Zadanie 3');

  const communicationScore = communicationTask1.score + communicationTask2.score + communicationTask3.score;
  const lexicalRange = clamp(Math.round(avgLength >= 16 ? 4 : avgLength >= 12 ? 3 : avgLength >= 8 ? 2 : 1), 0, 4);
  const grammaticalAccuracy = clamp(Math.round(avgLength >= 16 ? 4 : avgLength >= 11 ? 3 : avgLength >= 7 ? 2 : 1), 0, 4);
  const pronunciation = userTexts.length >= 4 ? 2 : userTexts.length >= 2 ? 1 : 0;
  const fluency = userTexts.length >= 6 ? 2 : userTexts.length >= 3 ? 1 : 0;
  const totalScore = communicationScore + lexicalRange + grammaticalAccuracy + pronunciation + fluency;

  return {
    totalScore,
    maxScore: 30,
    communication: {
      score: communicationScore,
      maxScore: 18,
      justification: `Ocena awaryjna: Z1 ${communicationTask1.score}/6, Z2 ${communicationTask2.score}/6, Z3 ${communicationTask3.score}/6.`
    },
    communicationTask1,
    communicationTask2,
    communicationTask3,
    lexicalRange: {
      score: lexicalRange,
      maxScore: 4,
      justification: 'Ocena awaryjna na podstawie roznorodnosci i rozwiniecia odpowiedzi.'
    },
    grammaticalAccuracy: {
      score: grammaticalAccuracy,
      maxScore: 4,
      justification: 'Ocena awaryjna bez pelnej analizy bledow gramatycznych.'
    },
    pronunciation: {
      score: pronunciation,
      maxScore: 2,
      justification: 'Ocena awaryjna: potwierdzono interakcje glosowe w trakcie egzaminu.'
    },
    fluency: {
      score: fluency,
      maxScore: 2,
      justification: 'Ocena awaryjna: liczba i ciaglosc wypowiedzi ucznia.'
    },
    strengths: ['Uczen podjal komunikacje i udzielal odpowiedzi.'],
    improvements: ['Rozbuduj odpowiedzi i upewnij sie, ze kazdy element polecenia zostal omowiony.']
  };
};

export const assessSpeakingExam = async (input: SpeakingAssessmentInput): Promise<SpeakingAssessment> => {
  const transcriptText = input.transcript
    .map((entry, index) => `${index + 1}. [${entry.stage || 'unknown'}] ${entry.role === 'user' ? 'UCZEN' : 'EGZAMINATOR'}: ${entry.text}`)
    .join('\n');

  const prompt = `
Ocen probe maturalna ustna z jezyka angielskiego (Formuła 2023, CKE) na podstawie transkrypcji.

ZESTAW: ${input.examTitle}

ZADANIE 1 (rola) - wymagane elementy:
${input.rolePlayPoints.map((point, index) => `${index + 1}. ${point}`).join('\n')}

ZADANIE 2 (ilustracja) - wymagane elementy:
${input.task2Elements.map((point, index) => `${index + 1}. ${point}`).join('\n')}

ZADANIE 3 (material stymulujacy) - wymagane elementy:
${input.task3Elements.map((point, index) => `${index + 1}. ${point}`).join('\n')}

TRANSKRYPCJA:
${transcriptText}

OCENIANIE CKE:
1) Dla kazdego zadania 1/2/3 podaj:
- addressed: liczba omowionych elementow (0-4)
- developed: liczba elementow rozwinietych (0-4, nie wiecej niz addressed)
- deduction: kara z tabeli B (0, -1 lub -2)
- justification: krotkie uzasadnienie

2) Dla calej wypowiedzi podaj:
- lexicalRange: 0-4
- grammaticalAccuracy: 0-4
- pronunciation: 0-2
- fluency: 0-2

3) Zwracaj TYLKO JSON:
{
  "communicationTask1": { "addressed": 0, "developed": 0, "deduction": 0, "justification": "..." },
  "communicationTask2": { "addressed": 0, "developed": 0, "deduction": 0, "justification": "..." },
  "communicationTask3": { "addressed": 0, "developed": 0, "deduction": 0, "justification": "..." },
  "lexicalRange": { "score": 0, "justification": "..." },
  "grammaticalAccuracy": { "score": 0, "justification": "..." },
  "pronunciation": { "score": 0, "justification": "..." },
  "fluency": { "score": 0, "justification": "..." },
  "strengths": ["...", "..."],
  "improvements": ["...", "..."]
}
`;

  try {
    const response = await getCompletion(prompt, true);
    const parsed = parseAssessment(response);
    if (!parsed) {
      return fallbackAssessment(input.transcript, input.rolePlayPoints, input.task2Elements, input.task3Elements);
    }
    return parsed;
  } catch {
    return fallbackAssessment(input.transcript, input.rolePlayPoints, input.task2Elements, input.task3Elements);
  }
};
