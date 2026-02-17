
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { WritingAssessment } from "../types";

// NOTE: In a production app, the API key should not be exposed on the client side this directly
// or should be handled via a proxy. Since this is a pure frontend demo, we assume env var.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface ExamReport {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  prediction: string; 
}

// --- AUDIO HELPERS ---

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

let audioCtx: AudioContext | null = null;

const speakWithBrowser = (text: string, onEnded?: () => void) => {
  window.speechSynthesis.cancel(); // Cancel any previous
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-GB'; // British accent for CKE vibe
  u.rate = 0.9;
  u.onend = () => { if(onEnded) onEnded() };
  u.onerror = (e) => { console.error("Browser TTS error", e); if(onEnded) onEnded(); };
  window.speechSynthesis.speak(u);
  return () => window.speechSynthesis.cancel();
};

export const playTextToSpeech = async (text: string, onEnded?: () => void): Promise<() => void> => {
  try {
    // 1. Try Google Gemini TTS First
    if (!process.env.API_KEY) throw new Error("No API Key");

    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
    }
    
    // CRITICAL: Resume context if suspended (browser autoplay policy)
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' }, // Kore is good for exams
            },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data returned from API");

    const audioBuffer = await decodeAudioData(
      decode(base64Audio),
      audioCtx,
      24000,
      1
    );

    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    const outputNode = audioCtx.createGain();
    source.connect(outputNode);
    outputNode.connect(audioCtx.destination);
    
    source.onended = () => {
      if (onEnded) onEnded();
    };
    
    source.start();

    // Return a function to stop the audio
    return () => {
      try {
        source.stop();
      } catch(e) {
        // Ignore errors if already stopped
      }
    };

  } catch (error) {
    console.warn("AI TTS Error (Falling back to browser):", error);
    // 2. Fallback to Browser Native TTS
    return speakWithBrowser(text, onEnded);
  }
};

// --- EXISTING WRITING & EXAM LOGIC ---

