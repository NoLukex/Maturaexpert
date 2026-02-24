import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Mic, Square, Volume2, User, Bot, Play, GraduationCap, ChevronRight, Send, Loader2, Sparkles, BarChart3, Settings, X, Volume1 } from 'lucide-react';
import { playTextToSpeech, getChatCompletion, getAvailableVoices, setPreferredVoice, setTTSMode } from '../services/geminiService';
import { useChatContext } from '../contexts/ChatContext';
import { SPEAKING_EXAMS, SpeakingExam } from '../services/speakingData';
import { SpeakingAssessment } from '../types';
import { assessSpeakingExam } from '../services/speakingAssessment';
import { saveTaskResult } from '../services/storageService';

type ExamStage =
  | 'intro'
  | 'warmup'
  | 'task1_instructions'
  | 'task1_chat'
  | 'task2_instructions'
  | 'task2_chat'
  | 'task3_instructions'
  | 'task3_chat'
  | 'feedback';

interface SpeakingMessage {
  role: 'user' | 'assistant';
  text: string;
  stage: ExamStage;
}

type RecognitionErrorCode = 'not-allowed' | 'audio-capture' | 'network' | 'aborted' | 'no-speech' | string;

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: RecognitionErrorCode;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [altIndex: number]: {
        transcript: string;
      };
    };
  };
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const getSpeechRecognitionConstructor = (): SpeechRecognitionConstructor | null => {
  if (typeof window === 'undefined') return null;
  const extendedWindow = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return extendedWindow.SpeechRecognition || extendedWindow.webkitSpeechRecognition || null;
};

const isOperaBrowser = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return /OPR\//.test(navigator.userAgent);
};

const tokenize = (value: string): string[] =>
  value
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 3);

const isPromptCovered = (combinedUserText: string, prompt: string): boolean => {
  const userTokens = new Set(tokenize(combinedUserText));
  const promptTokens = tokenize(prompt);
  if (promptTokens.length === 0) return false;
  const matches = promptTokens.filter((token) => userTokens.has(token)).length;
  return matches / promptTokens.length >= 0.2;
};

const AudioVisualizer = ({ isActive }: { isActive: boolean }) => {
  return (
    <div className="flex items-center justify-center gap-1 h-8">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={`w-1 bg-red-500 rounded-full transition-all duration-300 ${isActive ? 'animate-pulse' : 'h-1'}`}
          style={{
            height: isActive ? `${Math.random() * 24 + 4}px` : '4px',
            animationDelay: `${i * 0.1}s`,
            opacity: isActive ? 1 : 0.3
          }}
        />
      ))}
    </div>
  );
};

const EXAMINER_LINES = {
  intro: 'Good morning. This is the oral examination in English. Please introduce yourself briefly.',
  warmupEnd: 'Thank you. This is the end of the warm-up. We will now move to Task 1.',
  task1End: 'Thank you. This is the end of Task 1. We will now move to Task 2.',
  task2Describe: 'Please describe the picture in detail.',
  task2End: 'Thank you. This is the end of Task 2. We will now move to Task 3.',
  task3Open: 'Please choose one option, justify your choice and explain why you reject the other option.',
  examEnd: 'Thank you. This is the end of the oral examination.'
} as const;

