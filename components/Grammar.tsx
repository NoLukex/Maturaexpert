
import React, { useState, useEffect } from 'react';
import { GRAMMAR_SECTIONS } from '../services/grammarData';
import { addXP, saveTaskResult, getStats, saveMistake } from '../services/storageService';
import { useChatContext } from '../contexts/ChatContext';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  CheckCircle2, 
  XCircle, 
  PenTool, 
  MessageSquare, 
  WholeWord, 
  Shuffle, 
  LayoutList, 
  ChevronDown, 
  ChevronUp,
  Info,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowRight,
  Copy,
  Sparkles,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { GrammarTask } from '../types';

const Grammar: React.FC = () => {
  const [sections, setSections] = useState(GRAMMAR_SECTIONS);
  const [activeSectionId, setActiveSectionId] = useState(GRAMMAR_SECTIONS[0].id);
  const [activeTaskId, setActiveTaskId] = useState<string>(GRAMMAR_SECTIONS[0].tasks[0].id);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const [showDescription, setShowDescription] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { setScreenContext } = useChatContext();

  // Load completion history on mount
  useEffect(() => {
    const stats = getStats();
    const completedTasks: Record<string, boolean> = {};
    
    stats.history.forEach(entry => {
      if (entry.module === 'grammar') {
        completedTasks[entry.taskId] = true;
      }
    });
    setSubmitted(completedTasks);
  }, []);

  const activeSection = sections.find(s => s.id === activeSectionId);
  const activeTask = activeSection?.tasks.find(t => t.id === activeTaskId);
  
  // Update AI Context
  useEffect(() => {
    if (activeTask) {
      const qs = activeTask.questions.map(q => `${q.id}. ${q.prefix || ''} ${q.text || ''} ${q.suffix || ''}`).join('\n');
      setScreenContext(`
        MODUŁ: GRAMATYKA
        Typ: ${activeSection?.title}
        Polecenie: ${activeTask.instruction}
        Kontekst/Reguła: ${activeTask.content || activeSection?.description}
        
        Pytania widoczne na ekranie:
        ${qs}
        
        Jeśli uczeń pyta o konkretny przykład, wyjaśnij zasadę gramatyczną (np. dlaczego używamy tego czasu), ale nie podawaj odpowiedzi wprost, chyba że uczeń wyraźnie o to poprosi po próbie rozwiązania.
      `);
    }
  }, [activeTask, activeSection, setScreenContext]);

  // Auto-select first task when section changes
  useEffect(() => {
    if (activeSection && activeSection.tasks.length > 0) {
      const taskExists = activeSection.tasks.find(t => t.id === activeTaskId);
      if (!taskExists) {
        setActiveTaskId(activeSection.tasks[0].id);
      }
    }
  }, [activeSectionId, activeSection]);

  const generateAiTask = async () => {
    if (isGenerating || !activeSection) return;
    setIsGenerating(true);

    try {
      const ai = new GoogleGenAI({ apiKey: (window as any).process?.env?.API_KEY || '' });
      
      const prompt = `
        Jesteś nauczycielem języka angielskiego.
        Wygeneruj 5 nowych przykładów do zadania gramatycznego typu: "${activeSection.title}".
        Poziom: A2/B1 (Matura Podstawowa).
        
        Opis zadania: ${activeSection.description}.
        
        Zwróć TYLKO JSON w formacie pasującym do tego schematu:
        {
          "instruction": "Tytuł zadania (np. Zestaw AI: Czasowniki nieregularne)",
          "questions": [
            {
              "id": 1,
              "text": "Tekst pytania",
              "prefix": "Początek zdania (jeśli dotyczy tłumaczenia)",
              "suffix": "Koniec zdania (jeśli dotyczy tłumaczenia)",
              "options": ["Opcja A", "Opcja B", "Opcja C"] (tylko dla wyboru wielokrotnego),
              "correctAnswer": "poprawna odpowiedź" (string) lub ["odp1", "odp2"] (array stringów)
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

      const generatedData = JSON.parse(response.text || '{}');
      
      if (generatedData.questions && generatedData.questions.length > 0) {
        const newTaskId = `ai-${Date.now()}`;
        const newTask: GrammarTask = {
          id: newTaskId,
          type: activeSection.tasks[0].type, // Inherit type from first task in section
          instruction: generatedData.instruction || "Zestaw wygenerowany przez AI",
          questions: generatedData.questions
        };

        // Update state to include new task
        setSections(prev => prev.map(s => {
          if (s.id === activeSectionId) {
            return { ...s, tasks: [...s.tasks, newTask] };
          }
          return s;
        }));

        setActiveTaskId(newTaskId);
        setSubmitted(prev => ({ ...prev, [newTaskId]: false })); // Reset submission for new task
      }

    } catch (e) {
      console.error("AI Generation Error", e);
      alert("Nie udało się wygenerować zadania. Spróbuj ponownie.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInputChange = (taskId: string, questionId: number, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [`${taskId}-${questionId}`]: value
    }));
  };

  const checkAnswers = (taskId: string) => {
    setSubmitted(prev => ({ ...prev, [taskId]: true }));
    
    const task = activeSection?.tasks.find(t => t.id === taskId);
    if (task) {
      let correctCount = 0;
      task.questions.forEach(q => {
        const userAns = answers[`${taskId}-${q.id}`];
        const correct = isCorrect(userAns, q.correctAnswer);
        if (correct) {
          correctCount++;
        } else {
          // SAVE MISTAKE
          saveMistake(
            'grammar',
            `${q.prefix || ''} ${q.text || ''} ${q.suffix || ''}`.trim(),
            userAns || '',
            Array.isArray(q.correctAnswer) ? q.correctAnswer[0] : q.correctAnswer,
            task.instruction
          );
        }
      });
      
      // Pass the specific taskId to track completion persistence
      saveTaskResult('grammar', correctCount, task.questions.length, taskId);
    }
  };

  const isCorrect = (userAns: string, correct: string | string[]) => {
    if (!userAns) return false;
    const normalizedUser = userAns.trim().toLowerCase();
    
    if (Array.isArray(correct)) {
      return correct.some(c => c.toLowerCase() === normalizedUser);
    }
    return correct.toLowerCase() === normalizedUser;
  };

  const getIcon = (id: string, size = 18) => {
    switch(id) {
      case 'translations': return <PenTool className="mr-3 flex-shrink-0" size={size}/>;
      case 'minidialogues': return <MessageSquare className="mr-3 flex-shrink-0" size={size}/>;
      case 'abc_grammar': return <WholeWord className="mr-3 flex-shrink-0" size={size}/>;
      case 'paraphrase': return <Shuffle className="mr-3 flex-shrink-0" size={size}/>;
      case 'double_meaning': return <Copy className="mr-3 flex-shrink-0" size={size}/>;
      default: return <Info className="mr-3 flex-shrink-0" size={size}/>;
    }
  };

  if (!activeSection || !activeTask) return <div className="p-8 text-center text-gray-400">Ładowanie modułu...</div>;

  return (
    <div className="flex h-full bg-[#050B14]">
      
      {/* 1. Collapsible Sidebar Navigation */}
      <div 
        className={`flex-shrink-0 border-r border-white/5 bg-[#0A1628] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden flex flex-col ${
          isSidebarOpen ? 'w-80 opacity-100 translate-x-0' : 'w-0 opacity-0 -translate-x-10'
        }`}
      >
        <div className="p-6 border-b border-white/5">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Kategorie zadań</h3>
        </div>
        
        <nav className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
           {sections.map(section => (
            <button
              key={section.id}
              onClick={() => {
                setActiveSectionId(section.id);
                setIsSidebarOpen(false); 
              }}
              className={`w-full text-left px-4 py-4 rounded-xl flex items-center transition-all group relative overflow-hidden ${
                activeSectionId === section.id 
                  ? 'bg-gradient-to-r from-matura-accent/20 to-transparent text-matura-accent border-l-4 border-matura-accent' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white border-l-4 border-transparent'
              }`}
            >
              <span className={`transition-colors ${activeSectionId === section.id ? 'text-matura-accent' : 'text-gray-500 group-hover:text-white'}`}>
                {getIcon(section.id, 20)}
              </span>
              <span className="font-medium text-sm whitespace-nowrap">{section.title}</span>
              {activeSectionId === section.id && <ArrowRight size={16} className="ml-auto opacity-50" />}
            </button>
          ))}
        </nav>
      </div>

      {/* 2. Main Workspace */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-[#050B14]">
        
        {/* Workspace Header */}
        <header className="bg-[#0A1628]/80 backdrop-blur-md border-b border-white/5 p-4 md:px-8 md:py-5 shrink-0 z-30 flex flex-col gap-4 shadow-sm">
           <div className="flex items-start gap-4">
             
             {/* Toggle Sidebar */}
             <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`mt-0.5 p-2 rounded-lg transition-all border border-white/5 hover:border-white/20 ${isSidebarOpen ? 'bg-matura-accent/10 text-matura-accent' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                title={isSidebarOpen ? "Pełny ekran" : "Pokaż kategorie"}
             >
                {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
             </button>

             <div className="flex-1 min-w-0">
               <div className="flex items-center justify-between cursor-pointer group" onClick={() => setShowDescription(!showDescription)}>
                 <h2 className="text-2xl font-bold font-display text-white flex items-center gap-3 truncate">
                   {activeSection.title}
                 </h2>
                 <button className="text-gray-500 group-hover:text-white transition-colors p-1 bg-white/5 rounded-full">
                    {showDescription ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                 </button>
               </div>
               
               {/* Description Accordion */}
               <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showDescription ? 'max-h-24 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                 <p className="text-sm text-gray-400 max-w-2xl leading-relaxed">{activeSection.description}</p>
               </div>
             </div>
           </div>

           {/* Task Selector Tabs */}
           <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar ml-12">
             {activeSection.tasks.map((task, index) => {
               const label = task.instruction.includes(':') 
                  ? task.instruction.split(':')[0] 
                  : task.id.startsWith('ai') ? 'AI' : `Zestaw ${index + 1}`;
               
               const isCompleted = submitted[task.id];
               const isActive = activeTaskId === task.id;
               const isAI = task.id.startsWith('ai');

               return (
                <button
                  key={task.id}
                  onClick={() => setActiveTaskId(task.id)}
                  className={`flex items-center px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap border uppercase tracking-wider ${
                    isActive
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/50'
                      : isCompleted
                        ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20'
                        : isAI 
                          ? 'bg-purple-600/20 border-purple-500/30 text-purple-300 hover:bg-purple-600/30'
                          : 'bg-[#0F1B2D] border-white/5 text-gray-500 hover:bg-white/5 hover:text-gray-300'
                  }`}
                >
                  {isAI ? <Sparkles size={14} className="mr-2"/> : <LayoutList size={14} className="mr-2"/>}
                  {label}
                  {isCompleted && <CheckCircle2 size={14} className="ml-2 text-green-500" />}
                </button>
               );
             })}
             
             {/* GENERATE BUTTON */}
             <button 
               onClick={generateAiTask}
               disabled={isGenerating}
               className="flex items-center px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap border uppercase tracking-wider bg-matura-accent text-matura-bg border-matura-accent hover:bg-yellow-400 hover:border-yellow-400 shadow-lg shadow-yellow-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-wait"
             >
               {isGenerating ? <Loader2 size={14} className="mr-2 animate-spin"/> : <Sparkles size={14} className="mr-2"/>}
               {isGenerating ? 'Generuję...' : 'Nowy zestaw (AI)'}
             </button>
           </div>
        </header>

        {/* Scrollable Question Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 bg-[#050B14]">
            <div className="max-w-4xl mx-auto pb-24 animate-slide-up">
              
              {/* Context / Reading Material */}
              {activeTask.content && (
                <div className="mb-8 p-6 bg-[#0F1B2D] rounded-2xl border border-white/5 shadow-inner">
                  <div className="flex items-center gap-2 mb-3 text-matura-accent font-bold text-xs uppercase tracking-widest">
                    <Info size={14} /> Kontekst
                  </div>
                  <p className="text-gray-300 italic leading-relaxed whitespace-pre-line font-serif text-lg">
                    {activeTask.content}
                  </p>
                </div>
              )}

              {/* Task Instruction */}
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">{activeTask.instruction}</span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                {activeTask.questions.map((q, idx) => {
                  const userAnswer = answers[`${activeTask.id}-${q.id}`] || '';
                  const isTaskSubmitted = submitted[activeTask.id];
                  const status = isTaskSubmitted 
                    ? isCorrect(userAnswer, q.correctAnswer) ? 'correct' : 'wrong'
                    : 'neutral';

                  return (
                    <div key={q.id} className={`p-5 rounded-2xl border transition-all duration-300 ${
                       status === 'correct' ? 'bg-green-900/10 border-green-500/30' : 
                       status === 'wrong' ? 'bg-red-900/10 border-red-500/30' :
                       'bg-[#0F1B2D] border-white/5 hover:border-white/10 shadow-sm'
                    }`}>
                      <div className="flex items-start gap-4">
                        {/* Question Number */}
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-1.5 flex-shrink-0 ${
                          status === 'correct' ? 'bg-green-500 text-white' :
                          status === 'wrong' ? 'bg-red-500 text-white' :
                          'bg-white/5 text-gray-500'
                        }`}>
                           {idx + 1}
                        </div>

                        <div className="flex-1 space-y-3">
                          
                          {/* --- TRANSLATION TYPE UI --- */}
                          {activeTask.type === 'translation' && (
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-3 text-lg leading-relaxed text-gray-300">
                              <span>{q.prefix}</span>
                              <div className="relative group">
                                <input
                                  type="text"
                                  disabled={isTaskSubmitted}
                                  value={userAnswer}
                                  onChange={(e) => handleInputChange(activeTask.id, q.id, e.target.value)}
                                  placeholder={q.text} 
                                  className={`px-4 py-2 rounded-lg font-medium outline-none transition-all w-64 ${
                                    status === 'correct' ? 'bg-green-500/20 text-green-400 border border-green-500/50' :
                                    status === 'wrong' ? 'bg-red-500/20 text-red-400 border border-red-500/50' :
                                    'bg-black/20 text-white border border-white/10 focus:border-matura-accent focus:bg-matura-accent/5 focus:w-72 placeholder-gray-600'
                                  }`}
                                />
                                {status === 'correct' && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 pointer-events-none animate-pulse" size={16} />}
                                {status === 'wrong' && <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 pointer-events-none" size={16} />}
                              </div>
                              <span>{q.suffix}</span>
                            </div>
                          )}

                          {/* --- CHOICE TYPE UI --- */}
                          {activeTask.type === 'choice' && (
                            <div className="w-full">
                              <p className="font-medium text-gray-200 text-lg mb-4 flex items-start gap-2 whitespace-pre-line leading-relaxed">
                                 {q.text}
                              </p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {q.options?.map(opt => (
                                  <label 
                                    key={opt} 
                                    className={`group flex items-center p-3 rounded-xl cursor-pointer transition-all border relative overflow-hidden ${
                                      userAnswer === opt 
                                        ? 'bg-blue-600/10 border-blue-500' 
                                        : 'bg-[#0A1628] border-white/5 hover:bg-white/5 hover:border-white/10'
                                    } ${isTaskSubmitted ? 'cursor-default' : ''}`}
                                  >
                                    <input 
                                      type="radio" 
                                      name={`${activeTask.id}-${q.id}`}
                                      value={opt}
                                      disabled={isTaskSubmitted}
                                      checked={userAnswer === opt}
                                      onChange={(e) => handleInputChange(activeTask.id, q.id, e.target.value)}
                                      className="hidden"
                                    />
                                    <div className={`w-5 h-5 rounded-full border-2 mr-3 flex-shrink-0 flex items-center justify-center transition-all ${
                                      userAnswer === opt 
                                        ? 'border-blue-500 bg-blue-500 scale-110' 
                                        : 'border-gray-600 group-hover:border-gray-400'
                                    }`}>
                                      {userAnswer === opt && <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />}
                                    </div>
                                    <span className={`text-sm font-medium transition-colors ${userAnswer === opt ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>{opt}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Correct Answer Display */}
                          {status === 'wrong' && (
                             <div className="mt-2 text-sm bg-green-500/5 border border-green-500/10 rounded-lg p-3 inline-block">
                                <span className="text-green-500 font-bold text-xs uppercase tracking-wide mb-1 block">Poprawna odpowiedź:</span>
                                <span className="text-gray-200 font-mono">{Array.isArray(q.correctAnswer) ? q.correctAnswer[0] : q.correctAnswer}</span>
                             </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
        </div>

        {/* 3. Sticky Action Footer */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-[#0A1628]/90 backdrop-blur-xl p-4 md:px-8 z-40 shadow-2xl">
           <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="hidden md:block">
                 {submitted[activeTask.id] && (
                   <div className="flex items-center text-green-400 text-sm font-bold animate-fade-in">
                     <CheckCircle2 className="mr-2" size={18}/> 
                     Zadanie ukończone. Zdobyto XP!
                   </div>
                 )}
              </div>
              
              {!submitted[activeTask.id] ? (
                <button 
                  onClick={() => checkAnswers(activeTask.id)}
                  className="w-full md:w-auto px-10 py-3 bg-matura-accent text-matura-bg font-bold rounded-xl hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2 transform active:scale-95"
                >
                  <CheckCircle2 size={20} />
                  Sprawdź odpowiedzi
                </button>
              ) : (
                <button 
                   onClick={() => {
                     // Try to find next manual or AI task
                     const currentIndex = activeSection.tasks.findIndex(t => t.id === activeTask.id);
                     if (currentIndex < activeSection.tasks.length - 1) {
                       setActiveTaskId(activeSection.tasks[currentIndex + 1].id);
                     } else {
                       // Logic to generate NEW AI task automatically if at end
                       generateAiTask();
                     }
                   }}
                   className="w-full md:w-auto px-8 py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all border border-white/5 flex items-center justify-center gap-2"
                >
                   {isGenerating ? <Loader2 className="animate-spin" size={18}/> : <ArrowRight size={18} />}
                   {isGenerating ? 'Generuję...' : 'Następne / Generuj nowe'}
                </button>
              )}
           </div>
        </div>
      </main>
    </div>
  );
};

export default Grammar;
