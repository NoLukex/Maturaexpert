
import { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, Sparkles, User, Loader2, Eye } from 'lucide-react';
import { ViewState } from '../types';
import { useChatContext } from '../contexts/ChatContext';
import { getChatCompletion } from '../services/geminiService';

interface ChatAssistantProps {
  currentView: ViewState;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ currentView }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 'init', role: 'assistant', text: 'Siema Mateusz! Widzę co robisz. Jak mogę Ci pomóc w nauce?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { screenContext } = useChatContext();

  const contextContains = (context: string, keywords: string[]) => {
    const normalized = context.toLowerCase();
    return keywords.some((keyword) => normalized.includes(keyword.toLowerCase()));
  };

  const getSystemInstruction = (context: string) => {
    let contextFocus = '';

    if (contextContains(context, ['Vocabulary', 'SLOWNICTWO', 'vocabulary'])) {
      contextFocus = 'Skup się na słownictwie. Jeśli Mateusz zapyta o słówko, podaj definicję, wymowę (zapis uproszczony) i 2 przykłady użycia: jeden z Mustangiem/siłownią, drugi typowo maturalny.';
    } else if (contextContains(context, ['Grammar', 'GRAMATYKA', 'grammar'])) {
      contextFocus = 'Jesteś w trybie Gramatyki. Wyjaśniaj reguły krótko, używaj tabel tekstowych lub list. Zwracaj uwagę na najczęstsze błędy maturalne (np. present perfect vs past simple).';
    } else if (contextContains(context, ['Writing', 'WYPOWIEDZ PISEMNA', 'Pisanie', 'writing'])) {
      contextFocus = 'Pomagasz w pisaniu wypracowań. Oceniaj strukturę (wstęp, rozwinięcie, zakończenie) i limity słów. Podpowiadaj "fancy words", które podbiją punktację za zakres środków językowych.';
    } else if (contextContains(context, ['Speaking', 'MATURA USTNA', 'MOWIENIE', 'speaking'])) {
      contextFocus = 'Przygotowujesz do matury ustnej. Podawaj przydatne frazy do opisania obrazka lub prowadzenia rozmowy z odgrywaniem roli.';
    } else if (contextContains(context, ['Reading', 'CZYTANIE', 'reading'])) {
      contextFocus = 'Pomagasz w zadaniach czytania: podpowiadaj strategie szukania synonimow i znaczenia z kontekstu, ale nie podawaj gotowej odpowiedzi.';
    } else if (contextContains(context, ['Listening', 'SLUCHANIE', 'listening'])) {
      contextFocus = 'Pomagasz w zadaniach sluchania: wskazuj slowa-klucze i parafrazy, ale nie podawaj gotowej odpowiedzi bez prosby o wyjasnienie.';
    } else if (contextContains(context, ['EGZAMIN', 'exam'])) {
      contextFocus = 'To tryb egzaminacyjny. Skup sie na strategii i podpowiedziach, bez gotowych odpowiedzi.';
    }

    return `
      Jesteś OSOBISTYM TRENEREM JĘZYKOWYM (NVIDIA AI Coach) dla Mateusza Wiśniewskiego.
      Twój cel: Zdać maturę podstawową z angielskiego na 100% i zaimponować Hani.

      BIO UCZNIA:
      - Imię: Mateusz. Szkoła: Technikum Budowlane.
      - Pasje: Siłownia (klata z Krystianem), Mustang wujka, Hania (crush).

      TWOJA OSOBOWOŚĆ:
      1. 🧠 MĄDRY LUZAK: "Byczku", "Lecimy z tematem", "Bicepsy rosną od wiedzy".
      2. 🤖 STRICT GRAMMAR: Poprawiasz błędy NATYCHMIAST.
      3. 🎯 KONKRET: Bez lania wody.

      AKTUALNY KONTEKST EKRANU: ${context || 'Dashboard'}
      ${contextFocus}

      ZASADY:
      - Odpowiadaj po Polsku.
      - Używaj emoji (🔥, 💪, 🏎️).
      - ZAWSZE poprawiaj błędy językowe Mateusza w jego wiadomościach.
    `;
  };

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: inputText };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const history = messages.map(msg => ({
        role: msg.role,
        content: msg.text
      }));

      const botText = await getChatCompletion(
        getSystemInstruction(screenContext),
        history,
        `[KONTEKST EKRANU]: ${screenContext || "Dashboard"}\n\n[PYTANIE]: ${userMsg.text}`
      );

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: botText || "Sory byczku, coś mi przerwało łącze."
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error: unknown) {
      console.error("Chat error", error);
      const errorMsg = error instanceof Error ? error.message : 'Brak polaczenia z AI.';
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        text: `${errorMsg} Lecimy dalej offline: moge pomoc strategia, tlumaczeniem i wyjasnieniem zasad.`
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
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 border-2 border-white/10 ${isOpen ? 'bg-red-500 text-white rotate-90' : 'bg-matura-accent text-matura-bg'
          }`}
      >
        {isOpen ? <X size={28} /> : <Bot size={28} />}
      </button>

      <div
        className={`fixed bottom-24 right-6 z-50 w-80 md:w-96 bg-[#112240] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 origin-bottom-right ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-10 pointer-events-none'
          }`}
        style={{ maxHeight: 'calc(100vh - 120px)', height: '500px' }}
      >
        <div className="bg-[#0A1628] p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-matura-accent flex items-center justify-center text-matura-bg relative">
              <Sparkles size={16} />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0A1628]" title="AI widzi Twój ekran"></div>
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">NVIDIA AI Tutor</h3>
              <p className="text-[10px] text-green-400 font-bold flex items-center gap-1">
                <Eye size={10} /> {screenContext ? 'Widzę zadanie' : 'Czuwam'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#0F1B2D]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-white/10 text-white' : 'bg-matura-accent/20 text-matura-accent'
                }`}>
                {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
              </div>

              <div className={`p-3 rounded-2xl text-sm leading-relaxed max-w-[80%] ${msg.role === 'user'
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
                <Bot size={14} />
              </div>
              <div className="bg-[#1e293b] p-3 rounded-2xl rounded-tl-none border border-white/5 flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-matura-accent" />
                <span className="text-xs text-gray-400">NVIDIA NIM analizuje...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 bg-[#0A1628] border-t border-white/10">
          <div className="relative flex items-center">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Zapytaj NVIDIA AI o angielski..."
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