const Speaking: React.FC = () => {
  const [stage, setStage] = useState<ExamStage>('intro');
  const [status, setStatus] = useState<'listening' | 'processing' | 'speaking' | 'idle'>('idle');
  const [messages, setMessages] = useState<SpeakingMessage[]>([]);
  const [textInput, setTextInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [speakingAssessment, setSpeakingAssessment] = useState<SpeakingAssessment | null>(null);
  const [isAssessing, setIsAssessing] = useState(false);
  const [warmupQuestionIndex, setWarmupQuestionIndex] = useState(0);
  const [task2QuestionIndex, setTask2QuestionIndex] = useState(0);
  const [task2DescriptionDone, setTask2DescriptionDone] = useState(false);
  const [task2IntroAsked, setTask2IntroAsked] = useState(false);
  const [task3QuestionIndex, setTask3QuestionIndex] = useState(0);
  const [task3ChoiceDone, setTask3ChoiceDone] = useState(false);
  const [task3IntroAsked, setTask3IntroAsked] = useState(false);
  const [isMicSupported, setIsMicSupported] = useState(true);
  const isStrictCkeMode = true;

  // Voice Settings
  const [showSettings, setShowSettings] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');
  const [isHQ, setIsHQ] = useState(true); // Default to HQ for better UX

  // New: Select Exam State
  const [selectedExamId, setSelectedExamId] = useState<string>(SPEAKING_EXAMS[0].id);
  const currentExam = SPEAKING_EXAMS.find(e => e.id === selectedExamId) || SPEAKING_EXAMS[0];

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const audioStopRef = useRef<(() => void) | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const transcriptDraftRef = useRef('');
  const silenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track whether default voice was already set to avoid re-triggering
  const defaultVoiceSetRef = useRef(false);

  const { setScreenContext } = useChatContext();

  useEffect(() => {
    setTTSMode(isHQ);
  }, [isHQ]);

  // Load voices on mount – stable, no state in deps to avoid infinite loops
  const loadVoices = React.useCallback(() => {
    const available = getAvailableVoices();
    console.log("Loading voices, found:", available.length);
    setVoices(available);

    // Only set default voice once
    if (available.length > 0 && !defaultVoiceSetRef.current) {
      const defaultVoice = available.find(v => v.name.includes("Google US English")) ||
        available.find(v => v.name.includes("Microsoft Zira")) ||
        available.find(v => v.lang.startsWith("en")) ||
        available[0];
      if (defaultVoice) {
        defaultVoiceSetRef.current = true;
        setSelectedVoiceName(defaultVoice.name);
        setPreferredVoice(defaultVoice.name);
      }
    }
  }, []); // stable – no state deps

  useEffect(() => {
    loadVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    // Periodic check if still empty (some browsers are stubborn)
    const interval = setInterval(() => {
      const current = getAvailableVoices();
      if (current.length === 0) loadVoices();
    }, 2000);

    return () => clearInterval(interval);
  }, [loadVoices]); // removed voices.length – was causing re-runs on every voice update

  // Update Assistant Context
  useEffect(() => {
    setScreenContext(`
      MODUŁ: MATURA USTNA (Oficjalny Egzamin CKE)
      Zestaw: ${currentExam.title}
      Etap: ${stage}
      Status: ${status}
      Ostatni komunikat AI: ${messages.filter(m => m.role === 'assistant').slice(-1)[0]?.text || 'Brak'}
      ZASADY:
      1. Uczen odpowiada glosowo (tryb CKE strict).
      2. Przebieg: rozmowa wstepna -> zadanie 1 -> zadanie 2 -> zadanie 3.
      3. Ocenianie koncowe zgodne z CKE Formula 2023 (30 pkt).
    `);
  }, [stage, status, messages, setScreenContext, currentExam]);

  // Scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  useEffect(() => {
    if (stage === 'task2_chat' && !task2DescriptionDone && !task2IntroAsked) {
      setTask2IntroAsked(true);
      const prompt = EXAMINER_LINES.task2Describe;
      void pushAssistantMessage(prompt);
    }
  }, [stage, task2DescriptionDone, task2IntroAsked]);

  useEffect(() => {
    if (stage === 'task3_chat' && !task3ChoiceDone && !task3IntroAsked) {
      setTask3IntroAsked(true);
      const prompt = `${EXAMINER_LINES.task3Open} Option A: ${currentExam.task3.options[0]}. Option B: ${currentExam.task3.options[1]}.`;
      void pushAssistantMessage(prompt);
    }
  }, [stage, task3ChoiceDone, task3IntroAsked, currentExam.task3.options]);

  useEffect(() => {
    const runAssessment = async () => {
      if (stage !== 'feedback' || speakingAssessment || isAssessing) return;

      setIsAssessing(true);
      try {
        const report = await assessSpeakingExam({
          examTitle: currentExam.title,
          rolePlayPoints: currentExam.task1.points,
          task2Elements: currentExam.task2.requiredElements,
          task3Elements: currentExam.task3.requiredElements,
          transcript: messages
        });
        setSpeakingAssessment(report);
        saveTaskResult('speaking', report.totalScore, report.maxScore, currentExam.id);
      } finally {
        setIsAssessing(false);
      }
    };

    void runAssessment();
  }, [stage, speakingAssessment, isAssessing, currentExam, messages]);

  // Mic Support Check
  useEffect(() => {
    const SpeechRecognition = getSpeechRecognitionConstructor();
    if (!SpeechRecognition) {
      setIsMicSupported(false);
      return () => {
        stopAudio();
        stopRecognition();
      };
    }

    if (!window.isSecureContext) {
      setError('Mikrofon wymaga bezpiecznego polaczenia HTTPS.');
    }

    return () => {
      stopAudio();
      stopRecognition();
    };
  }, []);

  const changeVoice = (voiceName: string) => {
    console.log("Speaking: Changing voice to:", voiceName);
    setSelectedVoiceName(voiceName);
    setPreferredVoice(voiceName);
    setIsHQ(false); // Disable cloud HQ if user manually picks a system voice
    playTextToSpeech("Hello. This is my new voice. Is it better?", () => { });
  };

  const stopAudio = () => {
    console.log("Speaking: Stopping current audio.");
    if (audioStopRef.current) {
      audioStopRef.current();
      audioStopRef.current = null;
    }
  };

  const stopRecognition = () => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) { }
    }
  };

  const bumpSilenceTimeout = () => {
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    silenceTimeoutRef.current = setTimeout(() => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {
          // no-op
        }
      }
    }, 2500);
  };

  const speak = async (text: string) => {
    stopAudio();
    setStatus('speaking');
    try {
      const stopFn = await playTextToSpeech(text, () => setStatus('idle'));
      audioStopRef.current = stopFn;
    } catch (e) {
      console.error("TTS Error", e);
      setStatus('idle');
    }
  };

  const pushAssistantMessage = async (text: string) => {
    setMessages(prev => [...prev, { role: 'assistant', text, stage }]);
    await speak(text);
  };

  const startExam = () => {
    setStage('warmup');
    setMessages([]);
    setTextInput('');
    setError(null);
    setSpeakingAssessment(null);
    setWarmupQuestionIndex(0);
    setTask2QuestionIndex(0);
    setTask2DescriptionDone(false);
    setTask2IntroAsked(false);
    setTask3QuestionIndex(0);
    setTask3ChoiceDone(false);
    setTask3IntroAsked(false);

    const intro = EXAMINER_LINES.intro;
    void pushAssistantMessage(intro);
  };

  const processResponse = async (userText: string) => {
    if (!userText.trim()) return;
    if (status === 'processing') return;

    stopRecognition();
    setMessages(prev => [...prev, { role: 'user', text: userText, stage }]);
    setTextInput('');
    transcriptDraftRef.current = '';
    setStatus('processing');

    try {
      if (stage === 'warmup') {
        if (warmupQuestionIndex < currentExam.warmup.questions.length) {
          await pushAssistantMessage(currentExam.warmup.questions[warmupQuestionIndex]);
          setWarmupQuestionIndex(prev => prev + 1);
        } else {
          await pushAssistantMessage(EXAMINER_LINES.warmupEnd);
          setStage('task1_instructions');
        }
        setStatus('idle');
        return;
      }

      if (stage === 'task2_chat') {
        if (!task2DescriptionDone) {
          setTask2DescriptionDone(true);
          setTask2QuestionIndex(1);
          await pushAssistantMessage(currentExam.task2.aiQuestions[0]);
          setStatus('idle');
          return;
        }

        if (task2QuestionIndex < currentExam.task2.aiQuestions.length) {
          await pushAssistantMessage(currentExam.task2.aiQuestions[task2QuestionIndex]);
          setTask2QuestionIndex(prev => prev + 1);
          setStatus('idle');
          return;
        }

        await pushAssistantMessage(EXAMINER_LINES.task2End);
        setStage('task3_instructions');
        setStatus('idle');
        return;
      }

      if (stage === 'task3_chat') {
        if (!task3ChoiceDone) {
          setTask3ChoiceDone(true);
          setTask3QuestionIndex(1);
          await pushAssistantMessage(currentExam.task3.aiQuestions[0]);
          setStatus('idle');
          return;
        }

        if (task3QuestionIndex < currentExam.task3.aiQuestions.length) {
          await pushAssistantMessage(currentExam.task3.aiQuestions[task3QuestionIndex]);
          setTask3QuestionIndex(prev => prev + 1);
          setStatus('idle');
          return;
        }

        await pushAssistantMessage(EXAMINER_LINES.examEnd);
        setStage('feedback');
        setStatus('idle');
        return;
      }

      const history = [...messages, { role: 'user' as const, text: userText }].map(m => ({
        role: m.role,
        content: m.text
      }));

      const systemPrompt = `
        You are a STRICT official English Matura Examiner (CKE Poland), formula 2023.
        Current Stage: ${stage}
        Exam Set: ${currentExam.title}

        Task 1 context: ${currentExam.task1.instruction}
        Required points to cover: ${currentExam.task1.points.join(' | ')}
        Examiner role: ${currentExam.task1.aiRole}

        Task 2 context: ${currentExam.task2.instruction}
        Task 2 required elements: ${currentExam.task2.requiredElements.join(' | ')}

        Task 3 context: ${currentExam.task3.instruction}
        Task 3 options: ${currentExam.task3.options.join(' | ')}
        Task 3 required elements: ${currentExam.task3.requiredElements.join(' | ')}

        Rules:
        - Use strict formal examiner language.
        - Ask only one question at a time.
        - Keep each utterance short (one instruction or one question).
        - Do not coach, correct, or suggest answers.
        - Follow exam procedure only; no small talk.
      `;

      const aiResponse = await getChatCompletion(systemPrompt, history, userText);

      setMessages(prev => [...prev, { role: 'assistant', text: aiResponse, stage }]);
      await speak(aiResponse);

    } catch (e) {
      console.error(e);
      setError("Błąd połączenia z NVIDIA NIM.");
      setStatus('idle');
    }
  };

  const toggleListening = () => {
    if (status === 'speaking') {
      stopAudio();
      setStatus('idle');
    }
    if (status === 'listening') { stopRecognition(); return; }

    setError(null);
    const SpeechRecognition = getSpeechRecognitionConstructor();
    if (!SpeechRecognition) {
      setError('Ta przegladarka nie wspiera rozpoznawania mowy. Uzyj Chrome lub Edge.');
      return;
    }

    if (!window.isSecureContext) {
      setError('Mikrofon dziala tylko przez HTTPS.');
      return;
    }

    if (isOperaBrowser()) {
      setError('Opera GX bywa niestabilna dla rozpoznawania mowy. Jesli nie zadziala, wylacz VPN/adblock/tarcze i sprobuj ponownie albo uzyj Edge.');
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      transcriptDraftRef.current = '';

      recognition.onstart = () => {
        setStatus('listening');
        bumpSilenceTimeout();
      };
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = 0; i < event.results.length; i += 1) {
          const piece = event.results[i][0]?.transcript || '';
          if (event.results[i].isFinal) finalTranscript += piece;
          else interimTranscript += piece;
        }

        const draft = `${finalTranscript} ${interimTranscript}`.replace(/\s+/g, ' ').trim();
        if (draft) {
          transcriptDraftRef.current = draft;
          setTextInput(draft);
          bumpSilenceTimeout();
        }
      };
      recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
        console.error(e);
        if (e.error === 'not-allowed') {
          setError('Brak uprawnienia do mikrofonu. Zezwol na mikrofon w przegladarce.');
        } else if (e.error === 'audio-capture') {
          setError('Nie wykryto mikrofonu. Sprawdz ustawienia audio systemu.');
        } else if (e.error === 'network') {
          setError(isOperaBrowser()
            ? 'Opera GX zablokowala usluge rozpoznawania mowy (network). Wylacz VPN/adblock/tarcze dla strony lub uzyj Edge.'
            : 'Blad sieci podczas rozpoznawania mowy. Sprawdz internet i sprobuj ponownie.');
        } else if (e.error === 'no-speech') {
          setError('Nie wykryto mowy. Sprobuj ponownie i mow glosniej po angielsku.');
        } else if (e.error !== 'aborted') {
          setError(`Blad mikrofonu: ${e.error}`);
        }
        recognitionRef.current = null;
        setStatus('idle');
      };
      recognition.onend = () => {
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
        recognitionRef.current = null;
        setStatus('idle');

        const transcript = transcriptDraftRef.current.trim();
        if (transcript) {
          setTextInput(transcript);
          void processResponse(transcript);
        } else {
          setError(isOperaBrowser()
            ? 'Opera GX nie zwrocila transkrypcji. Wylacz VPN/adblock/tarcze i ustaw jezyk rozpoznawania na English, albo uzyj Edge.'
            : 'Nie przechwycono wypowiedzi. Kliknij mikrofon i powiedz 1-2 zdania.');
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error(e);
      setError('Nie udalo sie uruchomic mikrofonu. Sprobuj ponownie.');
      setStatus('idle');
    }
  };

  const handleSendText = () => {
    if (isStrictCkeMode && isMicSupported) {
      setError('Tryb CKE strict: odpowiedzi wpisane z klawiatury sa wylaczone. Odpowiadaj mikrofonem.');
      return;
    }
    void processResponse(textInput);
  };

  const finishTask1 = async () => {
    await pushAssistantMessage(EXAMINER_LINES.task1End);
    setStage('task2_instructions');
  };

  const beginTask2Chat = () => {
    setTask2DescriptionDone(false);
    setTask2QuestionIndex(0);
    setTask2IntroAsked(false);
    setStage('task2_chat');
  };

  const beginTask3Chat = () => {
    setTask3ChoiceDone(false);
    setTask3QuestionIndex(0);
    setTask3IntroAsked(false);
    setStage('task3_chat');
  };

  // --- RENDERERS ---

  const renderSettings = () => (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#0F1B2D] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X size={24} />
        </button>
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Settings size={20} /> Ustawienia Głosu
        </h3>

        {/* Main Header */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white font-bold flex items-center gap-2">
              <Sparkles size={18} className="text-blue-400" /> Tryb High Quality (Polecane)
            </span>
            <button
              onClick={() => setIsHQ(!isHQ)}
              className={`w-12 h-6 rounded-full transition-colors relative ${isHQ ? 'bg-blue-500' : 'bg-gray-600'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${isHQ ? 'left-7' : 'left-1'}`}></div>
            </button>
          </div>
          <p className="text-[10px] text-gray-400">Wykorzystuje zaawansowany silnik chmurowy dla idealnego angielskiego akcentu (wymaga internetu).</p>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Alternatywne głosy systemowe</h4>
          <button
            onClick={loadVoices}
            className="text-[10px] bg-white/10 hover:bg-white/20 text-gray-300 px-2 py-1 rounded transition-colors"
          >
            Odśwież listę
          </button>
        </div>

        <div className="space-y-4 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2 mb-4">
          {voices.length === 0 ? (
            <div className="text-center py-8">
              <Loader2 size={32} className="animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-gray-400 text-sm">Czekam na głosy systemowe...</p>
              <p className="text-[10px] text-gray-500 mt-2 px-4">Jeśli problem nadal występuje, sprawdź czy Twoja przeglądarka wspiera TTS lub doinstaluj pakiety językowe w systemie Windows/macOS.</p>
            </div>
          ) : (
            voices.map(voice => (
              <button
                key={voice.name}
                onClick={() => changeVoice(voice.name)}
                className={`w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between group ${selectedVoiceName === voice.name ? 'bg-blue-600 border-blue-400 text-white' : 'bg-[#1e293b] border-white/5 text-gray-300 hover:bg-[#2d3b55]'}`}
              >
                <div>
                  <div className="font-bold text-sm">{voice.name}</div>
                  <div className="text-xs opacity-60">[{voice.lang}] {voice.localService ? '(Lokalny)' : '(Chmura)'}</div>
                </div>
                {selectedVoiceName === voice.name && <Volume1 size={18} />}
              </button>
            ))
          )}
        </div>

        <div className="pt-4 border-t border-white/5 flex flex-col gap-3">
          <p className="text-[10px] text-gray-400">
            {isHQ ? 'Tryb HQ używa zaawansowanego głosu chmurowego.' : 'Zalecane głosy systemowe: "Google US English" lub "Microsoft Zira" (EN-US).'}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => playTextToSpeech("Hello! This is an English exam voice test.", () => { })}
              className="flex-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 py-3 rounded-xl font-bold flex items-center justify-center gap-2 border border-blue-500/30 transition-all"
            >
              <Volume2 size={18} /> Test dźwięku
            </button>
            <button
              onClick={() => setShowSettings(false)}
              className="flex-1 bg-white hover:bg-gray-100 text-[#0F1B2D] py-3 rounded-xl font-bold transition-all"
            >
              Gotowe
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderIntro = () => (
    <div className="h-full flex flex-col items-center justify-center text-center space-y-8 animate-fade-in relative">
      <button
        onClick={() => setShowSettings(true)}
        className="absolute top-0 right-0 p-3 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-all border border-white/5"
        title="Ustawienia głosu"
      >
        <Settings size={20} />
      </button>

      <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center relative border border-white/10 group hover:border-blue-500/50 transition-colors">
        <GraduationCap size={64} className="text-white group-hover:text-blue-400 transition-colors" />
        <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </div>

      <div className="max-w-md w-full">
        <h3 className="text-3xl font-display font-bold text-white mb-2">Egzamin Ustny</h3>
        <p className="text-gray-400 text-sm mb-8">Wybierz zestaw i rozpocznij przebieg ustnej 1:1 wedlug CKE.</p>

        <div className="grid gap-3 mb-8">
          {SPEAKING_EXAMS.map(exam => (
            <button
              key={exam.id}
              onClick={() => setSelectedExamId(exam.id)}
              className={`p-4 rounded-xl border text-left transition-all ${selectedExamId === exam.id ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-900/50' : 'bg-[#1e293b] border-white/10 text-gray-400 hover:bg-[#2d3b55]'}`}
            >
              <div className="font-bold">{exam.title}</div>
              <div className="text-xs opacity-70 mt-1">Poziom: {exam.level}</div>
            </button>
          ))}
        </div>

        <button onClick={startExam} className="w-full bg-white text-black hover:bg-gray-200 px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-3">
          <Play size={20} fill="currentColor" /> Rozpocznij Egzamin
        </button>
      </div>
    </div>
  );

  const renderInstructions = (title: string, content: React.ReactNode, nextStage: ExamStage, onContinue?: () => void) => (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-slide-up bg-[#0F1B2D] rounded-3xl border border-white/5">
      <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-widest border-b border-white/10 pb-4 w-full">{title}</h3>
      <div className="text-gray-300 text-base mb-8 text-left w-full max-w-2xl bg-black/20 p-6 rounded-xl border border-white/5">
        {content}
      </div>
      <button onClick={() => { if (onContinue) onContinue(); else setStage(nextStage); }} className="bg-matura-accent text-matura-bg px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-yellow-400 transition-colors">
        Rozumiem, zaczynajmy <ChevronRight size={20} />
      </button>
    </div>
  );

  const renderChat = () => (
    <div className="flex flex-col h-full">
      {(() => {
        const combinedUserText = messages
          .filter((msg) => msg.role === 'user')
          .map((msg) => msg.text)
          .join(' ');

        const task1Coverage = currentExam.task1.points.map((point) => isPromptCovered(combinedUserText, point));

        return stage.includes('task1') ? (
          <div className="bg-[#091624] border-b border-white/10 px-4 py-3">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">Checklist zadania 1 (CKE)</p>
            <div className="grid md:grid-cols-3 gap-2">
              {currentExam.task1.points.map((point, index) => (
                <div
                  key={index}
                  className={`text-xs p-2 rounded-lg border ${task1Coverage[index] ? 'border-green-500/30 bg-green-500/10 text-green-300' : 'border-white/10 bg-white/5 text-gray-300'}`}
                >
                  {task1Coverage[index] ? 'OK' : 'Do omowienia'}: {point}
                </div>
              ))}
            </div>
          </div>
        ) : null;
      })()}

      {stage.includes('task1') && (
        <div className="bg-[#112240] p-4 rounded-t-3xl border-b border-white/5 flex justify-between items-center text-xs text-gray-400">
          <span><strong>Zadanie:</strong> {currentExam.task1.title}</span>
          <div className="flex gap-2">
            {currentExam.task1.points.map((_, i) => <div key={i} className="w-2 h-2 rounded-full bg-white/20"></div>)}
          </div>
        </div>
      )}
      {stage.includes('task2') && (
        <div className="bg-[#112240] p-2 rounded-t-3xl border-b border-white/5 h-48 flex-shrink-0 relative overflow-hidden group">
          <img src={currentExam.task2.imageUrl} alt="Exam Task" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
          <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-[10px] text-white font-bold backdrop-blur-sm">Zadanie 2: Opisz obrazek</div>
        </div>
      )}
      {stage.includes('task3') && (
        <div className="bg-[#112240] p-4 rounded-t-3xl border-b border-white/5 flex items-center justify-between gap-4 text-xs text-gray-300">
          <div>
            <p className="font-bold text-white mb-1">Zadanie 3: Material stymulujacy</p>
            <p>A: {currentExam.task3.options[0]}</p>
            <p>B: {currentExam.task3.options[1]}</p>
          </div>
          <div className="text-right text-[10px] text-gray-400">
            Wybierz opcje, uzasadnij, odrzuc druga, odpowiedz na 2 pytania.
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#0A1628]">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-slide-up`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'assistant' ? 'bg-white text-black' : 'bg-white/10 text-white'}`}>
              {msg.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
            </div>
            <div className={`p-3 rounded-2xl text-sm leading-relaxed max-w-[85%] ${msg.role === 'assistant' ? 'bg-[#1e293b] text-white border border-white/10' : 'bg-blue-600 text-white'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        {status === 'processing' && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center"><Bot size={16} /></div>
            <div className="bg-[#1e293b] p-3 rounded-2xl flex items-center gap-2 text-gray-400 text-xs border border-white/10">
              <Loader2 size={14} className="animate-spin" /> Egzaminator analizuje odpowiedź...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-[#0F1B2D] rounded-b-3xl border-t border-white/5">
        {stage === 'task1_chat' && (
          <div className="mb-3">
            <button
              onClick={finishTask1}
              className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold uppercase tracking-wider"
            >
              Zakoncz zadanie 1 i przejdz dalej
            </button>
          </div>
        )}
        {error && (
          <div className="mb-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-xs flex items-center gap-2 animate-shake">
            <X size={14} className="cursor-pointer" onClick={() => setError(null)} />
            {error}
          </div>
        )}
        <div className="flex items-end gap-2">
          {/* Visualizer / Input Area */}
          <div className={`flex-1 bg-[#0A1628] rounded-xl border flex items-center px-3 py-2 relative transition-all ${status === 'listening' ? 'border-red-500/50 shadow-lg shadow-red-900/20' : 'border-white/10'}`}>
            {status === 'listening' ? (
              <div className="flex-1 flex items-center gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-gray-400 text-sm">Słucham...</span>
                <div className="flex-1 flex justify-end">
                  <AudioVisualizer isActive={true} />
                </div>
              </div>
            ) : (
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
                disabled={status === 'processing' || status === 'speaking' || (isStrictCkeMode && isMicSupported)}
                placeholder={isStrictCkeMode && isMicSupported ? 'Tryb CKE strict: odpowiedzi tylko mikrofonem' : 'Napisz odpowiedź (jeśli nie możesz mówić)...'}
                className="flex-1 bg-transparent border-none outline-none text-white text-sm h-10"
              />
            )}

            {status === 'speaking' && <div className="absolute right-3 top-3"><AudioVisualizer isActive={true} /></div>}
          </div>

          {isMicSupported && (
            <button
              onClick={toggleListening}
              disabled={status === 'processing'}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg ${status === 'listening' ? 'bg-red-500 text-white hover:bg-red-600 scale-105' : status === 'speaking' ? 'bg-yellow-500 text-black hover:bg-yellow-400' : 'bg-[#1e293b] text-white hover:bg-[#2d3b55] border border-white/10'}`}
            >
              {status === 'listening' ? <Square size={20} fill="currentColor" /> : status === 'speaking' ? <Volume2 size={24} /> : <Mic size={24} />}
            </button>
          )}

          {!isStrictCkeMode && (
            <button
              onClick={handleSendText}
              disabled={!textInput.trim() || status === 'processing' || status === 'listening'}
              className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              <Send size={20} />
            </button>
          )}
        </div>
        <div className="text-center mt-2">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">
            {isStrictCkeMode
              ? 'Tryb CKE strict: odpowiedzi glosowe, bez wpisywania z klawiatury'
              : 'Tryb Glosowy (Beta) - najbardziej stabilny w Edge/Chrome'}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto p-4 md:p-6 animate-fade-in relative">
      {showSettings && renderSettings()}
      <div className="flex-1 bg-[#0A1628] rounded-3xl border border-white/5 shadow-2xl overflow-hidden relative">
        {stage === 'intro' && renderIntro()}
        {stage === 'warmup' && renderChat()}
        {stage === 'task1_instructions' && renderInstructions(currentExam.task1.title, <div className="space-y-4"><p className="font-bold">{currentExam.task1.instruction}</p><ul className="list-disc pl-5 space-y-2 text-sm text-gray-400">{currentExam.task1.points.map((p, i) => <li key={i}>{p}</li>)}</ul></div>, 'task1_chat')}
        {stage === 'task1_chat' && renderChat()}
        {stage === 'task2_instructions' && renderInstructions(currentExam.task2.title, <div className="flex flex-col items-center gap-6"><p>{currentExam.task2.instruction}</p><div className="w-full max-w-md rounded-xl overflow-hidden border border-white/20 shadow-2xl"><img src={currentExam.task2.imageUrl} alt="Exam Task" className="w-full h-auto" /></div></div>, 'task2_chat', beginTask2Chat)}
        {stage === 'task2_chat' && renderChat()}
        {stage === 'task3_instructions' && renderInstructions(currentExam.task3.title, <div className="space-y-4"><p>{currentExam.task3.instruction}</p><div className="bg-white/5 rounded-xl border border-white/10 p-4 text-sm"><p className="mb-2"><strong>Opcja A:</strong> {currentExam.task3.options[0]}</p><p><strong>Opcja B:</strong> {currentExam.task3.options[1]}</p></div></div>, 'task3_chat', beginTask3Chat)}
        {stage === 'task3_chat' && renderChat()}
        {stage === 'feedback' && (
          <div className="h-full overflow-y-auto custom-scrollbar p-8 animate-fade-in">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="text-center space-y-3">
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mx-auto ring-1 ring-green-500/30"><GraduationCap size={40} /></div>
                <h2 className="text-3xl font-display font-bold text-white">Raport matury ustnej</h2>
                <p className="text-gray-400">Ocena CKE Formula 2023: 30 pkt (komunikacja 18 + jezyk 12), prog zdania 9 pkt.</p>
              </div>

              {isAssessing && (
                <div className="bg-[#112240] border border-white/10 rounded-2xl p-5 text-gray-300 flex items-center gap-3">
                  <Loader2 size={18} className="animate-spin" />
                  Trwa analiza transkrypcji i wyliczanie punktow...
                </div>
              )}

              {speakingAssessment && (
                <>
                  <div className={`border rounded-2xl p-4 ${speakingAssessment.totalScore >= 9 ? 'bg-green-500/10 border-green-500/30 text-green-300' : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
                    {speakingAssessment.totalScore >= 9 ? 'Wynik zdany (co najmniej 30%).' : 'Wynik niezdany (ponizej 30%).'}
                  </div>

                  <div className="bg-[#112240] border border-white/10 rounded-2xl p-6">
                    <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Wynik laczny</p>
                    <p className="text-4xl font-display font-bold text-matura-accent">
                      {speakingAssessment.totalScore} / {speakingAssessment.maxScore}
                    </p>
                  </div>

                  {[
                    { label: 'Komunikacja - Zadanie 1', criterion: speakingAssessment.communicationTask1 },
                    { label: 'Komunikacja - Zadanie 2', criterion: speakingAssessment.communicationTask2 },
                    { label: 'Komunikacja - Zadanie 3', criterion: speakingAssessment.communicationTask3 }
                  ].map(({ label, criterion }) => (
                    criterion ? (
                      <div key={label} className="bg-[#0F1B2D] border border-white/10 rounded-2xl p-5">
                        <div className="flex items-center justify-between">
                          <p className="text-white font-semibold">{label}</p>
                          <p className="text-matura-accent font-bold">{criterion.score} / {criterion.maxScore}</p>
                        </div>
                        <p className="text-sm text-gray-400 mt-2">{criterion.justification}</p>
                      </div>
                    ) : null
                  ))}

                  {[
                    { label: 'Sprawnosc komunikacyjna (suma zadan 1-3)', criterion: speakingAssessment.communication },
                    { label: 'Zakres srodkow jezykowych', criterion: speakingAssessment.lexicalRange },
                    { label: 'Poprawnosc jezykowa', criterion: speakingAssessment.grammaticalAccuracy },
                    { label: 'Wymowa', criterion: speakingAssessment.pronunciation },
                    { label: 'Plynnosc', criterion: speakingAssessment.fluency }
                  ].map(({ label, criterion }) => (
                    <div key={label} className="bg-[#0F1B2D] border border-white/10 rounded-2xl p-5">
                      <div className="flex items-center justify-between">
                        <p className="text-white font-semibold">{label}</p>
                        <p className="text-matura-accent font-bold">{criterion.score} / {criterion.maxScore}</p>
                      </div>
                      <p className="text-sm text-gray-400 mt-2">{criterion.justification}</p>
                    </div>
                  ))}

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-[#0F1B2D] border border-green-500/30 rounded-2xl p-4">
                      <p className="text-xs uppercase tracking-wider text-green-400 mb-2">Mocne strony</p>
                      <ul className="space-y-1 text-sm text-gray-300">
                        {speakingAssessment.strengths.map((item, index) => <li key={index}>- {item}</li>)}
                      </ul>
                    </div>
                    <div className="bg-[#0F1B2D] border border-yellow-500/30 rounded-2xl p-4">
                      <p className="text-xs uppercase tracking-wider text-yellow-400 mb-2">Do poprawy</p>
                      <ul className="space-y-1 text-sm text-gray-300">
                        {speakingAssessment.improvements.map((item, index) => <li key={index}>- {item}</li>)}
                      </ul>
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-3 justify-center pt-2">
                <button
                  onClick={() => { setStage('intro'); setMessages([]); setSpeakingAssessment(null); }}
                  className="bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  Wroc do menu
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Speaking;
