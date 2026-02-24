
import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { WritingAssessment } from "../types";
import { retryWithBackoff, handleAIError } from './errorService';

// Configuration for NVIDIA NIM
// Comprehensive API key lookup
const getApiKey = () => {
  // 1. Check Vite's import.meta.env (Client-side)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    if (import.meta.env.VITE_NVIDIA_API_KEY) return import.meta.env.VITE_NVIDIA_API_KEY;
  }

  // 2. Check process.env (Server-side/Build-time define)
  if (typeof process !== 'undefined' && process.env) {
    return process.env.VITE_NVIDIA_API_KEY || process.env.NVIDIA_API_KEY || '';
  }

  return '';
};

let apiKey = getApiKey();

// OpenAI SDK requires an absolute URL or it might fail to construct the URL object internally
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api/nvidia`;
  }
  return 'http://localhost:3000/api/nvidia'; // Fallback for SSR/Test
};

const nvidia = new OpenAI({
  apiKey: apiKey,
  baseURL: getBaseUrl(), // Must be absolute for OpenAI SDK
  dangerouslyAllowBrowser: true // Required for client-side demo
});

const DEFAULT_MODEL = "meta/llama-3.1-70b-instruct";

const parseJsonObject = <T>(raw: string | null | undefined, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export interface ExamReport {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  prediction: string;
}

export const getCompletion = async (prompt: string, jsonMode: boolean = false): Promise<string> => {
  try {
    return await retryWithBackoff(async () => {
      const response = await nvidia.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [{ role: "user", content: prompt }],
        response_format: jsonMode ? { type: "json_object" } : undefined
      });
      return response.choices[0]?.message?.content || "";
    });
  } catch (error) {
    throw handleAIError(error);
  }
};

export const getChatCompletion = async (systemInstruction: string, history: { role: 'user' | 'assistant', content: string }[], userMessage: string): Promise<string> => {
  try {
    return await retryWithBackoff(async () => {
      const messages: ChatCompletionMessageParam[] = [
        { role: "system", content: systemInstruction },
        ...history,
        { role: "user", content: userMessage }
      ];

      const response = await nvidia.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: messages
      });
      return response.choices[0]?.message?.content || "";
    });
  } catch (error) {
    throw handleAIError(error);
  }
};

// --- AUDIO HELPERS (Fallback to Browser TTS) ---


let preferredVoiceName: string | null = null;
let useCloudTTS = false;

export const getAvailableVoices = (): SpeechSynthesisVoice[] => {
  return window.speechSynthesis.getVoices();
};

export const setPreferredVoice = (voiceName: string) => {
  preferredVoiceName = voiceName;
};

export const setTTSMode = (hq: boolean) => {
  useCloudTTS = hq;
};

const speakWithCloud = async (text: string, onEnded?: () => void) => {
  const encoded = encodeURIComponent(text.substring(0, 200));
  const url = `/api/tts?ie=UTF-8&q=${encoded}&tl=en&client=tw-ob`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Cloud TTS Fetch failed: ${response.status}`);
    }

    const blob = await response.blob();
    if (blob.size < 100) {
      throw new Error("Invalid audio data from cloud.");
    }

    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);

    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      if (onEnded) onEnded();
    };
    audio.onerror = () => {
      URL.revokeObjectURL(audioUrl);
      speakWithBrowser(text, onEnded);
    };

    await audio.play();
    return () => {
      audio.pause();
      URL.revokeObjectURL(audioUrl);
    };
  } catch (err) {
    console.error("TTS: Cloud Error:", err);
    return speakWithBrowser(text, onEnded);
  }
};

const speakWithBrowser = (text: string, onEnded?: () => void) => {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    if (onEnded) onEnded();
    return () => { };
  }

  window.speechSynthesis.cancel();

  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  u.rate = 1.0;
  u.pitch = 1.0;

  const voices = window.speechSynthesis.getVoices();
  let voice: SpeechSynthesisVoice | undefined;

  if (preferredVoiceName) {
    voice = voices.find(v => v.name === preferredVoiceName);
  }

  if (!voice) {
    voice = voices.find(v => v.name.includes("Google US English")) ||
      voices.find(v => v.name.includes("English (United States)")) ||
      voices.find(v => v.name.includes("Microsoft Zira")) ||
      voices.find(v => v.name.includes("Natural")) ||
      voices.find(v => v.lang.startsWith("en-US")) ||
      voices.find(v => v.lang.startsWith("en-GB")) ||
      voices.find(v => v.lang.startsWith("en"));
  }

  if (voice) {
    u.voice = voice;
  }

  u.onend = () => {
    if (onEnded) onEnded();
  };
  u.onerror = (e) => {
    console.error("TTS: Browser Error:", e);
    if (onEnded) onEnded();
  };

  window.speechSynthesis.speak(u);
  return () => window.speechSynthesis.cancel();
};