export const gradeWritingTask = async (topic: string, studentText: string): Promise<WritingAssessment> => {
  try {
    const prompt = `
      Jesteś surowym, certyfikowanym egzaminatorem CKE (Centralna Komisja Egzaminacyjna). 
      Twoim zadaniem jest ocena pracy pisemnej z języka angielskiego na poziomie Matury Podstawowej.
      
      ZASADY OCENIANIA (Strict CKE Rules):

      1. LIMITY SŁÓW (80-130 słów):
         - Praca powinna mieć od 80 do 130 słów.
         - < 80 słów: Jeśli praca jest za krótka, uczeń nie ma szansy w pełni rozwinąć punktów ani pokazać zakresu środków językowych. Obniż punkty w kryterium TREŚĆ i ZAKRES.
         - > 140 słów: CKE nie odejmuje punktów "za karę", ALE jeśli praca jest zbyt długa, często zawiera dygresje, powtórzenia lub błędy. Jeśli tekst jest rozwlekły i przekracza 140 słów, OBNIŻ ocenę za SPÓJNOŚĆ I LOGIKĘ (za zaburzenie proporcji lub brak zwięzłości) i dodaj ostrzeżenie w podsumowaniu.

      2. KRYTERIUM TREŚĆ (0-4 pkt):
         W poleceniu są ZAWSZE 4 podpunkty (kropki). Sprawdź każdy z nich:
         - Uczeń musi się do kropki ODNIEŚĆ (napisać o tym) i ją ROZWINĄĆ (dodać szczegół, uzasadnienie, opis).
         - 4 pkt: 4 elementy rozwinięte.
         - 3 pkt: 3 el. rozwinięte LUB 4 el. odniesione (bez rozwinięcia wszystkich).
         - 2 pkt: 2 el. rozwinięte LUB 3 el. odniesione.
         - 1 pkt: 1 el. rozwinięty LUB 2 el. odniesione.
         - 0 pkt: Praca nie na temat lub brak realizacji polecenia.

      3. KRYTERIUM SPÓJNOŚĆ I LOGIKA (0-2 pkt):
         - 2 pkt: Tekst jest w pełni spójny, logiczny, posiada wstęp i zakończenie.
         - 1 pkt: Drobne usterki w spójności (np. brak zdań łączących, nagłe przeskoki, dygresje - w tym za duża długość).
         - 0 pkt: Tekst niespójny.
         *Zasada CKE*: Jeśli za TREŚĆ jest 0 lub 1 pkt, za SPÓJNOŚĆ można dać max 1 pkt.

      4. ZAKRES ŚRODKÓW JĘZYKOWYCH (0-2 pkt):
         - 2 pkt: Zróżnicowane słownictwo i struktury (jak na poziom A2/B1).
         - 1 pkt: Słownictwo ubogie, powtarzające się.
         - 0 pkt: Bardzo ubogi zasób słów.
         *Zasada CKE*: Jeśli za TREŚĆ jest 0 lub 1 pkt, za ZAKRES można dać max 1 pkt.

      5. POPRAWNOŚĆ ŚRODKÓW JĘZYKOWYCH (0-2 pkt):
         - 2 pkt: Błędy nieliczne, nie zakłócają komunikacji.
         - 1 pkt: Błędy zakłócają komunikację czasami.
         - 0 pkt: Błędy uniemożliwiają zrozumienie.
         *Zasada CKE*: Jeśli za TREŚĆ jest 0 lub 1 pkt, za POPRAWNOŚĆ można dać max 1 pkt.

      TWOJE ZADANIE:
      Oceń poniższą pracę. Bądź konkretny. Wskaż, które kropki zostały rozwinięte, a które tylko "tknięte". Wypisz błędy.
      Komentarze pisz po POLSKU.

      TREŚĆ ZADANIA (z podpunktami do sprawdzenia):
      ${topic}

      PRACA UCZNIA:
      "${studentText}"
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tresc: {
              type: Type.OBJECT,
              properties: {
                punkty: { type: Type.INTEGER },
                komentarz: { type: Type.STRING }
              }
            },
            spojnosc: {
              type: Type.OBJECT,
              properties: {
                punkty: { type: Type.INTEGER },
                komentarz: { type: Type.STRING }
              }
            },
            zakres: {
              type: Type.OBJECT,
              properties: {
                punkty: { type: Type.INTEGER },
                komentarz: { type: Type.STRING }
              }
            },
            poprawnosc: {
              type: Type.OBJECT,
              properties: {
                punkty: { type: Type.INTEGER },
                komentarz: { type: Type.STRING },
                bledy: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            },
            suma: { type: Type.INTEGER },
            podsumowanie: { type: Type.STRING },
            wskazowki: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    const jsonText = response.text || "{}";
    return JSON.parse(jsonText) as WritingAssessment;
  } catch (error) {
    console.error("AI Grading Error:", error);
    // Fallback mock response if API fails or key is missing
    return {
      tresc: { punkty: 0, komentarz: "Błąd połączenia z AI. Sprawdź klucz API." },
      spojnosc: { punkty: 0, komentarz: "-" },
      zakres: { punkty: 0, komentarz: "-" },
      poprawnosc: { punkty: 0, komentarz: "-", bledy: [] },
      suma: 0,
      podsumowanie: "Wystąpił błąd techniczny. Spróbuj ponownie później.",
      wskazowki: ["Sprawdź połączenie internetowe."]
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
      
      JSON:
      {
        "summary": "...",
        "strengths": ["..."],
        "weaknesses": ["..."],
        "recommendations": ["..."],
        "prediction": "..."
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            prediction: { type: Type.STRING }
          }
        }
      }
    });

    const jsonText = response.text || "{}";
    return JSON.parse(jsonText) as ExamReport;

  } catch (error) {
    console.error("Report Generation Error:", error);
    return {
      summary: "Gratulacje ukończenia egzaminu! Twój wynik jest widoczny powyżej.",
      strengths: ["Ukończenie pełnego arkusza", "Próba sił z pisaniem"],
      weaknesses: ["Analiza niedostępna"],
      recommendations: ["Rozwiązuj więcej arkuszy", "Powtarzaj słówka"],
      prediction: "Ćwicz dalej, a będzie dobrze!"
    };
  }
}
