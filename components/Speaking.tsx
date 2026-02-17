
import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Volume2, User, Bot, Play, BrainCircuit, AlertCircle, Send, Loader2, RefreshCw, GraduationCap, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { playTextToSpeech } from '../services/geminiService';
import { GoogleGenAI } from "@google/genai";
import { useChatContext } from '../contexts/ChatContext';

type ExamStage = 'intro' | 'warmup' | 'task1_instructions' | 'task1_chat' | 'task2_instructions' | 'task2_chat' | 'feedback';

const Speaking: React.FC = () => {
  const [stage, setStage] = useState<ExamStage>('intro');
  const [status, setStatus] = useState<'listening' | 'processing' | 'speaking' | 'idle'>('idle');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [textInput, setTextInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isMicSupported, setIsMicSupported] = useState(true);
  
  // CKE STATIC DATA
  const EXAM_DATA = {
    warmup: {
      questions: ["Do you have a hobby?", "How do you usually spend your weekends?", "Do you like travelling?"]
    },
    task1: {
      title: "Zadanie 1. Rozmowa z odgrywaniem roli",
      instruction: "Jesteś na wakacjach w Wielkiej Brytanii. Rozmawiasz z recepcjonistą w hostelu. Poniżej podane są 3 kwestie, które musisz omówić w rozmowie z egzaminującym.",
      points: [
        "Zapytaj o dostępność pokoju jednoosobowego.",
        "Zapytaj o cenę za jedną noc.",
        "Dowiedz się, czy śniadanie jest wliczone w cenę."
      ],
      aiRole: "You are a receptionist at a hostel in London. The student is a tourist asking for a room."
    },
    task2: {
      title: "Zadanie 2. Opis ilustracji",
      instruction: "Opisz ilustrację, którą widzisz na ekranie. Następnie odpowiedz na pytania egzaminującego.",
      imageUrl: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80", // Friends laughing
      aiQuestions: ["Why do you think these people are happy?", "Do you prefer spending time alone or with friends?", "Tell me about a party you went to recently."]
    }
  };

  const recognitionRef = useRef<any>(null);
  const audioStopRef = useRef<(() => void) | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { setScreenContext } = useChatContext();

  // Update Assistant Context
  useEffect(() => {
    setScreenContext(`
      MODUŁ: MATURA USTNA (Oficjalny Egzamin CKE)
      Etap: ${stage}
      Status: ${status}
      Ostatni komunikat AI: ${messages.filter(m => m.role === 'ai').slice(-1)[0]?.text || 'Brak'}
      
      To jest poważna symulacja. Uczeń musi używać oficjalnego języka (lub pół-oficjalnego w role-play).
    `);
  }, [stage, status, messages, setScreenContext]);

  // Scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  // Mic Support Check
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setIsMicSupported(false);
      }
    }
    return () => {
      stopAudio();
      stopRecognition();
    };
  }, []);

  const stopAudio = () => {
    if (audioStopRef.current) {
      audioStopRef.current();
      audioStopRef.current = null;
    }
  };

  const stopRecognition = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      recognitionRef.current = null;
    }
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

  const startExam = () => {
    setStage('warmup');
    setMessages([]);
    const intro = "Good morning. Welcome to the oral exam. I am your examiner. Let's start with some warm-up questions. Can you tell me something about your hobbies?";
    setMessages([{ role: 'ai', text: intro }]);
    speak(intro);
  };

  const processResponse = async (userText: string) => {
    if (!userText.trim()) return;
    
    stopRecognition();
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setTextInput('');
    setStatus('processing');

    try {
      let key = '';
      if (typeof process !== 'undefined' && process.env) key = process.env.API_KEY || '';
      if (!key && typeof window !== 'undefined' && (window as any).process?.env) key = (window as any).process.env.API_KEY;

      const ai = new GoogleGenAI({ apiKey: key });
      
      const prompt = `
        You are an official English Matura Examiner (CKE Poland).
        Current Stage: ${stage}
        
        TASK INFO:
        - Warmup: General questions.
        - Task 1: ${EXAM_DATA.task1.instruction} (Points to cover: ${EXAM_DATA.task1.points.join(', ')}). Role: ${EXAM_DATA.task1.aiRole}.
        - Task 2: Picture description. Image context: Group of friends laughing/talking. Questions: ${EXAM_DATA.task2.aiQuestions.join(', ')}.

        CONVERSATION HISTORY:
        ${messages.map(m => `${m.role === 'ai' ? 'Examiner' : 'Student'}: ${m.text}`).join('\n')}
        Student: ${userText}

        INSTRUCTIONS:
        1. Be professional, polite, but strictly follow the exam format.
        2. If in Warmup: Ask 1-2 follow up questions then say "Thank you. Let's move to Task 1." (Signal to change stage).
        3. If in Task 1: Play the role of Receptionist. Answer the student. When all points are covered, say "Thank you. This is the end of Task 1."
        4. If in Task 2: Listen to description. Then ask the specific questions one by one. Finally say "Thank you. The exam is over."
        5. LEVEL: B1 (Intermediate). Keep questions clear.
        
        Examiner's response:
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });

      const aiResponse = response.text || "Thank you. Let's continue.";
      setMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
      speak(aiResponse);

      // Auto-transition logic based on keywords (simple heuristic)
      if (stage === 'warmup' && aiResponse.includes("Task 1")) {
        setTimeout(() => setStage('task1_instructions'), 3000);
      } else if (stage === 'task1_chat' && aiResponse.includes("end of Task 1")) {
        setTimeout(() => setStage('task2_instructions'), 3000);
      } else if (stage === 'task2_chat' && aiResponse.includes("exam is over")) {
        setTimeout(() => setStage('feedback'), 3000);
      }

    } catch (e) {
      console.error(e);
      setError("Błąd połączenia z AI.");
      setStatus('idle');
    }
  };

  const toggleListening = () => {
    if (status === 'speaking') { stopAudio(); setStatus('idle'); return; }
    if (status === 'listening') { stopRecognition(); setStatus('idle'); return; }

    setError(null);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = true; 
      recognition.interimResults = true;

      recognition.onstart = () => setStatus('listening');
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
        }
        if (finalTranscript) setTextInput(prev => prev + finalTranscript + " ");
      };
      recognition.onerror = (e: any) => {
        console.error(e);
        stopRecognition();
        setStatus('idle');
      };
      
      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error(e);
      setStatus('idle');
    }
  };

  const handleSendText = () => processResponse(textInput);

  // --- RENDERERS ---

  const renderIntro = () => (
    <div className="h-full flex flex-col items-center justify-center text-center space-y-8 animate-fade-in">
       <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center relative border border-white/10">
          <GraduationCap size={64} className="text-white"/>
       </div>
       <div className="max-w-md">
         <h3 className="text-2xl font-display font-bold text-white mb-4">Egzamin Ustny (CKE)</h3>
         <p className="text-gray-400 text-sm leading-relaxed mb-8">
           Symulacja przebiega zgodnie z procedurami maturalnymi. 
           <br/>Część 1: Rozmowa wstępna.
           <br/>Część 2: Odgrywanie roli.
           <br/>Część 3: Opis ilustracji.
         </p>
         <button 
           onClick={startExam}
           className="bg-white text-black hover:bg-gray-200 px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center gap-3 mx-auto"
         >
           <Play size={20} fill="currentColor"/> Rozpocznij Egzamin
         </button>
       </div>
    </div>
  );

  const renderInstructions = (title: string, content: React.ReactNode, nextStage: ExamStage) => (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-slide-up bg-[#0F1B2D] rounded-3xl border border-white/5">
       <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-widest border-b border-white/10 pb-4 w-full">{title}</h3>
       <div className="text-gray-300 text-base mb-8 text-left w-full max-w-2xl bg-black/20 p-6 rounded-xl border border-white/5">
         {content}
       </div>
       <button 
         onClick={() => { setStage(nextStage); }}
         className="bg-matura-accent text-matura-bg px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-yellow-400 transition-colors"
       >
         Rozumiem, zaczynajmy <ChevronRight size={20}/>
       </button>
    </div>
  );

  const renderChat = () => (
    <div className="flex flex-col h-full">
      {/* Top Bar showing context */}
      {stage.includes('task1') && (
        <div className="bg-[#112240] p-4 rounded-t-3xl border-b border-white/5 flex justify-between items-center text-xs text-gray-400">
           <span><strong>Zadanie:</strong> Recepcja w hostelu</span>
           <div className="flex gap-2">
             {EXAM_DATA.task1.points.map((_, i) => <div key={i} className="w-2 h-2 rounded-full bg-white/20"></div>)}
           </div>
        </div>
      )}
      {stage.includes('task2') && (
        <div className="bg-[#112240] p-2 rounded-t-3xl border-b border-white/5 h-48 flex-shrink-0 relative overflow-hidden group">
           <img src={EXAM_DATA.task2.imageUrl} alt="Exam Task" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"/>
           <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-[10px] text-white font-bold backdrop-blur-sm">Zadanie 2: Opisz obrazek</div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#0A1628]">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-slide-up`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'ai' ? 'bg-white text-black' : 'bg-white/10 text-white'}`}>
              {msg.role === 'ai' ? <Bot size={16}/> : <User size={16}/>}
            </div>
            <div className={`p-3 rounded-2xl text-sm leading-relaxed max-w-[85%] ${msg.role === 'ai' ? 'bg-[#1e293b] text-white border border-white/10' : 'bg-blue-600 text-white'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        {status === 'processing' && (
           <div className="flex gap-3">
             <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center"><Bot size={16}/></div>
             <div className="bg-[#1e293b] p-3 rounded-2xl flex items-center gap-2 text-gray-400 text-xs border border-white/10">
               <Loader2 size={14} className="animate-spin"/> Egzaminator ocenia...
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Controls */}
      <div className="p-4 bg-[#0F1B2D] rounded-b-3xl border-t border-white/5">
         <div className="flex items-end gap-2">
            <div className={`flex-1 bg-[#0A1628] rounded-xl border flex items-center px-3 py-2 relative transition-all ${status === 'listening' ? 'border-red-500/50' : 'border-white/10'}`}>
               <input
                 type="text"
                 value={textInput}
                 onChange={(e) => setTextInput(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
                 disabled={status === 'processing' || status === 'speaking'}
                 placeholder={status === 'listening' ? "Słucham..." : "Twoja odpowiedź..."}
                 className="flex-1 bg-transparent border-none outline-none text-white text-sm h-10"
               />
               {status === 'listening' && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse absolute right-3"></div>}
            </div>
            
            {isMicSupported && (
              <button onClick={toggleListening} disabled={status === 'processing'} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${status === 'listening' ? 'bg-red-500 text-white' : status === 'speaking' ? 'bg-yellow-500 text-black' : 'bg-[#1e293b] text-gray-400 hover:text-white'}`}>
                {status === 'listening' ? <Square size={18} fill="currentColor"/> : status === 'speaking' ? <Volume2 size={20}/> : <Mic size={20}/>}
              </button>
            )}
            
            <button onClick={handleSendText} disabled={!textInput || status === 'processing'} className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-500 transition-all disabled:opacity-50">
              <Send size={20}/>
            </button>
         </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto p-4 md:p-6 animate-fade-in">
      <div className="flex-1 bg-[#0A1628] rounded-3xl border border-white/5 shadow-2xl overflow-hidden relative">
        
        {stage === 'intro' && renderIntro()}
        
        {stage === 'warmup' && renderChat()}
        
        {stage === 'task1_instructions' && renderInstructions(
          EXAM_DATA.task1.title,
          <div className="space-y-4">
            <p className="font-bold">{EXAM_DATA.task1.instruction}</p>
            <ul className="list-disc pl-5 space-y-2 text-sm text-gray-400">
              {EXAM_DATA.task1.points.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          </div>,
          'task1_chat'
        )}
        
        {stage === 'task1_chat' && renderChat()}
        
        {stage === 'task2_instructions' && renderInstructions(
          EXAM_DATA.task2.title,
          <div className="flex flex-col items-center gap-6">
            <p>{EXAM_DATA.task2.instruction}</p>
            <div className="w-full max-w-sm rounded-xl overflow-hidden border border-white/20">
               <img src={EXAM_DATA.task2.imageUrl} alt="Exam Task" className="w-full h-auto"/>
            </div>
          </div>,
          'task2_chat'
        )}
        
        {stage === 'task2_chat' && renderChat()}

        {stage === 'feedback' && (
           <div className="h-full flex flex-col items-center justify-center text-center space-y-6 animate-fade-in p-8">
              <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mb-4">
                <GraduationCap size={48}/>
              </div>
              <h2 className="text-3xl font-bold text-white">Egzamin Zakończony</h2>
              <p className="text-gray-400 max-w-md">Egzaminator zakończył sesję. Możesz przejrzeć historię rozmowy lub spróbować ponownie.</p>
              <button onClick={() => { setStage('intro'); setMessages([]); }} className="text-sm text-white underline hover:text-gray-300">Wróć do menu</button>
           </div>
        )}

      </div>
    </div>
  );
};

export default Speaking;