export const playTextToSpeech = async (text: string, onEnded?: () => void): Promise<() => void> => {
  if (useCloudTTS) {
    try {
      return speakWithCloud(text, onEnded);
    } catch (err) {
      return speakWithBrowser(text, onEnded);
    }
  }

  if (window.speechSynthesis.getVoices().length === 0) {
    await new Promise<void>(resolve => {
      window.speechSynthesis.onvoiceschanged = () => {
        resolve();
      };
      setTimeout(resolve, 1500);
    });
  }
  return speakWithBrowser(text, onEnded);
};

// --- GRADING & REPORT LOGIC ---

export const gradeWritingTask = async (topic: string, studentText: string): Promise<WritingAssessment> => {
  try {
    if (!apiKey || apiKey.includes("TWÓJ_KLUCZ")) {
      throw new Error("Missing NVIDIA API Key");
    }

    const prompt = `
      Jesteś surowym, certyfikowanym egzaminatorem CKE (Centralna Komisja Egzaminacyjna). 
      Twoim zadaniem jest ocena pracy pisemnej z języka angielskiego na poziomie Matury Podstawowej.
      
      ZASADY OCENIANIA (Strict CKE Rules):
      1. LIMITY SŁÓW (80-130 słów).
      2. KRYTERIUM TREŚĆ (0-4 pkt).
      3. KRYTERIUM SPÓJNOŚĆ I LOGIKA (0-2 pkt).
      4. ZAKRES ŚRODKÓW JĘZYKOWYCH (0-2 pkt).
      5. POPRAWNOŚĆ ŚRODKÓW JĘZYKOWYCH (0-2 pkt).

      TREŚĆ ZADANIA:
      ${topic}

      PRACA UCZNIA:
      "${studentText}"

      ODPOWIEDZ WYŁĄCZNIE W FORMACIE JSON:
      {
        "tresc": { "punkty": number, "komentarz": "string" },
        "spojnosc": { "punkty": number, "komentarz": "string" },
        "zakres": { "punkty": number, "komentarz": "string" },
        "poprawnosc": { "punkty": number, "komentarz": "string", "bledy": ["string"] },
        "suma": number,
        "podsumowanie": "string",
        "wskazowki": ["string"]
      }
    `;

    const response = await nvidia.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const jsonText = response.choices[0]?.message?.content;
    return parseJsonObject<WritingAssessment>(jsonText, {
      tresc: { punkty: 0, komentarz: "Brak danych z AI." },
      spojnosc: { punkty: 0, komentarz: "Brak danych z AI." },
      zakres: { punkty: 0, komentarz: "Brak danych z AI." },
      poprawnosc: { punkty: 0, komentarz: "Brak danych z AI.", bledy: [] },
      suma: 0,
      podsumowanie: "Nie udalo sie odczytac oceny AI.",
      wskazowki: ["Sprobuj ponownie za chwile."]
    });
  } catch (error) {
    console.error("NVIDIA AI Grading Error:", error);
    return {
      tresc: { punkty: 0, komentarz: "Błąd połączenia z NVIDIA AI. Sprawdź klucz API." },
      spojnosc: { punkty: 0, komentarz: "-" },
      zakres: { punkty: 0, komentarz: "-" },
      poprawnosc: { punkty: 0, komentarz: "-", bledy: [] },
      suma: 0,
      podsumowanie: "Wystąpił błąd techniczny. Spróbuj ponownie później.",
      wskazowki: ["Sprawdź połączenie internetowe i klucz NVIDIA_API_KEY."]
    };
  }
};

export const generateExamReport = async (
  examTitle: string,
  totalScore: number,
  maxScore: number,
  mistakes: string[],
  writingScore: number
): Promise<ExamReport> => {
  try {
    const percentage = Math.round((totalScore / maxScore) * 100);
    const prompt = `
      Napisz raport z egzaminu próbnego.
      Arkusz: ${examTitle}
      Wynik: ${totalScore}/${maxScore} (${percentage}%)
      Pisanie: ${writingScore}/12
      Błędy w zadaniach: ${mistakes.join(', ')}
      
      ODPOWIEDZ WYŁĄCZNIE W FORMACIE JSON:
      {
        "summary": "...",
        "strengths": ["..."],
        "weaknesses": ["..."],
        "recommendations": ["..."],
        "prediction": "..."
      }
    `;

    const response = await nvidia.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const jsonText = response.choices[0]?.message?.content;
    return parseJsonObject<ExamReport>(jsonText, {
      summary: "Raport nie zostal wygenerowany poprawnie.",
      strengths: ["Ukonczenie pelnego arkusza"],
      weaknesses: ["Brak szczegolowej analizy AI"],
      recommendations: ["Powtorz probny arkusz i sprawdz wynik ponownie."],
      prediction: "Jestes na dobrej drodze - cwicz regularnie."
    });

  } catch (error) {
    console.error("NVIDIA Report Generation Error:", error);
    return {
      summary: "Gratulacje ukończenia egzaminu! Twój wynik jest widoczny powyżej.",
      strengths: ["Ukończenie pełnego arkusza", "Próba sił z pisaniem"],
      weaknesses: ["Analiza niedostępna"],
      recommendations: ["Rozwiązuj więcej arkuszy", "Powtarzaj słówka"],
      prediction: "Ćwicz dalej, a będzie dobrze!"
    };
  }
}
