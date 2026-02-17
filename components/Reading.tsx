
import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  List, 
  HelpCircle,
  ArrowRight,
  PanelLeftClose,
  Type,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Loader2
} from 'lucide-react';
import { addXP, saveTaskResult, getStats, saveMistake } from '../services/storageService';
import { useChatContext } from '../contexts/ChatContext';
import { GoogleGenAI } from "@google/genai";

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

// --- DATA (FULL LENGTH TEXTS) ---

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
      { 
        id: 1, 
        text: 'What is true about Mark\'s trip preparation?', 
        options: ['A. He decided to go on a spontaneous trip without plans.', 'B. He spent a long time planning and saving for it.', 'C. He borrowed money from his parents before leaving.'], 
        correctAnswer: 1 
      },
      { 
        id: 2, 
        text: 'How did Mark lose his bag?', 
        options: ['A. Someone snatched it while he was walking.', 'B. He forgot it at the bus station.', 'C. It was stolen while he was sleeping on a bus.'], 
        correctAnswer: 2 
      },
      { 
        id: 3, 
        text: 'What helped Mark in this difficult situation?', 
        options: ['A. He had a digital copy of his documents.', 'B. The bus driver helped him find the thief.', 'C. He found his passport under the seat.'], 
        correctAnswer: 0 
      },
      { 
        id: 4, 
        text: 'What was the positive outcome of this event?', 
        options: ['A. He got all his money back from insurance.', 'B. He experienced kindness from strangers.', 'C. He decided to go back home immediately.'], 
        correctAnswer: 1 
      }
    ]
  },
  {
    id: 'r3',
    title: 'Zadanie 3. The History of Jeans',
    type: 'gapped_text',
    instruction: 'Przeczytaj tekst. Uzupełnij luki (1-3) zdaniami (A-E), tak aby otrzymać spójny i logiczny tekst. Dwa zdania zostały podane dodatkowo.',
    extraOptions: [
      'A. They were originally designed as workwear for gold miners.',
      'B. However, they soon became a symbol of teenage rebellion.',
      'C. Today, they come in many different colours and styles.',
      'D. Levi Strauss arrived in San Francisco with a new idea.',
      'E. Rich people refused to wear them for a long time.'
    ],
    content: `
      Jeans are arguably the most popular item of clothing in the world. Almost everyone owns a pair, but few people know their fascinating history. The story begins in the 19th century during the California Gold Rush. (1) [ ... ] The miners needed clothes that were strong, durable, and wouldn't tear easily during their hard physical labour.

      A tailor named Jacob Davis had the idea to use copper rivets to strengthen the pockets of pants. He didn't have the money to patent his idea, so he partnered with a businessman named Levi Strauss. Together, they patented the design in 1873, and the blue jean was born. For decades, jeans were worn only by workers, cowboys, and farmers.

      Everything changed in the 1950s. Hollywood movies started showing popular actors like James Dean and Marlon Brando wearing jeans. (2) [ ... ] Schools in the US even banned students from wearing them. This, of course, only made them more popular among young people who wanted to look cool and independent.

      By the 1970s and 80s, jeans had become mainstream fashion. Designers started creating their own expensive versions. (3) [ ... ] From skinny to baggy, from dark blue to acid wash, jeans have evolved from a practical necessity to a global fashion staple found in wardrobes from Tokyo to Toronto.
    `,
    questions: [
      { id: 1, correctAnswer: 'A' },
      { id: 2, correctAnswer: 'B' },
      { id: 3, correctAnswer: 'C' }
    ]
  },
  {
    id: 'r4',
    title: 'Zadanie 4. Holiday Offers',
    type: 'matching_info',
    instruction: 'Przeczytaj oferty wakacyjne (A-C) oraz pytania (1-4). Do każdego pytania dopasuj właściwą ofertę.',
    parts: [
      { id: 1, text: "[A] MOUNTAIN ADVENTURE CAMP. Are you bored of lying on the beach? Join us for an active week in the Alps! Our programme includes rock climbing, mountain biking, and white-water rafting. Accommodation is provided in wooden cabins with no electricity, allowing you to fully disconnect and enjoy nature. Perfect for thrill-seekers aged 18-30. Breakfast and dinner included. Warning: You must be physically fit!" },
      { id: 2, text: "[B] GOLDEN SANDS RESORT. Relax and unwind in our 5-star all-inclusive hotel in Egypt. We offer three swimming pools, a private beach, and a luxury spa. Our Kids Club will take care of your children while you enjoy a massage or a cocktail by the pool. Every evening there is live music and entertainment. It is the perfect choice for families who want a stress-free holiday in the sun." },
      { id: 3, text: "[C] HISTORICAL CITY TOUR. Discover the secrets of Rome with our guided walking tours. We visit the Colosseum, the Vatican, and many hidden gems that tourists usually miss. You will stay in a small, family-run hotel in the city centre, just minutes away from the best pizza places. This offer is ideal for culture lovers who enjoy walking and learning about history. Flights are not included." }
    ],
    questions: [
      { id: 1, text: 'Which offer is best for someone who wants to learn about the past?', correctAnswer: 'C' },
      { id: 2, text: 'Which offer is suitable for parents with young children?', correctAnswer: 'B' },
      { id: 3, text: 'Which offer requires you to be in good physical condition?', correctAnswer: 'A' },
      { id: 4, text: 'Which offer provides a luxury experience with everything included?', correctAnswer: 'B' }
    ]
  },
  {
    id: 'r5',
    title: 'Zadanie 5. A Healthy Diet',
    type: 'lexical_choice',
    instruction: 'Przeczytaj tekst. Uzupełnij luki (1-4) wyrazami z ramki, aby otrzymać logiczny i gramatycznie poprawny tekst. Uwaga: słów jest więcej niż luk.',
    extraOptions: ['AVOID', 'CONTAIN', 'DIET', 'HABITS', 'HEAVY', 'SOURCE'],
    content: `
      Many people today are concerned about their weight and health. Doctors suggest that the key to a healthy life is a balanced (1) [ ... ]. 
      It is important to eat a variety of foods, including plenty of fresh fruit and vegetables.
      
      You should try to (2) [ ... ] eating too much fast food and sugary snacks, as they are high in calories and low in nutritional value. 
      Instead, choose foods that (3) [ ... ] vitamins and minerals. 
      Fish and nuts, for example, are an excellent (4) [ ... ] of healthy fats which are good for your brain.
      Remember, small changes in what you eat can make a big difference.
    `,
    questions: [
      { id: 1, correctAnswer: 'DIET' },
      { id: 2, correctAnswer: 'AVOID' },
      { id: 3, correctAnswer: 'CONTAIN' },
      { id: 4, correctAnswer: 'SOURCE' }
    ]
  },
  {
    id: 'r6',
    title: 'Zadanie 6. Digital Detox',
    type: 'choice', 
    instruction: 'Zdecyduj, czy zdania są prawdziwe (True) czy fałszywe (False) na podstawie tekstu.',
    content: `
      In a world where we are constantly connected, more and more people are choosing to go on a "digital detox". This means giving up using smartphones, computers, and social media for a certain period of time. 
      
      Last month, I decided to try it for a week. The first few days were incredibly difficult. I felt anxious without my phone and I didn't know what to do with my hands. I kept reaching for a device that wasn't there. However, by day three, something changed. I started sleeping better. I read a whole book for the first time in years. I had long conversations with my family without looking at a screen.
      
      Experts say that excessive screen time can lead to stress, sleep problems, and difficulty concentrating. My experience confirms this. Although I am now back online, I have changed my habits. I no longer take my phone to the bedroom, and I try to have at least one screen-free hour before sleep.
    `,
    questions: [
      { 
        id: 1, 
        text: 'The author found the digital detox easy from the very beginning.', 
        options: ['True', 'False'], 
        correctAnswer: 1 // False
      },
      { 
        id: 2, 
        text: 'The author noticed an improvement in their sleep quality.', 
        options: ['True', 'False'], 
        correctAnswer: 0 // True
      },
      { 
        id: 3, 
        text: 'The author has stopped using the internet completely after the experiment.', 
        options: ['True', 'False'], 
        correctAnswer: 1 // False
      }
    ]
  }
];

