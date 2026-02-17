
import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, Sparkles, User, Loader2, Eye } from 'lucide-react';
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { ViewState } from '../types';
import { useChatContext } from '../contexts/ChatContext';

interface ChatAssistantProps {
  currentView: ViewState;
}

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ currentView }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 'init', role: 'model', text: 'Siema Mateusz! Widzę co robisz. Jak mogę Ci pomóc w nauce?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { screenContext } = useChatContext();
  const [chatSession, setChatSession] = useState<Chat | null>(null);

  // Initialize Chat Session based on View
  useEffect(() => {
    const initChat = async () => {
      try {
        let key = '';
        if (typeof process !== 'undefined' && process.env) key = process.env.API_KEY || '';
        if (!key && typeof window !== 'undefined' && (window as any).process?.env) key = (window as any).process.env.API_KEY;
        
        const ai = new GoogleGenAI({ apiKey: key || 'dummy_key' });

        const systemInstruction = `
          Jesteś wirtualnym nauczycielem języka angielskiego (poziom Matura Podstawowa). 
          Twój uczeń to MATEUSZ WIŚNIEWSKI.
          
          BIO UCZNIA (WAŻNE - UŻYWAJ TEGO DO TWORZENIA PRZYKŁADÓW I RELACJI):
          - Szkoła: Klasa maturalna, Technikum Budowlane.
          - Zainteresowania: Chodzi na siłownię, kiedyś grał dużo w Fortnite (ale już nie), lubi nosić spodnie rurki.
          - Relacje (Obecne): Podoba mu się dziewczyna o imieniu HANIA. Najlepszy przyjaciel to KRYSTIAN.
          - Relacje (Przeszłe): W podstawówce chodził z Sarą i Oliwią. Simpował do Klaudii. Podobała mu się Gosia.
          - Rodzina: Jego wujek ma Mustanga.
          
          TWOJA OSOBOWOŚĆ:
          - Jesteś luzakiem, ale zależy Ci na jego maturze.
          - Używasz wiedzy o nim, żeby tłumaczyć angielski (np. "Imagine driving your uncle's Mustang..." albo "Sentence for Hania: You look beautiful").
          - Czasem możesz zażartować z jego rurek albo przeszłości w Fortnite.
          
          ZASADA NR 1: Odpowiadaj krótko i konkretnie.
          ZASADA NR 2: Zawsze odpowiadaj po POLSKU, chyba że podajesz przykłady po angielsku lub uczeń poprosi inaczej.
          ZASADA NR 3: Będziesz otrzymywał kontekst tego, co uczeń widzi na ekranie (treść zadania, tekst, fiszkę). Używaj tej wiedzy, aby pomagać w KONKRETNYM zadaniu.
          ZASADA NR 4: Nie podawaj od razu gotowych odpowiedzi do zadań testowych. Naprowadzaj ucznia.
          
          Bądź miły, cierpliwy i używaj emoji. Traktuj Mateusza jak kumpla.
        `;

        const chat = ai.chats.create({
          model: 'gemini-3-flash-preview',
          config: {
            systemInstruction: systemInstruction,
          }
        });
        
        setChatSession(chat);
      } catch (e) {
        console.error("Failed to init chat", e);
      }
    };

    initChat();
  }, [currentView]); // Re-init on module change to clear context if needed, though single session is also fine.

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!inputText.trim() || !chatSession) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: inputText };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      // Inject screen context invisibly into the prompt
      const promptWithContext = `
[KONTEKST EKRANU MATEUSZA]:
${screenContext || "Brak konkretnego zadania na ekranie (Dashboard lub menu)."}

[PYTANIE MATEUSZA]:
${userMsg.text}
      `;

      const result: GenerateContentResponse = await chatSession.sendMessage({ message: promptWithContext });
      const botMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        text: result.text || "Sory byczku, coś mi przerwało łącze. Powtórzysz?" 
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("Chat error", error);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'model', 
        text: "Wystąpił błąd połączenia z AI. Sprawdź klucz API." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 border-2 border-white/10 ${
          isOpen ? 'bg-red-500 text-white rotate-90' : 'bg-matura-accent text-matura-bg'
        }`}
      >
        {isOpen ? <X size={28} /> : <Bot size={28} />}
      </button>

      {/* Chat Window */}
      <div 
        className={`fixed bottom-24 right-6 z-50 w-80 md:w-96 bg-[#112240] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 origin-bottom-right ${
          isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-10 pointer-events-none'
        }`}
        style={{ maxHeight: 'calc(100vh - 120px)', height: '500px' }}
      >
        {/* Header */}
        <div className="bg-[#0A1628] p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-matura-accent flex items-center justify-center text-matura-bg relative">
              <Sparkles size={16} />
              {/* Context Indicator */}
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0A1628]" title="AI widzi Twój ekran"></div>
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">AI Tutor (Dla Mateusza)</h3>
              <p className="text-[10px] text-green-400 font-bold flex items-center gap-1">
                <Eye size={10}/> {screenContext ? 'Widzę zadanie' : 'Czuwam'}
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#0F1B2D]">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                msg.role === 'user' ? 'bg-white/10 text-white' : 'bg-matura-accent/20 text-matura-accent'
              }`}>
                {msg.role === 'user' ? <User size={14}/> : <Bot size={14}/>}
              </div>
              
              <div className={`p-3 rounded-2xl text-sm leading-relaxed max-w-[80%] ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-[#1e293b] text-gray-200 rounded-tl-none border border-white/5'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
               <div className="w-8 h-8 rounded-full bg-matura-accent/20 text-matura-accent flex items-center justify-center">
                 <Bot size={14}/>
               </div>
               <div className="bg-[#1e293b] p-3 rounded-2xl rounded-tl-none border border-white/5 flex items-center gap-2">
                 <Loader2 size={14} className="animate-spin text-matura-accent"/>
                 <span className="text-xs text-gray-400">Analizuję...</span>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 bg-[#0A1628] border-t border-white/10">
          <div className="relative flex items-center">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Zapytaj o gramatykę, słówka..."
              className="w-full bg-[#112240] border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-matura-accent focus:ring-1 focus:ring-matura-accent/50 placeholder-gray-600"
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !inputText.trim()}
              className="absolute right-2 p-2 bg-matura-accent text-matura-bg rounded-lg hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatAssistant;
