import React, { useState, useEffect, useRef } from 'react';
import { WritingAssessment, WritingTask, BulletPointAnalysis, DetailedError, LexicalRecommendation } from '../types';
import { gradeWritingTask } from '../services/geminiService';
import { saveTaskResult } from '../services/storageService';
import { useChatContext } from '../contexts/ChatContext';
import { 
  RefreshCw, 
  CheckCircle, 
  PenTool, 
  FileText, 
  Sparkles, 
  AlertTriangle, 
  Info, 
  Target,
  ListChecks,
  Copy,
  Trash2,
  BookOpen,
  ArrowDown,
  Check,
  ArrowRight,
  ShieldCheck,
  ThumbsUp,
  Lightbulb,
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  MessageSquare,
  BarChart3,
  Columns,
  ArrowLeft,
  Eye
} from 'lucide-react';

const TASKS: WritingTask[] = [
  {
    id: 'w1',
    type: 'email_informal',
    title: 'E-mail: Wakacje w górach',
    instruction: `Właśnie wróciłeś/aś z wakacji, które spędziłeś/aś w polskich górach. W e-mailu do kolegi z Anglii:
• napisz, w jaki sposób dotarłeś/aś na miejsce i jak długa była podróż
• opisz pensjonat, w którym mieszkałeś/aś podczas pobytu
• zrelacjonuj wycieczkę, która okazała się niebezpieczna
• zaproponuj koledze wspólny wyjazd w góry w przyszłym roku`,
    sampleEssay: `Hi Tom,

I hope you are doing well! Last week I came back from an incredible holiday in the Polish Tatras.

We travelled there by train, and the journey took about six hours from Warsaw. We stayed in a charming wooden guest house near Zakopane with an amazing view of the mountains.

One day we went on a hike to Kasprowy Wierch. Suddenly, the weather changed, heavy rain started and the trail became very slippery, which was quite dangerous. Fortunately, we returned to our hostel safely.

Would you like to come to the mountains with me next summer? We could have great fun together.

Write back soon,
XYZ`
  },
  {
    id: 'w2',
    type: 'blog',
    title: 'Blog: Festiwal Kulinarny',
    instruction: `W Twoim mieście odbył się niedawno festiwal kulinarny. Na swoim blogu:
• wyjaśnij, dlaczego zdecydowałeś/aś się wziąć udział w tym wydarzeniu
• opisz potrawę, która najbardziej Ci smakowała
• napisz o spotkaniu z kucharzem, który Cię zainspirował
• zachęć czytelników do odwiedzania podobnych imprez w ich okolicy`,
    sampleEssay: `Hi everyone!

Welcome back to my blog. Today I want to tell you about the international street food festival that took place in my town last Saturday.

I decided to take part in this event because I love discovering new dishes from all around the world. The best meal I tasted was Mexican tacos with spicy tomato sauce and fresh guacamole – they were absolutely delicious! 

During the festival, I also met a famous chef named Marco, who shared several cooking tricks and inspired me to prepare homemade pasta. 

If you have an opportunity, you should definitely visit similar culinary events in your area. Have you ever tried exotic street food?

Leave a comment below!`
  },
  {
    id: 'w3',
    type: 'email_informal',
    title: 'E-mail: Zgubiona rzecz',
    instruction: `Podczas niedawnego pobytu w Londynie u koleżanki zgubiłeś/aś cenną dla Ciebie rzecz. W e-mailu do niej:
• napisz, co zgubiłeś/aś i w jakich okolicznościach to się stało
• wyjaśnij, dlaczego ta rzecz jest dla Ciebie tak ważna
• poproś o sprawdzenie, czy nie zostawiłeś/aś jej w jej domu
• zaproponuj sposób odebrania zguby, jeśli się znajdzie`,
    sampleEssay: `Hi Sarah,

Thank you for hosting me in London last weekend, I had a fantastic time with you!

Unfortunately, after returning home, I realized that I lost my favourite silver watch. I think I took it off before going to sleep on Saturday night. This watch is very important to me because it was a special eighteenth birthday gift from my grandfather.

Could you please check if I accidentally left it on the bedside table in the guest room?

If you happen to find it, could you send it to my address by registered post? Of course, I will cover all the shipping costs.

Talk to you soon,
XYZ`
  },
  {
    id: 'w4',
    type: 'blog',
    title: 'Blog: Pierwsza praca',
    instruction: `Właśnie zacząłeś/aś swoją pierwszą pracę dorywczą. Podziel się wrażeniami na forum młodzieżowym:
• napisz, jaką pracę wykonujesz i jakie są Twoje główne obowiązki
• opisz swoich nowych współpracowników
• zrelacjonuj stresującą sytuację, która wydarzyła się pierwszego dnia
• napisz, na co zamierzasz przeznaczyć zarobione pieniądze`,
    sampleEssay: `Hi everyone!

Today I want to share my impressions from my very first part-time job.

For the past two weeks, I have been working as a shop assistant in a local bookstore. My main daily responsibilities include arranging books on the shelves and helping customers find interesting titles.

My new colleagues are extremely friendly, patient, and always willing to explain everything to me. On my first morning, I accidentally dropped a tall stack of heavy encyclopedias, which was quite stressful, but everyone laughed and helped me tidy up immediately.

I am planning to save all my earned money to buy a new laptop for university studies.

What was your first job experience like?`
  },
  {
    id: 'w5',
    type: 'email_informal',
    title: 'E-mail: Nowy uczeń',
    instruction: `Do Twojej klasy dołączył nowy uczeń z zagranicy. W e-mailu do przyjaciela z USA:
• napisz, jak wygląda nowy kolega i z jakiego kraju pochodzi
• opisz, jak klasa przywitała nowego ucznia
• zrelacjonuj problem, z jakim uczeń spotkał się pierwszego dnia w szkole
• napisz, jak pomogłeś/aś mu w tej trudnej sytuacji`,
    sampleEssay: `Hi Alex,

How have you been? I am writing to tell you that an exchange student joined our high school class yesterday.

His name is David and he recently moved to Poland from Spain. He is tall, has curly dark hair, and always wears cool vintage sneakers.

Our whole class gave him a warm welcome and showed him around the school corridors during breaks. However, he faced a stressful problem during our chemistry lesson because he could not understand the laboratory instructions written in Polish.

I quickly sat next to him and translated the entire worksheet into English, so we finished the experiment together successfully.

Write back soon,
XYZ`
  },
  {
    id: 'w6',
    type: 'description',
    title: 'Opis: Koncert zespołu',
    instruction: `Byłeś/aś ostatnio na koncercie swojego ulubionego zespołu. W e-mailu do kolegi:
• napisz, gdzie odbył się koncert i jaka panowała atmosfera
• opisz wygląd i zachowanie wokalisty na scenie
• zrelacjonuj niespodziankę przygotowaną przez fanów dla zespołu
• wyraź swoją opinię na temat organizacji całego wydarzenia`,
    sampleEssay: `Hi Mark,

You will not believe what an unforgettable weekend I had! Last Friday, I went to a live concert of my favourite rock band, The Midnight Echo.

The event took place in a massive arena in Warsaw, and the atmosphere in the audience was absolutely electric from the first minute. The lead singer looked fantastic in a stylish red jacket and constantly talked to the fans between songs.

During the encore, thousands of fans surprised the musicians by raising glowing yellow paper hearts, which moved the band deeply. In my opinion, the whole event was organized professionally and the sound quality was top-notch.

Have you been to any concerts recently?

Best wishes,
XYZ`
  }
];