const Reading: React.FC = () => {
  const [tasks, setTasks] = useState(READING_TASKS);
  const [activeTaskId, setActiveTaskId] = useState(READING_TASKS[0].id);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [fontSize, setFontSize] = useState<number>(18);
  const [isBankExpanded, setIsBankExpanded] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const { setScreenContext } = useChatContext();

  // Load completion history on mount
  useEffect(() => {
    const stats = getStats();
    const completedTasks: Record<string, boolean> = {};
    
    stats.history.forEach(entry => {
      if (entry.module === 'reading') {
        completedTasks[entry.taskId] = true;
      }
    });
    setSubmitted(completedTasks);
  }, []);

  const activeTask = tasks.find(t => t.id === activeTaskId) || tasks[0];
  
  // Update AI Context
  useEffect(() => {
    if (activeTask) {
      const textContent = activeTask.content || activeTask.parts?.map(p => `[Part ${p.id}] ${p.text}`).join('\n') || '';
      
      setScreenContext(`
        MODUŁ: CZYTANIE
        Tytuł: ${activeTask.title}
        Polecenie: ${activeTask.instruction}
        
        TEKST ŹRÓDŁOWY (widoczny dla ucznia):
        "${textContent.substring(0, 3000)}"
        
        PYTANIA:
        ${activeTask.questions.map(q => `${q.id}. ${q.text || 'Dopasuj'}`).join('\n')}
        
        Jeśli uczeń pyta o tłumaczenie słówka z tekstu, podaj je. Jeśli pyta dlaczego dana odpowiedź jest poprawna, wskaż odpowiedni fragment tekstu.
      `);
    }
  }, [activeTask, setScreenContext]);

  const handleAnswer = (qId: number, value: any) => {
    if (submitted[activeTaskId]) return;
    setAnswers(prev => ({
      ...prev,
      [`${activeTaskId}-${qId}`]: value
    }));
  };

  const checkAnswers = () => {
    setSubmitted(prev => ({ ...prev, [activeTaskId]: true }));
    let correctCount = 0;
    activeTask.questions.forEach(q => {
      const userAns = answers[`${activeTaskId}-${q.id}`];
      // eslint-disable-next-line eqeqeq
      const isCorrect = userAns == q.correctAnswer;
      if (isCorrect) {
        correctCount++;
      } else {
        // SAVE MISTAKE
        // Prepare context string based on question type
        let context = activeTask.title;
        let questionText = q.text || `Pytanie ${q.id}`;
        
        // Resolve correct answer label if it's an index or option code
        let correctLabel = String(q.correctAnswer);
        if (activeTask.type === 'choice' && typeof q.correctAnswer === 'number' && q.options) {
           correctLabel = q.options[q.correctAnswer];
        }
        
        let userLabel = String(userAns || "(brak)");
        if (activeTask.type === 'choice' && typeof userAns === 'number' && q.options) {
           userLabel = q.options[userAns];
        }

        saveMistake(
          'reading',
          questionText,
          userLabel,
          correctLabel,
          context
        );
      }
    });

    // Pass the specific taskId to track completion persistence
    saveTaskResult('reading', correctCount, activeTask.questions.length, activeTask.id);
  };

  const generateAiReadingTask = async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      // Pick random topic
      const topics = ["Technology & Future", "Travel Adventure", "Healthy Lifestyle", "Environmental Issues", "School Life", "Famous Person Biography", "Part-time Jobs"];
      const topic = topics[Math.floor(Math.random() * topics.length)];

      // Use env variable safely
      let key = '';
      if (typeof process !== 'undefined' && process.env) key = process.env.API_KEY || '';
      if (!key && typeof window !== 'undefined' && (window as any).process?.env) key = (window as any).process.env.API_KEY;

      const ai = new GoogleGenAI({ apiKey: key });

      const prompt = `
        Jesteś nauczycielem angielskiego. Wygeneruj zadanie typu "Reading Comprehension" (Matura Podstawowa, poziom B1).
        
        TEMAT: ${topic}
        
        Wymagania:
        1. Tekst w języku angielskim (ok. 200-250 słów).
        2. 3 pytania zamknięte (Multiple Choice: A, B, C).
        
        Zwróć TYLKO czysty JSON w następującym formacie:
        {
          "title": "Tytuł zadania (np. Zadanie AI: Tytuł)",
          "content": "Pełna treść tekstu po angielsku...",
          "questions": [
            {
              "id": 1,
              "text": "Treść pytania po angielsku?",
              "options": ["Opcja A", "Opcja B", "Opcja C"],
              "correctAnswer": 0 (index poprawnej odpowiedzi: 0 dla A, 1 dla B, 2 dla C)
            }
          ]
        }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const data = JSON.parse(response.text || '{}');
      
      if (data.content && data.questions) {
        const newId = `ai-reading-${Date.now()}`;
        const newTask: ReadingTask = {
          id: newId,
          title: data.title || `AI: ${topic}`,
          type: 'choice',
          instruction: 'Przeczytaj tekst i zaznacz poprawne odpowiedzi.',
          content: data.content,
          questions: data.questions
        };

        setTasks(prev => [...prev, newTask]);
        setActiveTaskId(newId);
        setIsSidebarOpen(false);
      }

    } catch (e) {
      console.error("Generating reading task failed", e);
      alert("Nie udało się wygenerować zadania. Spróbuj ponownie.");
    } finally {
      setIsGenerating(false);
    }
  };

  // --- RENDERERS ---

  const renderLeftPanelContent = () => {
    const textStyle = { 
        fontSize: `${fontSize}px`, 
        lineHeight: '1.8', 
        color: '#E2E8F0',
        fontFamily: 'serif' 
    };

    // 1. TEXT PARTS (Matching Headings / Matching Info)
    if (activeTask.parts) {
      return (
        <div className="space-y-8">
          {activeTask.parts.map((part) => (
             <div key={part.id} className="relative group">
               <div className="flex items-center gap-3 mb-2 sticky top-0 bg-[#1e293b]/95 backdrop-blur py-2 z-10 border-b border-white/5">
                   <div className="w-8 h-8 rounded-lg bg-matura-accent text-matura-bg flex items-center justify-center font-bold text-sm shadow-md">
                     {activeTask.type === 'matching_info' ? ['A','B','C'][part.id!-1] : part.id}
                   </div>
                   <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Akapit / Tekst</span>
               </div>
               <p style={textStyle} className="text-justify pl-1">
                 {part.text}
               </p>
             </div>
          ))}
        </div>
      );
    }

    // 2. MONOLITHIC TEXT (Choice, Gapped)
    if (activeTask.content) {
      return (
        <div style={textStyle} className="text-justify whitespace-pre-line">
           {activeTask.content.split(/(\(\d+\) \[ \.\.\. \])/g).map((segment, i) => {
             const match = segment.match(/\((\d+)\) \[ \.\.\. \]/);
             if (match) {
                const qId = parseInt(match[1]);
                const ans = answers[`${activeTask.id}-${qId}`];
                const isSub = submitted[activeTask.id];
                const correct = activeTask.questions.find(q => q.id === qId)?.correctAnswer;

                let badgeClass = "inline-flex items-center justify-center min-w-[3rem] px-2 py-0.5 mx-1 rounded text-base font-bold align-middle border-2 transition-all shadow-sm ";
                if (isSub) {
                   badgeClass += ans == correct 
                    ? "bg-green-500/20 text-green-300 border-green-500" 
                    : "bg-red-500/20 text-red-300 border-red-500";
                } else {
                   badgeClass += ans 
                    ? "bg-blue-600 border-blue-400 text-white" 
                    : "bg-white/10 border-white/30 text-gray-300";
                }

                return (
                  <span key={i} className={badgeClass}>
                    {ans ? (ans.length > 10 ? ans.substring(0,8)+'...' : ans) : `(${qId})`}
                  </span>
                )
             }
             return <span key={i}>{segment}</span>;
           })}
        </div>
      )
    }
    return null;
  };

  const renderRightPanelContent = () => {
    return (
      <div className="space-y-6 pb-24">
        
        {/* STICKY HEADER: OPTION BANK */}
        {activeTask.extraOptions && (
          <div className="sticky top-0 z-20 -mx-5 px-5 py-3 bg-[#0A1628]/95 backdrop-blur-xl border-b border-white/10 shadow-xl transition-all">
             <div 
               className="flex items-center justify-between cursor-pointer"
               onClick={() => setIsBankExpanded(!isBankExpanded)}
             >
               <div className="text-xs font-bold text-matura-accent uppercase flex items-center gap-2">
                 <HelpCircle size={14} /> 
                 {activeTask.type === 'lexical_choice' ? 'Bank słów (kliknij aby zwinąć)' : 'Opcje do wyboru (kliknij aby zwinąć)'}
               </div>
               {isBankExpanded ? <ChevronUp size={16} className="text-gray-500"/> : <ChevronDown size={16} className="text-gray-500"/>}
             </div>
             
             {isBankExpanded && (
               <div className="mt-3 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                 {activeTask.type === 'lexical_choice' ? (
                   <div className="flex flex-wrap gap-2">
                     {activeTask.extraOptions.map((opt, i) => (
                       <div key={i} className="px-3 py-1.5 rounded-md bg-[#112240] border border-white/10 text-sm text-gray-200 font-mono shadow-sm whitespace-nowrap">
                         {opt}
                       </div>
                     ))}
                   </div>
                 ) : (
                   <div className="flex flex-col gap-2">
                     {activeTask.extraOptions.map((opt, i) => {
                       const letter = opt.charAt(0);
                       const text = opt.substring(opt.indexOf('.') + 1).trim();
                       const isLetterFormat = opt.match(/^[A-Z]\./);
                       
                       return (
                         <div key={i} className="flex gap-3 p-2 rounded-lg bg-[#112240]/50 border border-white/5 hover:bg-[#112240] transition-colors text-sm">
                           {isLetterFormat && (
                             <span className="flex-shrink-0 w-6 h-6 rounded bg-matura-accent text-matura-bg font-bold text-xs flex items-center justify-center mt-0.5">
                               {letter}
                             </span>
                           )}
                           <span className="text-gray-300 leading-snug">
                             {isLetterFormat ? text : opt}
                           </span>
                         </div>
                       );
                     })}
                   </div>
                 )}
               </div>
             )}
          </div>
        )}

        {/* QUESTIONS LIST */}
        <div className={`space-y-6 ${activeTask.extraOptions ? 'pt-2' : 'pt-4'}`}>
           {activeTask.questions.map((q) => {
             const userAnswer = answers[`${activeTask.id}-${q.id}`];
             const isSub = submitted[activeTask.id];
             const isQCorrect = userAnswer == q.correctAnswer;
             
             // Prepare Options List
             const isWordBank = activeTask.type === 'lexical_choice';
             const isMultipleChoice = activeTask.type === 'choice' && q.options;
             
             const optionsToList = isWordBank 
                ? activeTask.extraOptions! 
                : isMultipleChoice
                  ? q.options! 
                  : (activeTask.type === 'matching_info')
                    ? ['A', 'B', 'C']
                    : ['A','B','C','D','E','F'].slice(0, activeTask.extraOptions?.length || 5);

             return (
               <div key={q.id} className="bg-[#0f1926] p-5 rounded-2xl border border-white/5 shadow-md hover:border-white/10 transition-colors">
                  
                  {/* Question Text */}
                  <div className="mb-4 text-base text-gray-100 flex items-start gap-3">
                     <div className="w-7 h-7 rounded bg-[#1e293b] flex items-center justify-center text-matura-accent font-bold text-sm border border-white/10 flex-shrink-0">
                       {q.id}
                     </div>
                     <div className="pt-0.5 w-full">
                       <span className="block font-medium">{q.text || (activeTask.type === 'matching_headings' ? `Nagłówek do akapitu ${q.id}` : 'Wybierz pasujące słowo:')}</span>
                       
                       {/* Selected Answer Preview (for Matching tasks) */}
                       {userAnswer && !isWordBank && !isMultipleChoice && activeTask.extraOptions && (
                         <div className="mt-2 text-xs text-matura-accent bg-matura-accent/5 px-2 py-1.5 rounded border border-matura-accent/10 flex items-center gap-2 max-w-full">
                           <span className="font-bold bg-matura-accent text-matura-bg px-1.5 rounded-[3px] text-[10px]">{userAnswer}</span>
                           <span className="truncate opacity-80 italic">
                             {activeTask.extraOptions.find(opt => opt.startsWith(String(userAnswer)))?.substring(2).trim() || userAnswer}
                           </span>
                         </div>
                       )}
                     </div>
                  </div>

                  {/* Render Options */}
                  <div className={`
                    ${isWordBank ? 'flex flex-wrap gap-2' : ''}
                    ${isMultipleChoice ? 'flex flex-col gap-2' : ''}
                    ${!isWordBank && !isMultipleChoice ? 'grid grid-cols-5 sm:grid-cols-6 gap-2' : ''}
                  `}>
                     
                     {optionsToList.map((opt, idx) => {
                         let valueToSet: string | number = opt;
                         let label = opt;
                         
                         // Handle True/False or ABCD choice indices
                         if (isMultipleChoice) {
                            valueToSet = activeTask.title.includes('True') === false ? idx : opt; 
                         }

                         const selected = userAnswer == valueToSet;
                         
                         // Determine Button Style
                         let btnClass = "transition-all active:scale-[0.98] ";
                         
                         if (isWordBank) {
                           // WORD CHIPS
                           btnClass += `px-3 py-2 rounded-lg text-sm font-bold border whitespace-normal break-words h-auto min-h-[40px] flex items-center justify-center text-center `;
                           if (isSub) {
                              if (opt === q.correctAnswer) btnClass += "bg-green-500/20 border-green-500 text-green-400";
                              else if (selected) btnClass += "bg-red-500/20 border-red-500 text-red-400 opacity-60";
                              else btnClass += "bg-transparent border-white/5 text-gray-600";
                           } else {
                              btnClass += selected 
                                ? "bg-blue-600 border-blue-500 text-white shadow-md" 
                                : "bg-[#162335] border-white/10 text-gray-400 hover:text-white hover:border-white/30 hover:bg-[#1e2d42]";
                           }

                         } else if (isMultipleChoice) {
                           // FULL WIDTH BARS (ABCD)
                           btnClass += `w-full text-left p-3 rounded-lg border text-sm flex items-center gap-3 `;
                           if (isSub) {
                              if (valueToSet == q.correctAnswer) btnClass += "bg-green-500/20 border-green-500 text-green-400 font-bold";
                              else if (selected) btnClass += "bg-red-500/20 border-red-500 text-red-400";
                              else btnClass += "bg-transparent border-white/5 opacity-40";
                           } else {
                              btnClass += selected 
                                ? "bg-blue-600 border-blue-500 text-white shadow" 
                                : "bg-[#162335] border-white/10 text-gray-300 hover:bg-white/5 hover:text-white";
                           }

                         } else {
                           // SQUARE LETTERS (Matching)
                           btnClass += `aspect-square rounded-lg border font-bold text-sm flex items-center justify-center `;
                           if (isSub) {
                              if (opt === q.correctAnswer) btnClass += "bg-green-500 border-green-500 text-white";
                              else if (selected) btnClass += "bg-red-500 border-red-500 text-white";
                              else btnClass += "bg-transparent border-white/5 text-gray-600";
                           } else {
                              btnClass += selected 
                                ? "bg-blue-600 border-blue-500 text-white shadow-md scale-105" 
                                : "bg-[#162335] border-white/10 text-gray-400 hover:text-white hover:bg-[#1e2d42]";
                           }
                         }

                         return (
                           <button
                             key={idx}
                             disabled={isSub}
                             onClick={() => handleAnswer(q.id, valueToSet)}
                             className={btnClass}
                           >
                             {isMultipleChoice && (
                               <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${selected ? 'border-white' : 'border-gray-500'}`}>
                                 {selected && <div className="w-2 h-2 bg-white rounded-full"/>}
                               </div>
                             )}
                             <span className="leading-snug">{label}</span>
                           </button>
                         )
                     })}
                  </div>

                  {/* Feedback */}
                  {isSub && (
                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2 text-sm animate-fade-in">
                       {isQCorrect ? (
                          <span className="text-green-400 font-bold flex items-center"><CheckCircle2 size={16} className="mr-1.5"/> Dobrze!</span>
                       ) : (
                          <span className="text-red-400 font-bold flex items-center">
                            <XCircle size={16} className="mr-1.5"/> 
                            Poprawna odpowiedź: <span className="text-white ml-2 bg-white/10 px-2 py-0.5 rounded border border-white/10 font-mono">
                              {isMultipleChoice && typeof q.correctAnswer === 'number' 
                                ? String.fromCharCode(65 + (q.correctAnswer as number)) 
                                : q.correctAnswer}
                            </span>
                          </span>
                       )}
                    </div>
                  )}

               </div>
             )
           })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full bg-[#050B14] overflow-hidden">
      
      {/* SIDEBAR OVERLAY */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 w-80 bg-[#0A1628] border-r border-white/10 shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-[#08101E]">
           <h3 className="text-sm font-bold text-white uppercase tracking-widest">Wybierz tekst</h3>
           <button onClick={() => setIsSidebarOpen(false)} className="text-gray-400 hover:text-white"><PanelLeftClose/></button>
        </div>
        
        {/* Generator Button */}
        <div className="p-4 border-b border-white/5">
           <button 
             onClick={generateAiReadingTask}
             disabled={isGenerating}
             className="w-full py-3 bg-gradient-to-r from-matura-accent to-yellow-600 hover:to-yellow-500 text-matura-bg font-bold rounded-xl shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
           >
             {isGenerating ? <Loader2 className="animate-spin" size={18}/> : <Sparkles size={18}/>}
             {isGenerating ? 'Generuję...' : 'Generuj nowe (AI)'}
           </button>
           <p className="text-[10px] text-gray-500 text-center mt-2">Stwórz unikalne zadanie na losowy temat</p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
           {tasks.map((task, idx) => (
             <button
               key={task.id}
               onClick={() => { setActiveTaskId(task.id); setIsSidebarOpen(false); }}
               className={`w-full text-left p-4 rounded-xl flex items-center gap-4 transition-all border ${
                 activeTaskId === task.id 
                  ? 'bg-matura-accent text-matura-bg font-bold border-matura-accent shadow-lg' 
                  : 'bg-[#112240] text-gray-400 border-transparent hover:bg-white/5'
               }`}
             >
               <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${activeTaskId === task.id ? 'bg-black/20 text-white' : 'bg-black/30'} ${task.id.startsWith('ai') ? 'text-purple-400' : ''}`}>
                 {task.id.startsWith('ai') ? <Sparkles size={14}/> : idx + 1}
               </div>
               <div className="flex-1 min-w-0">
                 <div className="truncate text-sm font-bold">{task.title}</div>
                 <div className="text-[10px] opacity-70 uppercase mt-0.5">{task.type.replace(/_/g, ' ')}</div>
               </div>
               {submitted[task.id] && <CheckCircle2 size={16} className={activeTaskId === task.id ? 'text-black/50' : 'text-green-500'} />}
             </button>
           ))}
        </div>
      </div>
      {isSidebarOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setIsSidebarOpen(false)}></div>}

      {/* MAIN VIEW */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-[#050B14] relative">
        
        {/* HEADER */}
        <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-white/5 bg-[#0A1628] flex-shrink-0 z-30 shadow-md">
           <div className="flex items-center gap-4 min-w-0">
             <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2.5 rounded-lg bg-[#162335] text-gray-300 hover:text-white border border-white/5 transition-all flex items-center gap-2"
                title="Wybierz inny tekst"
             >
                <List size={18}/>
                <span className="hidden md:inline text-xs font-bold uppercase">Zmień tekst</span>
             </button>
             
             <div className="min-w-0">
               <h2 className="text-sm md:text-lg font-bold text-white truncate">{activeTask.title}</h2>
               <p className="text-[10px] md:text-xs text-matura-muted truncate hidden sm:block">{activeTask.instruction}</p>
             </div>
           </div>

           <div className="flex items-center gap-3">
             <div className="hidden lg:flex items-center bg-[#112240] rounded-lg p-1 border border-white/5">
                <button onClick={() => setFontSize(Math.max(14, fontSize - 2))} className="p-2 hover:bg-white/10 rounded text-gray-400"><Minimize2 size={14}/></button>
                <span className="text-xs font-bold text-gray-300 w-8 text-center">{fontSize}</span>
                <button onClick={() => setFontSize(Math.min(24, fontSize + 2))} className="p-2 hover:bg-white/10 rounded text-gray-400"><Maximize2 size={14}/></button>
             </div>
             
             {!submitted[activeTaskId] ? (
               <button 
                 onClick={checkAnswers}
                 className="px-5 py-2.5 bg-matura-accent text-matura-bg font-bold rounded-lg hover:bg-yellow-400 transition-all text-sm flex items-center gap-2 shadow-lg active:scale-95"
               >
                 <CheckCircle2 size={18} /> <span className="hidden md:inline">Sprawdź</span>
               </button>
             ) : (
               <button 
                 onClick={() => {
                    const currentIdx = tasks.findIndex(t => t.id === activeTaskId);
                    if (currentIdx < tasks.length - 1) setActiveTaskId(tasks[currentIdx + 1].id);
                    else generateAiReadingTask(); // Generate new if at end
                 }}
                 className="px-5 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 transition-all text-sm flex items-center gap-2"
               >
                 <span className="hidden md:inline">Następne</span> <ArrowRight size={18} />
               </button>
             )}
           </div>
        </header>

        {/* SPLIT CONTENT */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
           
           {/* LEFT: TEXT */}
           <div className="lg:w-3/5 h-1/2 lg:h-full bg-[#1e293b] overflow-y-auto custom-scrollbar p-6 md:p-12 shadow-[inset_-10px_0_20px_rgba(0,0,0,0.2)] border-b lg:border-b-0 lg:border-r border-black/20">
              <div className="max-w-3xl mx-auto">
                 <div className="flex items-center gap-3 mb-8 opacity-60 border-b border-white/10 pb-4">
                    <BookOpen size={18} className="text-matura-accent"/>
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-300">Tekst źródłowy</span>
                 </div>
                 {renderLeftPanelContent()}
              </div>
           </div>

           {/* RIGHT: QUESTIONS */}
           <div className="lg:w-2/5 h-1/2 lg:h-full bg-[#0A1628] overflow-y-auto custom-scrollbar p-5 md:p-8">
              <div className="max-w-xl mx-auto">
                 {renderRightPanelContent()}
              </div>
           </div>

        </div>

      </main>
    </div>
  );
};

export default Reading;
