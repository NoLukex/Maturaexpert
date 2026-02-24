
import { FC, useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  List,
  HelpCircle,
  ArrowRight,
  PanelLeftClose,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Loader2,
  RotateCcw
} from 'lucide-react';
import { addXP, saveTaskResult, getStats, saveMistake, playFeedbackSound } from '../services/storageService';
import { useChatContext } from '../contexts/ChatContext';
import { getCompletion } from '../services/geminiService';

// --- TYPES ---
type ReadingTaskType = 'matching_headings' | 'choice' | 'gapped_text' | 'matching_info' | 'lexical_choice';

interface ReadingQuestion {
  id: number;
  text?: string;
  options?: string[];
  correctAnswer: string | number;
}

interface ReadingPart {
  id?: number;
  text: string;
}

interface ReadingTask {
  id: string;
  title: string;
  type: ReadingTaskType;
  instruction: string;
  content?: string;
  parts?: ReadingPart[];
  extraOptions?: string[];
  questions: ReadingQuestion[];
}

// --- DATA ---
const READING_TASKS: ReadingTask[] = [
  {
    id: 'r1',
    title: 'Zadanie 1. Niezwykłe Hotele',
    type: 'matching_headings',
    instruction: 'Przeczytaj tekst. Dobierz właściwy nagłówek (A-E) do każdego akapitu (1-4). Jeden nagłówek został podany dodatkowo i nie pasuje do żadnego akapitu.',
    extraOptions: [
      'A. SLEEPING UNDER THE WATER',
      'B. A CHILLY EXPERIENCE',
      'C. BREAKFAST WITH WILD ANIMALS',
      'D. HIGH UP IN THE TREES',
      'E. A NIGHT BEHIND BARS'
    ],
    parts: [
      { id: 1, text: "If you are an animal lover looking for a unique adventure, Giraffe Manor in Kenya is the place to be. Set in 12 acres of private land within 140 acres of indigenous forest, this exclusive boutique hotel is famous for its resident herd of Rothschild's giraffes. The most fascinating thing about this location is that these gentle giants often visit morning and evening, poking their long necks into the windows in the hope of a treat, before retreating to their forest sanctuary. Guests can enjoy their morning coffee while sharing a moment with the tallest mammals on Earth." },
      { id: 2, text: "For those who don't mind the cold, the Icehotel in Jukkasjärvi, Sweden, offers a once-in-a-lifetime experience. Rebuilt every winter from fresh snow and ice from the Torne River, the hotel is a constantly changing art exhibition. The temperature inside is kept at a constant -5 to -8 degrees Celsius. Guests sleep in thermal sleeping bags on beds built of ice, covered with reindeer hides. In the morning, you are woken up with a cup of hot lingonberry juice. It is truly a magical, albeit freezing, winter wonderland." },
      { id: 3, text: "Have you ever dreamed of living like a bird? The Free Spirit Spheres in Vancouver Island, Canada, make this dream a reality. These spherical treehouses are suspended in the coastal rainforest, attached to trees with ropes. Accessed by spiral staircases and steel bridges, the spheres sway gently with the wind and the movement of the trees, creating a soothing, natural rocking motion. It provides a perfect escape from the busy city life, allowing you to connect with nature from a completely new perspective." },
      { id: 4, text: "The Conrad Maldives Rangali Island resort takes luxury to a new depth with 'The Muraka', a two-level residence with a master bedroom submerged over 16 feet below sea level in the Indian Ocean. The bedroom features a 180-degree curved acrylic dome, offering floor-to-ceiling views of the vibrant marine life. You can fall asleep watching sharks, stingrays, and colourful tropical fish swimming directly above your head. While the price tag is hefty, the experience of living in a personal aquarium is unmatched." }
    ],
    questions: [
      { id: 1, correctAnswer: 'C' },
      { id: 2, correctAnswer: 'B' },
      { id: 3, correctAnswer: 'D' },
      { id: 4, correctAnswer: 'A' }
    ]
  },
  {
    id: 'r2',
    title: 'Zadanie 2. The Unlucky Traveller',
    type: 'choice',
    instruction: 'Przeczytaj tekst. Z podanych odpowiedzi wybierz właściwą, zgodną z treścią tekstu.',
    content: `
      It was supposed to be the trip of a lifetime. Mark had been saving money for three years to travel across South America. He had planned everything down to the last detail: the flights, the hostels, the bus routes, and even the restaurants he wanted to visit. On a sunny Tuesday morning, he packed his backpack, double-checked his passport, and headed to the airport with a wide smile on his face.

      The first week went smoothly. He explored the bustling streets of Bogota and hiked in the Cocora Valley. However, things took a turn for the worse when he arrived in Quito. He decided to take a night bus to the coast. He had heard stories about petty theft, so he was careful. He kept his small bag with valuables on his lap and wrapped the strap around his arm. Exhausted from the hiking, he eventually drifted off to sleep.

      When Mark woke up, the bus was stationary. Sunlight was streaming through the window. He stretched his arms and looked down at his lap. His heart skipped a beat. The bag was gone. Panic seized him. He looked around frantically, checking under the seat, in the overhead compartment, but it was nowhere to be found. His passport, his camera, and most of his cash were in that bag. 
      
      He rushed to the bus driver, who simply shrugged and said in Spanish that he hadn't seen anything. Mark felt tears stinging his eyes. He was alone in a foreign country with no money and no identification. He remembered his mother's advice to keep a digital copy of his passport in his email, which was his only saving grace. 

      He spent the next three days at the embassy, filling out forms and waiting. It was a nightmare, but during this time, he met a group of fellow travellers who had experienced similar misfortunes. They shared food with him and even offered him a place to stay in their rented apartment. 
      
      Mark realized that while he had lost his material possessions, he had found something equally valuable: human kindness. He didn't return home. Once his emergency passport was ready, he called his parents, asked for a small loan, and continued his journey, albeit with much less luggage and a lot more caution.
    `,
    questions: [
      { id: 1, text: 'What is true about Mark\'s trip preparation?', options: ['A. He decided to go on a spontaneous trip without plans.', 'B. He spent a long time planning and saving for it.', 'C. He borrowed money from his parents before leaving.'], correctAnswer: 1 },
      { id: 2, text: 'How did Mark lose his bag?', options: ['A. Someone snatched it while he was walking.', 'B. He forgot it at the bus station.', 'C. It was stolen while he was sleeping on a bus.'], correctAnswer: 2 },
      { id: 3, text: 'What helped Mark in this difficult situation?', options: ['A. He had a digital copy of his documents.', 'B. The bus driver helped him find the thief.', 'C. He found his passport under the seat.'], correctAnswer: 0 },
      { id: 4, text: 'What was the positive outcome of this event?', options: ['A. He got all his money back from insurance.', 'B. He experienced kindness from strangers.', 'C. He decided to go back home immediately.'], correctAnswer: 1 }
    ]
  }
];