interface WritingProps {
  onComplete: () => void;
}

const Writing: React.FC<WritingProps> = ({ onComplete }) => {
  const [selectedTask, setSelectedTask] = useState<WritingTask>(TASKS[0]);
  const [text, setText] = useState('');
  const [isGrading, setIsGrading] = useState(false);
  const [result, setResult] = useState<WritingAssessment | null>(null);
  const [notice, setNotice] = useState<{ type: 'error' | 'warning' | 'info'; message: string } | null>(null);
  const [activeResultTab, setActiveResultTab] = useState<'kryteria' | 'bledy' | 'slownictwo' | 'ulepszona'>('kryteria');
  const [viewMode, setViewMode] = useState<'full' | 'tabs'>('full');
  const [mainView, setMainView] = useState<'editor' | 'analysis' | 'split'>('editor');
  const [copiedEnhanced, setCopiedEnhanced] = useState(false);
  
  const resultsRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { setScreenContext } = useChatContext();

  const scrollToAnchor = (elementId: string) => {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Word count logic according to CKE standards
  const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
  const isLengthCorrect = wordCount >= 80 && wordCount <= 130;
  const isTooShort = wordCount > 0 && wordCount < 80;
  const isTooLong = wordCount > 130;

  // Update AI Chat Context
  useEffect(() => {
    setScreenContext(`
      MODUŁ: WYPOWIEDŹ PISEMNA
      Temat: ${selectedTask.title}
      Treść polecenia: ${selectedTask.instruction}
      
      AKTUALNA TREŚĆ UCZNIA (Draft):
      "${text.substring(0, 2000)}"
      
      Liczba słów: ${wordCount}.
      
      Jeśli uczeń prosi o pomoc, podaj przydatne zwroty (np. jak zacząć e-mail, jak wyrazić opinię), popraw pojedyncze zdania, ale NIE PISZ CAŁEJ PRACY ZA NIEGO.
    `);
  }, [selectedTask, text, wordCount, setScreenContext]);

  const handlePasteSample = () => {
    if (selectedTask.sampleEssay) {
      setText(selectedTask.sampleEssay);
      setNotice({
        type: 'info',
        message: 'Wklejono wzorcową pracę egzaminacyjną (ok. 100 słów). Kliknij „Oceń moją pracę”, aby sprawdzić ocenę AI!'
      });
      setTimeout(() => setNotice(null), 5000);
    }
  };

  const handleClear = () => {
    setText('');
    setResult(null);
    setNotice(null);
    textareaRef.current?.focus();
  };

  const handleGrade = async (customText?: string) => {
    const textToEvaluate = typeof customText === 'string' ? customText : text;
    const trimmed = textToEvaluate.trim();
    if (!trimmed) {
      setNotice({
        type: 'warning',
        message: 'Pole tekstowe jest puste. Wpisz swój tekst lub kliknij „Wklej wzorcową pracę”, aby przetestować ocenianie.'
      });
      setMainView('editor');
      textareaRef.current?.focus();
      return;
    }

    setNotice(null);
    setIsGrading(true);

    try {
      // Pass the task instruction and student text to AI examiner
      const assessment = await gradeWritingTask(selectedTask.instruction, trimmed);
      setResult(assessment);

      if (assessment && typeof assessment.suma === 'number') {
        saveTaskResult('writing', assessment.suma, 10, selectedTask.id);
        onComplete();
      }

      setNotice({
        type: 'info',
        message: `Praca pomyślnie oceniona (${assessment.suma}/10 pkt)! Pełna analiza z uwagami egzaminatora CKE jest gotowa poniżej.`
      });

      // Automatically switch view to analysis report so user enters analysis immediately
      setMainView('analysis');

      // Smoothly scroll to results
      setTimeout(() => {
        if (resultsRef.current) {
          resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 120);
    } catch (err: any) {
      console.error('Grading error:', err);
      setNotice({
        type: 'error',
        message: 'Wystąpił problem z połączeniem podczas oceniania. Spróbuj ponownie za chwilę.'
      });
    } finally {
      setIsGrading(false);
    }
  };

  const handleQuickAnalyzeSample = () => {
    const sample = selectedTask.sampleEssay || (
      `Hi Tom,\n\nI have just come back from my holiday in the mountains and I had a great time! We travelled there by car and the journey took about eight hours.\n\nWe stayed in a lovely, cozy guesthouse right next to the forest. Unfortunately, one day during our hike the weather turned terrible and the path became extremely slippery. Luckily, nothing bad happened!\n\nWould you like to go to the mountains with me next year?\n\nBest wishes,\nXYZ`
    );
    setText(sample);
    handleGrade(sample);
  };

  // Helper to parse instruction text and render bullet points
  const renderInstruction = (instr: string) => {
    const lines = instr.split('\n');
    return (
      <div className="space-y-3">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
            return (
              <div key={idx} className="flex items-start gap-3 pl-2">
                <div className="mt-2 w-1.5 h-1.5 rounded-full bg-matura-accent flex-shrink-0 shadow-[0_0_8px_rgba(245,197,24,0.8)]"></div>
                <span className="text-gray-200 leading-relaxed font-medium">{trimmed.replace(/^[•-]\s*/, '')}</span>
              </div>
            );
          }
          return (
            <p key={idx} className="text-white font-semibold mb-2 leading-relaxed">
              {line}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* TOP PRIMARY WORKSPACE NAVIGATION BAR */}
      <div className="bg-[#0A1628] p-3 rounded-2xl border border-white/10 mb-6 shadow-lg flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            type="button"
            id="btn-tab-editor"
            onClick={() => setMainView('editor')}
            className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              mainView === 'editor'
                ? 'bg-matura-accent text-matura-bg shadow-md scale-[1.02]'
                : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <PenTool size={16} />
            <span>1. Edytor & Polecenie</span>
          </button>

          <button
            type="button"
            id="btn-tab-analysis"
            onClick={() => {
              setMainView('analysis');
              setTimeout(() => {
                resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
              }, 50);
            }}
            className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all relative ${
              mainView === 'analysis'
                ? 'bg-matura-accent text-matura-bg shadow-md scale-[1.02]'
                : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <BarChart3 size={16} />
            <span>2. Raport & Pełna Analiza CKE</span>
            {result ? (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                mainView === 'analysis' ? 'bg-black/30 text-matura-bg' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                {result.suma}/10 pkt
              </span>
            ) : (
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] bg-white/10 text-gray-400 font-normal">
                {wordCount > 0 ? 'Oceń' : 'Podgląd'}
              </span>
            )}
          </button>

          <button
            type="button"
            id="btn-tab-split"
            onClick={() => setMainView('split')}
            className={`hidden xl:flex px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold items-center gap-2 transition-all ${
              mainView === 'split'
                ? 'bg-white/20 text-white border border-white/20'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200'
            }`}
            title="Wyświetl edytor i analizę obok siebie"
          >
            <Columns size={15} />
            <span>Obok siebie</span>
          </button>
        </div>

        <div className="flex items-center justify-between w-full md:w-auto gap-3 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Słowa:</span>
            <span className={`font-bold ${isLengthCorrect ? 'text-green-400' : 'text-amber-400'}`}>
              {wordCount} / 80-130
            </span>
          </div>
          {result ? (
            <div className="flex items-center gap-2 bg-emerald-500/15 text-emerald-400 px-3 py-1 rounded-lg border border-emerald-500/30 text-xs font-bold">
              <CheckCircle2 size={13} />
              <span>Wynik: {result.suma}/10 pkt</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (text.trim().length > 0) {
                  handleGrade();
                } else {
                  handleQuickAnalyzeSample();
                }
              }}
              className="text-[11px] text-matura-accent hover:underline flex items-center gap-1 font-semibold"
            >
              <Sparkles size={12} /> {text.trim().length > 0 ? 'Oceń tekst' : 'Wklej wzorzec i oceń'}
            </button>
          )}
        </div>
      </div>

      <div className={
        mainView === 'split'
          ? 'grid grid-cols-1 xl:grid-cols-2 gap-8 h-full'
          : 'w-full'
      }>
        {/* LEFT COLUMN: Editor & Instructions */}
        {(mainView === 'editor' || mainView === 'split') && (
          <div className="flex flex-col h-full gap-5">
        
        {/* Toolbar & Task Selector */}
        <div className="bg-[#0A1628] p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
           <div className="flex items-center gap-3 w-full sm:w-auto">
             <div className="w-10 h-10 rounded-xl bg-pink-600/20 flex items-center justify-center text-pink-400 border border-pink-500/20 shadow-sm">
               <PenTool size={20}/>
             </div>
             <div>
               <h2 className="text-white font-bold text-sm uppercase tracking-wide flex items-center gap-2">
                 <span>Wypowiedź Pisemna CKE</span>
                 <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 text-[10px] font-bold border border-pink-500/30">
                   0-10 pkt
                 </span>
               </h2>
               <p className="text-xs text-gray-400">Wybierz temat i sprawdź ocenę egzaminatora</p>
             </div>
           </div>
           
           <select 
              className="w-full sm:w-auto bg-[#0F1B2D] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-matura-accent focus:ring-1 focus:ring-matura-accent transition-all cursor-pointer font-medium"
              value={selectedTask.id}
              onChange={(e) => {
                setSelectedTask(TASKS.find(t => t.id === e.target.value) || TASKS[0]);
                setResult(null);
                setText('');
                setNotice(null);
              }}
            >
              {TASKS.map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
        </div>

        {/* CKE Style Instruction Box */}
        <div className="bg-[#112240] p-6 rounded-2xl border border-white/10 shadow-md relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-matura-accent"></div>
            <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2">
                 <ListChecks className="text-matura-accent" size={18}/>
                 <h3 className="text-xs font-bold text-matura-accent uppercase tracking-widest">Treść polecenia egzaminacyjnego</h3>
               </div>
               <span className="text-[11px] text-gray-400 font-mono bg-black/30 px-2.5 py-1 rounded-lg border border-white/5">
                 Wymóg CKE: 80-130 słów
               </span>
            </div>
            
            <div className="text-sm">
              {renderInstruction(selectedTask.instruction)}
            </div>
            
            <div className="mt-5 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400">
              <div className="flex items-center gap-1.5 italic">
                <Info size={14} className="text-matura-accent"/>
                Rozwiń każdy z 4 podpunktów, używając spójników logicznych.
              </div>

              {/* Sample essay template trigger */}
              {selectedTask.sampleEssay && (
                <button
                  type="button"
                  onClick={handlePasteSample}
                  className="px-3 py-1.5 bg-matura-accent/15 hover:bg-matura-accent/25 text-matura-accent border border-matura-accent/30 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all"
                  title="Wklej gotowe wzorcowe wypracowanie na 10/10 pkt, aby natychmiast sprawdzić ocenianie"
                >
                  <Copy size={13} /> Wklej wzorcową pracę (test)
                </button>
              )}
            </div>
        </div>

        {/* Inline Notice Banner */}
        {notice && (
          <div className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between gap-3 animate-fade-in border ${
            notice.type === 'error'
              ? 'bg-red-500/20 text-red-300 border-red-500/30'
              : notice.type === 'warning'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
          }`}>
            <div className="flex items-center gap-2">
              {notice.type === 'error' && <AlertTriangle size={16} className="text-red-400 shrink-0" />}
              {notice.type === 'warning' && <AlertTriangle size={16} className="text-amber-400 shrink-0" />}
              {notice.type === 'info' && <CheckCircle size={16} className="text-emerald-400 shrink-0" />}
              <span>{notice.message}</span>
            </div>
            <button
              onClick={() => setNotice(null)}
              className="text-gray-400 hover:text-white text-sm font-bold ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Text Area Container */}
        <div className="flex-1 relative group flex flex-col min-h-[380px]">
           <div className="flex items-center justify-between px-2 mb-2">
             <div className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
               <PenTool size={13} className="text-matura-accent"/> Twój tekst (E-mail / Wpis)
             </div>
             {text.trim().length > 0 && (
               <button
                 type="button"
                 onClick={handleClear}
                 className="text-[11px] text-gray-400 hover:text-red-400 flex items-center gap-1 font-medium transition-colors"
                 title="Wyczyść pole tekstowe"
               >
                 <Trash2 size={12} /> Wyczyść
               </button>
             )}
           </div>

           <textarea
              ref={textareaRef}
              className="flex-1 w-full bg-[#0F1B2D] border border-white/10 rounded-2xl p-6 text-gray-200 focus:outline-none focus:border-matura-accent/50 focus:bg-[#13233b] resize-none font-sans leading-relaxed text-base shadow-inner transition-all placeholder-gray-600"
              placeholder="Napisz swoją wypowiedź po angielsku (np. Hi Tom, I hope you are doing well... lub zacznij od wzorcowej pracy)..."
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (notice) setNotice(null);
              }}
              spellCheck={false}
           />
           
           {/* Floating Word Counter */}
           <div className={`absolute bottom-4 right-4 px-3 py-1.5 rounded-lg text-xs font-bold border backdrop-blur-md transition-all flex items-center gap-2 shadow-lg ${
             isLengthCorrect 
               ? 'bg-green-500/10 text-green-400 border-green-500/30' 
               : (isTooShort || isTooLong)
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-gray-800/80 text-gray-400 border-white/10'
           }`}>
             {isLengthCorrect && <CheckCircle size={13} />}
             {(isTooShort || isTooLong) && <AlertTriangle size={13} />}
             <span>{wordCount} {wordCount === 1 ? 'słowo' : wordCount < 5 && wordCount > 1 ? 'słowa' : 'słów'}</span>
             <span className="opacity-40 font-normal border-l border-white/10 pl-2 ml-1">Limit CKE: 80-130</span>
           </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => handleGrade()}
              disabled={isGrading}
              className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center transition-all shadow-xl text-sm uppercase tracking-wider ${
                isGrading 
                ? 'bg-gray-800 text-gray-400 cursor-wait border border-white/10' 
                : 'bg-matura-accent text-matura-bg hover:bg-yellow-400 transform hover:-translate-y-0.5 shadow-yellow-500/20 active:translate-y-0 active:scale-[0.99]'
              }`}
            >
              {isGrading ? (
                <><RefreshCw className="animate-spin mr-3" size={18} /> Egzaminator CKE ocenia pracę...</>
              ) : (
                <><Sparkles className="mr-3 text-matura-bg" size={18} /> Oceń moją pracę (AI / CKE)</>
              )}
            </button>

            <button
              type="button"
              id="btn-open-analysis"
              onClick={() => {
                setMainView('analysis');
                setTimeout(() => {
                  resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 50);
              }}
              className="px-5 py-4 rounded-xl font-bold bg-[#0F1B2D] hover:bg-[#15243b] text-gray-200 hover:text-white border border-white/10 flex items-center justify-center gap-2 transition-all shadow-md text-xs sm:text-sm uppercase tracking-wider"
              title="Przejdź do pełnej analizy egzaminatora CKE"
            >
              <BarChart3 size={17} className="text-matura-accent" />
              <span>{result ? 'Zobacz Analizę' : 'Wejdź do Analizy'}</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {isGrading && (
            <div className="p-3.5 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-xs text-yellow-300 flex items-center gap-2.5 animate-pulse">
              <RefreshCw className="animate-spin text-matura-accent shrink-0" size={16} />
              <span>Egzaminator analizuje treść, spójność, zakres i poprawność wg klucza CKE...</span>
            </div>
          )}

          {result && !isGrading && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Pełna analiza CKE gotowa:</span>
                    <span className="text-emerald-400 font-extrabold">{result.suma} / 10 pkt</span>
                  </div>
                  <div className="text-[11px] text-gray-400">
                    Podsumowanie z uwagami, kryteria i korektor w raporcie
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMainView('analysis');
                  setTimeout(() => {
                    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 50);
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shrink-0 hover:bg-emerald-400 shadow-md"
              >
                <span>Otwórz analizę</span>
                <ArrowRight size={13} />
              </button>
            </div>
          )}
          
          <div className="flex items-center justify-between text-[11px] text-gray-500 px-2">
            <span>Kryteria: Treść (0-4), Spójność (0-2), Zakres (0-2), Poprawność (0-2)</span>
            <span className="text-emerald-400 font-medium">Suma: max 10 pkt</span>
          </div>
        </div>
      </div>
      )}

      {/* RIGHT COLUMN: Results & Detailed CKE Analysis */}
      {(mainView === 'analysis' || mainView === 'split') && (
        <div ref={resultsRef} className="h-full overflow-y-auto custom-scrollbar">
          {/* Header toolbar when in standalone analysis view */}
          {mainView === 'analysis' && (
            <div className="flex items-center justify-between gap-3 bg-[#0A1628] p-3 rounded-2xl border border-white/10 mb-5 shadow-sm">
              <button
                type="button"
                onClick={() => setMainView('editor')}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-200 hover:text-white flex items-center gap-2 border border-white/10 transition-all"
              >
                <ArrowLeft size={14} /> Wróć do edytora pracy
              </button>

              <span className="text-xs font-bold text-gray-400 truncate max-w-xs">
                Temat: <strong className="text-white">{selectedTask.title}</strong>
              </span>

              <button
                type="button"
                onClick={() => handleGrade()}
                disabled={isGrading}
                className="px-3.5 py-2 rounded-xl bg-matura-accent text-matura-bg hover:bg-yellow-400 text-xs font-bold flex items-center gap-1.5 transition-all shadow"
              >
                <RefreshCw size={12} className={isGrading ? 'animate-spin' : ''} />
                <span>Oceń ponownie</span>
              </button>
            </div>
          )}

          {result ? (
          <div className="space-y-6 animate-slide-up pb-10">
            
            {/* Score Header */}
            <div className="bg-gradient-to-br from-[#0F1B2D] to-[#0A1628] p-6 sm:p-8 rounded-3xl border border-white/10 relative overflow-hidden shadow-2xl">
               <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
               
               <div className="relative z-10">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <h3 className="text-gray-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                      <Target size={14} className="text-matura-accent"/> Oficjalny Wynik Egzaminacyjny CKE
                    </h3>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                      <ShieldCheck size={12} /> CKE Formuła 2023/2026
                    </span>
                  </div>
                  
                  <div className="flex items-baseline gap-2 mb-3">
                     <span className={`text-5xl sm:text-6xl font-display font-bold ${result.suma >= 7 ? 'text-green-400' : result.suma >= 4 ? 'text-yellow-400' : 'text-red-400'}`}>
                       {result.suma}
                     </span>
                     <span className="text-2xl text-gray-400 font-bold">/ 10 pkt</span>
                     <span className="ml-auto text-sm font-semibold text-gray-400">
                       ({Math.round((result.suma / 10) * 100)}%)
                     </span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden mb-5 border border-white/5">
                    <div 
                      style={{ width: `${Math.max(5, (result.suma / 10) * 100)}%` }} 
                      className={`h-full rounded-full transition-all duration-1000 ${
                        result.suma >= 7 ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 
                        result.suma >= 4 ? 'bg-gradient-to-r from-yellow-500 to-orange-400' : 
                        'bg-gradient-to-r from-red-500 to-rose-400'
                      }`}
                    ></div>
                  </div>

                  {/* Formal Quick Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                      <div className="text-gray-400 text-[10px] uppercase font-bold">Liczba słów</div>
                      <div className="font-bold text-white flex items-center gap-1">
                        {wordCount}
                        <span className={isLengthCorrect ? "text-green-400 text-[10px]" : "text-amber-400 text-[10px]"}>
                          ({isLengthCorrect ? "80-130 OK" : isTooShort ? "<80 za krótko" : ">130 za długo"})
                        </span>
                      </div>
                    </div>
                    <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                      <div className="text-gray-400 text-[10px] uppercase font-bold">Poziom CEFR</div>
                      <div className="font-bold text-matura-accent">
                        {result.statystykiTekstu?.poziomJezykowy || (wordCount >= 80 ? 'B1' : 'A2')}
                      </div>
                    </div>
                    <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                      <div className="text-gray-400 text-[10px] uppercase font-bold">Powitanie / Podpis</div>
                      <div className="font-bold text-gray-300 flex items-center gap-1">
                        {result.statystykiTekstu?.maPowitanie ? (
                          <span className="text-green-400 flex items-center gap-0.5"><Check size={11} /> Jest</span>
                        ) : (
                          <span className="text-amber-400">Brak</span>
                        )}
                        <span className="text-gray-500">/</span>
                        {result.statystykiTekstu?.maPozegnanie ? (
                          <span className="text-green-400 flex items-center gap-0.5"><Check size={11} /> Jest</span>
                        ) : (
                          <span className="text-amber-400">Brak</span>
                        )}
                      </div>
                    </div>
                    <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                      <div className="text-gray-400 text-[10px] uppercase font-bold">Akapity</div>
                      <div className="font-bold text-gray-300">
                        {result.statystykiTekstu?.maAkapity ? (
                          <span className="text-green-400 flex items-center gap-0.5"><Check size={11} /> Zachowane</span>
                        ) : (
                          <span className="text-amber-400">Jeden blok</span>
                        )}
                      </div>
                    </div>
                  </div>
               </div>
            </div>

            {/* OFICJALNE PODSUMOWANIE EGZAMINATORA CKE Z UWAGAMI */}
            <div id="sekcja-podsumowanie" className="bg-[#0F1B2D] p-6 rounded-3xl border border-matura-accent/30 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h4 className="text-matura-accent font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                  <MessageSquare size={16} /> Oficjalne Podsumowanie Egzaminatora CKE z Uwagami
                </h4>
                <span className="text-[10px] font-bold text-gray-300 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                  Ocena całościowa
                </span>
              </div>
              
              <div className="bg-black/40 p-4 sm:p-5 rounded-2xl border border-white/5 text-sm sm:text-base text-gray-100 leading-relaxed mb-4 font-sans">
                {result.podsumowanie}
              </div>

              {/* Wskazówki i uwagi egzaminatora */}
              {result.wskazowki && result.wskazowki.length > 0 && (
                <div className="pt-3 border-t border-white/10">
                  <span className="text-[11px] font-bold text-yellow-400 uppercase tracking-wider block mb-2.5 flex items-center gap-1.5">
                    <Lightbulb size={14} /> Główne uwagi i zalecenia egzaminatora:
                  </span>
                  <div className="space-y-2">
                    {result.wskazowki.map((wsk, i) => (
                      <div key={i} className="text-xs text-gray-200 flex items-start gap-2.5 bg-white/5 p-3 rounded-xl border border-white/5">
                        <span className="w-5 h-5 rounded-full bg-yellow-500/20 text-yellow-300 font-bold flex items-center justify-center shrink-0 text-[11px] mt-0.5">
                          {i + 1}
                        </span>
                        <span className="leading-relaxed">{wsk}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Navigation Anchor Bar & View Toggle */}
            <div className="bg-[#0A1628]/95 backdrop-blur-md p-2 rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-2 sticky top-0 z-20 shadow-lg">
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => scrollToAnchor('sekcja-podsumowanie')}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1"
                >
                  <MessageSquare size={13} className="text-matura-accent" /> Uwagi
                </button>
                <button
                  type="button"
                  onClick={() => scrollToAnchor('sekcja-podpunkty')}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1"
                >
                  <ListChecks size={13} className="text-emerald-400" /> Podpunkty (4)
                </button>
                <button
                  type="button"
                  onClick={() => scrollToAnchor('sekcja-kryteria')}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1"
                >
                  <BookOpen size={13} className="text-blue-400" /> Kryteria CKE
                </button>
                <button
                  type="button"
                  onClick={() => scrollToAnchor('sekcja-bledy')}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1"
                >
                  <AlertTriangle size={13} className="text-red-400" /> Błędy
                  {((result.szczegoloweBledy && result.szczegoloweBledy.length > 0) || (result.poprawnosc.bledy && result.poprawnosc.bledy.length > 0)) && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-500/20 text-red-400 font-bold ml-0.5">
                      {result.szczegoloweBledy?.length || result.poprawnosc.bledy?.length || 0}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => scrollToAnchor('sekcja-slownictwo')}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1"
                >
                  <Lightbulb size={13} className="text-amber-400" /> Słownictwo
                </button>
                <button
                  type="button"
                  onClick={() => scrollToAnchor('sekcja-wzorzec')}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1"
                >
                  <Sparkles size={13} className="text-matura-accent" /> Wzorzec 10/10
                </button>
              </div>

              {/* View mode toggle */}
              <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setViewMode('full')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    viewMode === 'full' 
                      ? 'bg-matura-accent text-matura-bg shadow-sm' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Pełny raport
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('tabs')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    viewMode === 'tabs' 
                      ? 'bg-matura-accent text-matura-bg shadow-sm' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Zakładki
                </button>
              </div>
            </div>

            {/* If tabs mode, render tab buttons */}
            {viewMode === 'tabs' && (
              <div className="flex border-b border-white/10 overflow-x-auto gap-1 pb-1">
                <button
                  type="button"
                  onClick={() => setActiveResultTab('kryteria')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    activeResultTab === 'kryteria'
                      ? 'bg-matura-accent text-matura-bg shadow-md'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <BookOpen size={14} /> Arkusz CKE & Podpunkty
                </button>
                <button
                  type="button"
                  onClick={() => setActiveResultTab('bledy')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    activeResultTab === 'bledy'
                      ? 'bg-matura-accent text-matura-bg shadow-md'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <AlertTriangle size={14} /> Korektor Błędów
                  {((result.szczegoloweBledy && result.szczegoloweBledy.length > 0) || (result.poprawnosc.bledy && result.poprawnosc.bledy.length > 0)) && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeResultTab === 'bledy' ? 'bg-matura-bg text-matura-accent' : 'bg-red-500/20 text-red-400'}`}>
                      {result.szczegoloweBledy?.length || result.poprawnosc.bledy?.length || 0}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveResultTab('slownictwo')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    activeResultTab === 'slownictwo'
                      ? 'bg-matura-accent text-matura-bg shadow-md'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Lightbulb size={14} /> Słownictwo & Atuty
                </button>
                <button
                  type="button"
                  onClick={() => setActiveResultTab('ulepszona')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    activeResultTab === 'ulepszona'
                      ? 'bg-matura-accent text-matura-bg shadow-md'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Sparkles size={14} /> Wersja 10/10 pkt
                </button>
              </div>
            )}

            {/* SECTION 1: 4 PODPUNKTY POLECENIA */}
            {(viewMode === 'full' || activeResultTab === 'kryteria') && (
              <div id="sekcja-podpunkty" className="bg-[#0F1B2D] p-5 sm:p-6 rounded-3xl border border-white/10 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                    <ListChecks size={16} className="text-matura-accent" /> Realizacja 4 podpunktów polecenia
                  </h4>
                  <span className="text-[11px] text-gray-400">Klucz do punktów za Treść</span>
                </div>
                
                {result.podpunkty && result.podpunkty.length > 0 ? (
                  <div className="space-y-3">
                    {result.podpunkty.map((bp) => {
                      const isRozwiniety = bp.status === 'rozwiniety';
                      const isOdniesiony = bp.status === 'odniesiony';
                      const isBrak = bp.status === 'brak';
                      
                      return (
                        <div 
                          key={bp.bulletNumber} 
                          className={`p-4 rounded-2xl border transition-all ${
                            isRozwiniety 
                              ? 'bg-emerald-950/20 border-emerald-500/30' 
                              : isOdniesiony 
                                ? 'bg-amber-950/20 border-amber-500/30' 
                                : 'bg-rose-950/20 border-rose-500/30'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="text-xs sm:text-sm font-bold text-gray-200 flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white">
                                {bp.bulletNumber}
                              </span>
                              {bp.bulletText}
                            </span>
                            
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full whitespace-nowrap flex items-center gap-1 ${
                              isRozwiniety 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                : isOdniesiony 
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}>
                              {isRozwiniety && <Check size={10} />}
                              {isOdniesiony && <Info size={10} />}
                              {isBrak && <XCircle size={10} />}
                              {isRozwiniety ? 'Rozwinięty (+szczegóły)' : isOdniesiony ? 'Odniesiony (bez rozwinięcia)' : 'Brak odniesienia'}
                            </span>
                          </div>

                          {bp.cytat && (
                            <div className="text-xs bg-black/30 px-3 py-1.5 rounded-lg border border-white/5 text-gray-300 italic mb-2">
                              <span className="text-gray-500 not-italic font-semibold text-[10px] mr-1">Cytat z Twojej pracy:</span> 
                              „{bp.cytat}”
                            </div>
                          )}

                          <p className="text-xs text-gray-300 leading-relaxed font-normal">
                            {bp.comment}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 leading-relaxed bg-black/20 p-3 rounded-lg">
                    {result.tresc.komentarz}
                  </div>
                )}
              </div>
            )}

            {/* SECTION 2: 4 KRYTERIA CKE */}
            {(viewMode === 'full' || activeResultTab === 'kryteria') && (
              <div id="sekcja-kryteria" className="space-y-3">
                <h4 className="text-white font-bold text-sm uppercase tracking-wider ml-1 flex items-center gap-2">
                  <BookOpen size={16} className="text-matura-accent" /> 4 Oficjalne Kryteria CKE
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ScoreCard label="1. Treść i podpunkty" score={result.tresc.punkty} max={4} comment={result.tresc.komentarz} />
                  <ScoreCard label="2. Spójność i logika" score={result.spojnosc.punkty} max={2} comment={result.spojnosc.komentarz} />
                  <ScoreCard label="3. Zakres środków" score={result.zakres.punkty} max={2} comment={result.zakres.komentarz} />
                  <ScoreCard label="4. Poprawność językowa" score={result.poprawnosc.punkty} max={2} comment={result.poprawnosc.komentarz} />
                </div>
              </div>
            )}

            {/* SECTION 3: KOREKTOR BŁĘDÓW */}
            {(viewMode === 'full' || activeResultTab === 'bledy') && (
              <div id="sekcja-bledy" className="space-y-4">
                <div className="flex items-center justify-between ml-1">
                  <h4 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                    <AlertTriangle size={16} className="text-red-400" /> Szczegółowy Korektor Błędów i Uwagi Językowe
                  </h4>
                  <span className="text-xs text-red-400 font-semibold">
                    Punkty za poprawność: {result.poprawnosc.punkty}/2
                  </span>
                </div>

                {result.szczegoloweBledy && result.szczegoloweBledy.length > 0 ? (
                  <div className="space-y-3">
                    {result.szczegoloweBledy.map((err, idx) => (
                      <div key={idx} className="bg-[#141d2b] p-4 sm:p-5 rounded-2xl border border-red-500/20 shadow-md">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                            {err.category || 'Gramatyka'}
                          </span>
                          <span className="text-gray-500 text-[11px] font-mono">Błąd #{idx + 1}</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-2.5 text-xs">
                          <div className="bg-red-950/30 p-2.5 rounded-xl border border-red-500/30">
                            <span className="text-[10px] font-bold text-red-400 block mb-1 uppercase tracking-wider">Twój tekst:</span>
                            <span className="text-red-200 line-through font-mono font-medium">{err.original}</span>
                          </div>
                          <div className="bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-500/30">
                            <span className="text-[10px] font-bold text-emerald-400 block mb-1 uppercase tracking-wider flex items-center gap-1">
                              <Check size={10} /> Poprawna forma CKE:
                            </span>
                            <span className="text-emerald-200 font-mono font-bold">{err.corrected}</span>
                          </div>
                        </div>

                        <div className="mt-2 text-xs text-gray-300 bg-black/20 p-2.5 rounded-xl border border-white/5 flex items-start gap-2">
                          <Info size={14} className="text-matura-accent shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{err.explanation}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : result.poprawnosc.bledy && result.poprawnosc.bledy.length > 0 ? (
                  <div className="space-y-3">
                    {result.poprawnosc.bledy.map((err, idx) => (
                      <div key={idx} className="bg-[#141d2b] p-4 rounded-2xl border border-red-500/20 text-xs text-gray-200">
                        {err}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-emerald-950/20 border border-emerald-500/30 p-6 sm:p-8 rounded-3xl text-center">
                    <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 size={28} />
                    </div>
                    <h4 className="text-emerald-300 font-bold text-base mb-1">Czysto! Brak wykrytych usterek</h4>
                    <p className="text-xs text-gray-300 max-w-md mx-auto leading-relaxed">
                      Egzaminator CKE nie dopatrzył się w Twojej pracy rażących usterek gramatycznych, leksykalnych ani ortograficznych. Utrzymaj tę dyscyplinę na egzaminie!
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* SECTION 4: SŁOWNICTWO & ATUTY */}
            {(viewMode === 'full' || activeResultTab === 'slownictwo') && (
              <div id="sekcja-slownictwo" className="space-y-5">
                <h4 className="text-white font-bold text-sm uppercase tracking-wider ml-1 flex items-center gap-2">
                  <Lightbulb size={16} className="text-matura-accent" /> Słownictwo, Atuty i Rekomendacje
                </h4>

                {/* Mocne strony */}
                {result.mocneStrony && result.mocneStrony.length > 0 && (
                  <div className="bg-[#0F1B2D] p-5 rounded-2xl border border-emerald-500/20 shadow-sm">
                    <h5 className="text-emerald-400 font-bold text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
                      <ThumbsUp size={14} /> Co w tej pracy zrobiłeś bardzo dobrze:
                    </h5>
                    <ul className="space-y-2">
                      {result.mocneStrony.map((ms, idx) => (
                        <li key={idx} className="text-xs text-gray-200 flex items-start gap-2.5 bg-emerald-500/5 p-2.5 rounded-lg border border-emerald-500/10">
                          <CheckCircle size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                          <span>{ms}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Bank ulepszeń leksykalnych */}
                {result.rekomendacjeLeksykalne && result.rekomendacjeLeksykalne.length > 0 && (
                  <div className="bg-[#0F1B2D] p-5 rounded-2xl border border-matura-accent/20 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-matura-accent font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                        <Lightbulb size={14} /> Zamień proste słowa na poziom B1/B2 (wyższe punkty za zakres)
                      </h5>
                    </div>

                    <div className="space-y-3">
                      {result.rekomendacjeLeksykalne.map((rec, idx) => (
                        <div key={idx} className="bg-black/30 p-3.5 rounded-xl border border-white/5 text-xs">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 font-mono">
                              {rec.original}
                            </span>
                            <ArrowRight size={12} className="text-matura-accent" />
                            <span className="px-2 py-0.5 rounded bg-matura-accent/20 text-matura-accent font-bold font-mono border border-matura-accent/30">
                              {rec.suggested}
                            </span>
                          </div>
                          <p className="text-gray-300 text-[11px] leading-relaxed">
                            {rec.reason}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SECTION 5: WERSJA 10/10 PKT */}
            {(viewMode === 'full' || activeResultTab === 'ulepszona') && (
              <div id="sekcja-wzorzec" className="space-y-4">
                <div className="bg-[#0F1B2D] p-6 rounded-3xl border border-matura-accent/30 relative overflow-hidden shadow-2xl">
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-matura-accent block">Wzorcowy e-mail egzaminacyjny</span>
                      <h4 className="text-base font-bold text-white flex items-center gap-2">
                        <Award size={18} className="text-matura-accent" /> Twoja praca przeredagowana na 10/10 pkt
                      </h4>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        const targetText = result.ulepszonaWersja || selectedTask.sampleEssay || text;
                        navigator.clipboard.writeText(targetText);
                        setCopiedEnhanced(true);
                        setTimeout(() => setCopiedEnhanced(false), 3000);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-gray-200 flex items-center gap-1.5 transition-all border border-white/10"
                    >
                      {copiedEnhanced ? (
                        <><Check size={13} className="text-green-400" /> Skopiowano!</>
                      ) : (
                        <><Copy size={13} /> Kopiuj tekst</>
                      )}
                    </button>
                  </div>

                  <div className="bg-black/40 p-5 rounded-2xl border border-white/5 font-sans text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
                    {result.ulepszonaWersja || selectedTask.sampleEssay || (
                      `Hi Tom,\n\nI have just come back from my holiday in the mountains and I had a great time! We travelled there by car and the journey took about eight hours.\n\nWe stayed in a lovely, cozy guesthouse right next to the forest. Unfortunately, one day during our hike the weather turned terrible and the path became extremely slippery. Luckily, nothing bad happened!\n\nWould you like to go to the mountains with me next year?\n\nBest wishes,\nXYZ`
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/10 text-xs text-gray-400 flex items-start gap-2">
                    <Info size={14} className="text-matura-accent shrink-0 mt-0.5" />
                    <span>
                      Ta wersja zachowuje Twój oryginalny zamysł, rozwijając każdy z 4 podpunktów polecenia, wykorzystując naturalne łączniki (unfortunately, luckily) oraz bogatsze słownictwo spełniające standard 10/10 CKE.
                    </span>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (result.ulepszonaWersja) {
                        setText(result.ulepszonaWersja);
                        setNotice({
                          type: 'info',
                          message: 'Załadowano wzorcową wersję 10/10 do Twojego edytora.'
                        });
                        setMainView('editor');
                        setTimeout(() => setNotice(null), 4000);
                        textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    }}
                    className="text-xs font-bold text-matura-accent hover:underline flex items-center gap-1"
                  >
                    Wczytaj tę ulepszoną wersję do edytora pracy <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            )}

          </div>
        ) : (
          /* Interactive Empty State / Analysis Launchpad */
          <div className="h-full flex flex-col items-center justify-center border border-white/10 rounded-3xl bg-[#0F1B2D]/70 p-8 sm:p-12 text-center shadow-xl">
             <div className="w-20 h-20 rounded-2xl bg-matura-accent/15 flex items-center justify-center mb-5 border border-matura-accent/30 shadow-lg text-matura-accent">
               <BarChart3 size={40} />
             </div>
             
             <span className="text-[10px] font-bold uppercase tracking-widest text-matura-accent mb-1">
               Centrum Weryfikacji Egzaminacyjnej CKE
             </span>
             <h3 className="text-xl font-bold text-white mb-2">Raport i Analiza Twojej Pracy</h3>
             <p className="text-sm max-w-md leading-relaxed text-gray-300 mb-6">
               Kliknij poniżej, aby natychmiast wygenerować pełną analizę egzaminatora z uwagami, kryteriami punktowymi (0-10 pkt) oraz korektą błędów.
             </p>

             <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md mb-8">
               {wordCount > 0 ? (
                 <button
                   type="button"
                   onClick={() => handleGrade()}
                   disabled={isGrading}
                   className="flex-1 py-3 px-4 rounded-xl font-bold bg-matura-accent text-matura-bg hover:bg-yellow-400 text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all"
                 >
                   {isGrading ? <RefreshCw className="animate-spin" size={14} /> : <Sparkles size={14} />}
                   <span>Oceń wpisany tekst ({wordCount} słów)</span>
                 </button>
               ) : (
                 <button
                   type="button"
                   onClick={handleQuickAnalyzeSample}
                   disabled={isGrading}
                   className="flex-1 py-3 px-4 rounded-xl font-bold bg-matura-accent text-matura-bg hover:bg-yellow-400 text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all"
                 >
                   {isGrading ? <RefreshCw className="animate-spin" size={14} /> : <Award size={14} />}
                   <span>Wklej wzorzec i zobacz analizę 10/10</span>
                 </button>
               )}

               <button
                 type="button"
                 onClick={() => setMainView('editor')}
                 className="py-3 px-4 rounded-xl font-bold bg-white/5 hover:bg-white/10 text-gray-200 hover:text-white border border-white/10 text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
               >
                 <PenTool size={14} />
                 <span>Wróć do edytora</span>
               </button>
             </div>

             <div className="w-full max-w-lg bg-black/40 p-5 rounded-2xl border border-white/5 text-left text-xs text-gray-400 space-y-2.5">
               <div className="font-bold text-gray-300 uppercase tracking-wider text-[11px] mb-1">
                 Co zawiera oficjalny raport z analizy CKE?
               </div>
               <div className="flex items-center gap-2 text-gray-300">
                 <CheckCircle2 size={14} className="text-matura-accent shrink-0" />
                 <span>Oficjalne podsumowanie i uwagi egzaminatora CKE do całości pracy</span>
               </div>
               <div className="flex items-center gap-2 text-gray-300">
                 <CheckCircle2 size={14} className="text-matura-accent shrink-0" />
                 <span>Weryfikacja realizacji i rozwinięcia każdego z 4 podpunktów polecenia</span>
               </div>
               <div className="flex items-center gap-2 text-gray-300">
                 <CheckCircle2 size={14} className="text-matura-accent shrink-0" />
                 <span>Podział punktów: Treść (0-4), Spójność (0-2), Zakres (0-2), Poprawność (0-2)</span>
               </div>
               <div className="flex items-center gap-2 text-gray-300">
                 <CheckCircle2 size={14} className="text-matura-accent shrink-0" />
                 <span>Wykaz błędów z regułami gramatycznymi oraz wersja ulepszona na 10/10 pkt</span>
               </div>
             </div>
          </div>
        )}
      </div>
      )}

      </div>
    </div>
  );
};

const ScoreCard = ({ label, score, max, comment }: { label: string, score: number, max: number, comment: string }) => {
  const percentage = (score / max) * 100;
  const color = percentage === 100 ? 'text-green-400' : percentage >= 50 ? 'text-yellow-400' : 'text-red-400';
  const borderColor = percentage === 100 ? 'border-green-500/30' : percentage >= 50 ? 'border-yellow-500/30' : 'border-red-500/30';
  const bg = percentage === 100 ? 'bg-green-500' : percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className={`bg-[#0F1B2D] p-5 rounded-2xl border ${borderColor} flex flex-col justify-between shadow-sm hover:bg-[#13233b] transition-colors`}>
      <div className="flex justify-between items-center mb-3">
        <span className="text-[11px] font-bold uppercase text-gray-400 tracking-wider">{label}</span>
        <div className={`text-lg font-bold font-mono ${color}`}>{score}<span className="text-gray-500 text-sm">/{max}</span></div>
      </div>
      
      <div className="w-full h-1.5 bg-black/40 rounded-full mb-4 overflow-hidden">
        <div style={{ width: `${Math.max(5, percentage)}%` }} className={`h-full ${bg} rounded-full`}></div>
      </div>
      
      <p className="text-xs text-gray-300 leading-relaxed border-t border-white/5 pt-3 mt-auto font-normal">
        {comment}
      </p>
    </div>
  );
};

export default Writing;