const Reading: FC = () => {
  const [tasks, setTasks] = useState(READING_TASKS);
  const [activeTaskId, setActiveTaskId] = useState(READING_TASKS[0].id);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [fontSize, setFontSize] = useState<number>(18);
  const [isBankExpanded, setIsBankExpanded] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const { setScreenContext } = useChatContext();

  useEffect(() => {
    const stats = getStats();
    const completedTasks: Record<string, boolean> = {};
    stats.history.forEach(entry => {
      if (entry.module === 'reading') completedTasks[entry.taskId] = true;
    });
    setSubmitted(completedTasks);
  }, []);

  const activeTask = tasks.find(t => t.id === activeTaskId) || tasks[0];

  useEffect(() => {
    if (activeTask) {
      const textContent = activeTask.content || activeTask.parts?.map(p => `[Part ${p.id}] ${p.text}`).join('\n') || '';
      setScreenContext(`
        MODUŁ: CZYTANIE
        Tytuł: ${activeTask.title}
        Polecenie: ${activeTask.instruction}
        Tekst: "${textContent.substring(0, 1000)}..."
      `);
    }
  }, [activeTask, setScreenContext]);

  const handleAnswer = (qId: number, value: string | number) => {
    if (submitted[activeTaskId]) return;
    setAnswers(prev => ({ ...prev, [`${activeTaskId}-${qId}`]: value }));
  };

  const checkAnswers = () => {
    setSubmitted(prev => ({ ...prev, [activeTaskId]: true }));
    let correctCount = 0;
    activeTask.questions.forEach(q => {
      const userAns = answers[`${activeTaskId}-${q.id}`];
      if (userAns === q.correctAnswer) correctCount++;
      else saveMistake('reading', q.text || `Pytanie ${q.id}`, String(userAns || "(brak)"), String(q.correctAnswer), activeTask.title);
    });
    playFeedbackSound(correctCount === activeTask.questions.length ? 'success' : 'error');
    saveTaskResult('reading', correctCount, activeTask.questions.length, activeTask.id);
  };

  const retryTask = () => {
    setSubmitted(prev => ({ ...prev, [activeTaskId]: false }));
    setAnswers(prev => {
      const next = { ...prev };
      activeTask.questions.forEach(q => {
        delete next[`${activeTaskId}-${q.id}`];
      });
      return next;
    });
  };

  const generateAiReadingTask = async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      const topics = ["Technology", "Travel", "Environment", "School", "Culture", "Health", "Science", "Sport"];
      const topic = topics[Math.floor(Math.random() * topics.length)];
      const prompt = `
        Jesteś EKSPERTEM CKE (Centralna Komisja Egzaminacyjna). Stwórz TRUDNE zadanie typu Reading (Poziom B1/B1+).
        TEMAT ARTYKUŁU: "${topic}"

        ZASADY TWORZENIA TEKSTU:
        1. Długość: 250-300 słów.
        2. Styl: Artykuł z magazynu młodzieżowego lub wpis na blogu podróżniczym.
        3. Użyj zaawansowanego słownictwa (np. "breathtaking", "challenging", "despite", "however").

        ZASADY TWORZENIA PYTAŃ (4 pytania):
        1. Pytania NIE MOGĄ być "słowo w słowo" z tekstem. Używaj synonimów!
        2. DYSTRAKTORY: Błędne odpowiedzi muszą wyglądać na poprawne (np. pojawia się to słowo w tekście, ale w innym kontekście).

        PRZYKŁAD "PUŁAPKI":
        Tekst: "I wanted to buy the red shirt but it was too expensive, so I got the blue one."
        Pytanie: "Which shirt did he buy?"
        A. The red one. (ŹLE - jest w tekście, ale nie kupił)
        B. The expensive one. (ŹLE)
        C. The blue one. (DOBRZE)

        Zwróć CZYSTY JSON:
        {
          "title": "Chwytliwy tytuł (np. 5 Reasons to Visit ${topic})",
          "content": "Pełna treść tekstu...",
          "questions": [
            { 
              "id": 1, 
              "text": "Pytanie wymagające zrozumienia sensu, nie tylko słów.", 
              "options": ["A. Dystraktor 1", "B. Poprawna", "C. Dystraktor 2"], 
              "correctAnswer": 1
            }
          ]
        }
        UWAGA: correctAnswer to LICZBA (indeks tablicy options: 0=A, 1=B, 2=C).
      `;

      const jsonText = await getCompletion(prompt, true);
      const data = JSON.parse(jsonText || '{}');

      if (data.content && data.questions) {
        const newId = `ai-reading-${Date.now()}`;
        const newTask: ReadingTask = {
          id: newId,
          title: data.title || `AI: ${topic}`,
          type: 'choice',
          instruction: 'Przeczytaj i odpowiedz.',
          content: data.content,
          questions: data.questions
        };
        setTasks(prev => [...prev, newTask]);
        setActiveTaskId(newId);
        setIsSidebarOpen(false);
      }
    } catch (e) {
      console.error(e);
      alert("Błąd generowania przez NVIDIA NIM.");
    } finally {
      setIsGenerating(false);
    }
  };

  const renderLeftPanelContent = () => {
    const textStyle = { fontSize: `${fontSize}px`, lineHeight: '1.8', color: '#E2E8F0', fontFamily: 'serif' };
    if (activeTask.parts) {
      return (
        <div className="space-y-8">
          {activeTask.parts.map((part) => (
            <div key={part.id} className="relative group">
              <div className="flex items-center gap-3 mb-2 sticky top-0 bg-[#1e293b]/95 py-2 z-10 border-b border-white/5">
                <div className="w-8 h-8 rounded-lg bg-matura-accent text-matura-bg flex items-center justify-center font-bold text-sm">{activeTask.type === 'matching_info' ? ['A', 'B', 'C'][part.id! - 1] : part.id}</div>
                <span className="text-xs font-bold text-gray-400 uppercase">Tekst</span>
              </div>
              <p style={textStyle} className="text-justify">{part.text}</p>
            </div>
          ))}
        </div>
      );
    }
    if (activeTask.content) {
      return <div style={textStyle} className="text-justify whitespace-pre-line">{activeTask.content}</div>;
    }
    return null;
  };

  return (
    <div className="flex h-full bg-[#050B14] overflow-hidden">
      <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-[#0A1628] border-r border-white/10 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 border-b border-white/5 flex items-center justify-between"><h3 className="text-sm font-bold text-white uppercase tracking-widest">Wybierz tekst</h3><button onClick={() => setIsSidebarOpen(false)}><PanelLeftClose /></button></div>
        <div className="p-4 border-b border-white/5"><button onClick={generateAiReadingTask} disabled={isGenerating} className="w-full py-3 bg-matura-accent text-matura-bg font-bold rounded-xl flex items-center justify-center gap-2">{isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles />} {isGenerating ? 'Generuję...' : 'Nowy Tekst (NVIDIA AI)'}</button></div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {tasks.map((task, idx) => (
            <button key={task.id} onClick={() => { setActiveTaskId(task.id); setIsSidebarOpen(false); }} className={`w-full text-left p-4 rounded-xl border ${activeTaskId === task.id ? 'bg-matura-accent text-matura-bg' : 'bg-[#112240] text-gray-400 border-transparent'}`}>
              <div className="truncate text-sm font-bold">{task.title}</div>
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 flex flex-col h-full bg-[#050B14]">
        <header className="h-16 flex items-center justify-between px-4 border-b border-white/5 bg-[#0A1628]">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2.5 rounded-lg bg-[#162335] text-gray-300 flex items-center gap-2"><List size={18} /> <span className="hidden md:inline text-xs font-bold">Zmień tekst</span></button>
          <div className="flex items-center gap-3">
            {!submitted[activeTaskId] ? <button onClick={checkAnswers} className="px-5 py-2.5 bg-matura-accent text-matura-bg font-bold rounded-lg text-sm">Sprawdź</button> : <div className="flex items-center gap-2"><button onClick={retryTask} className="px-5 py-2.5 bg-blue-600/20 border border-blue-500/40 text-blue-200 font-bold rounded-lg text-sm flex items-center gap-2"><RotateCcw size={16} /> Powtórz</button><button onClick={() => { const idx = tasks.findIndex(t => t.id === activeTaskId); if (idx < tasks.length - 1) setActiveTaskId(tasks[idx + 1].id); else generateAiReadingTask(); }} className="px-5 py-2.5 bg-green-600 text-white font-bold rounded-lg text-sm flex items-center gap-2">Następne <ArrowRight size={18} /></button></div>}
          </div>
        </header>
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          <div className="lg:w-3/5 h-1/2 lg:h-full bg-[#1e293b] overflow-y-auto p-6 md:p-12 border-r border-black/20"><div className="max-w-3xl mx-auto">{renderLeftPanelContent()}</div></div>
          <div className="lg:w-2/5 h-1/2 lg:h-full bg-[#0A1628] overflow-y-auto p-5 md:p-8">
            <div className="max-w-xl mx-auto space-y-6">
              {activeTask.questions.map((q) => {
                const userAnswer = answers[`${activeTask.id}-${q.id}`];
                const options = q.options || (activeTask.type === 'matching_info' ? ['A', 'B', 'C'] : ['A', 'B', 'C', 'D']);
                return (
                  <div key={q.id} className="bg-[#0f1926] p-5 rounded-2xl border border-white/5">
                    <p className="mb-4 font-medium text-white">{q.text || `Pytanie ${q.id}`}</p>
                    <div className="flex flex-col gap-2">
                      {options.map((opt, idx) => (
                        <button key={idx} disabled={submitted[activeTaskId]} onClick={() => handleAnswer(q.id, q.options ? idx : opt)} className={`p-3 rounded-lg border text-sm text-left ${userAnswer === (q.options ? idx : opt) ? 'bg-blue-600' : 'bg-[#162335]'}`}>{opt}</button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Reading;
