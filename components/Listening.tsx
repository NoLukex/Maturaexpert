import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  Headphones, 
  FileText, 
  ChevronRight, 
  Volume2, 
  HelpCircle,
  XCircle,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';
import { addXP, saveTaskResult, getStats, saveMistake, playFeedbackSound } from '../services/storageService';
import { playTextToSpeech } from '../services/geminiService';
import { useChatContext } from '../contexts/ChatContext';
import { LISTENING_TASKS } from '../services/listeningData';

const Listening: React.FC = () => {
  const [activeTaskId, setActiveTaskId] = useState(LISTENING_TASKS[0].id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const [showScript, setShowScript] = useState(false);
  const stopAudioRef = useRef<(() => void) | null>(null);
  
  const { setScreenContext } = useChatContext();

  // Load completion history on mount
  useEffect(() => {
    const stats = getStats();
    const completedTasks: Record<string, boolean> = {};
    
    stats.history.forEach(entry => {
      if (entry.module === 'listening') {
        completedTasks[entry.taskId] = true;
      }
    });
    setSubmitted(completedTasks);
  }, []);

  const activeTask = LISTENING_TASKS.find(t => t.id === activeTaskId)!;
  
  // Update AI Context
  useEffect(() => {
    if (activeTask) {
      setScreenContext(`
        MODUŁ: ROZUMIENIE ZE SŁUCHU
        Tytuł: ${activeTask.title}
        Polecenie: ${activeTask.description}
        
        TRANSKRYPCJA NAGRANIA (uczeń słucha audio, ale Ty widzisz tekst):
        "${activeTask.script}"
        
        PYTANIA:
        ${activeTask.questions.map(q => `${q.id}. ${q.text}`).join('\n')}
        
        Pomagaj uczniowi znaleźć w tekście słowa kluczowe, które wskazują na poprawną odpowiedź. Tłumacz trudne zwroty z transkrypcji.
      `);
    }
  }, [activeTask, setScreenContext]);

  // Audio handling
  useEffect(() => {
    // Stop audio when switching tasks or unmounting
    if (stopAudioRef.current) stopAudioRef.current();
    setIsPlaying(false);
    setIsLoadingAudio(false);
    setShowScript(false);
    return () => {
      if (stopAudioRef.current) stopAudioRef.current();
    }
  }, [activeTaskId]);

  const togglePlay = async () => {
    if (isPlaying) {
      if (stopAudioRef.current) stopAudioRef.current();
      setIsPlaying(false);
    } else {
      setIsLoadingAudio(true);
      try {
        const stopFn = await playTextToSpeech(activeTask.script, () => setIsPlaying(false));
        stopAudioRef.current = stopFn;
        setIsPlaying(true);
      } catch (e) {
        console.error("Audio playback failed", e);
      } finally {
        setIsLoadingAudio(false);
      }
    }
  };

  const handleAnswer = (questionId: number, value: string | number) => {
    if (submitted[activeTaskId]) return;
    setAnswers(prev => ({
      ...prev,
      [`${activeTaskId}-${questionId}`]: value
    }));
  };

  const checkAnswers = () => {
    setSubmitted(prev => ({ ...prev, [activeTaskId]: true }));
    let correctCount = 0;
    
    activeTask.questions.forEach(q => {
      const userAns = answers[`${activeTaskId}-${q.id}`];
      if (userAns === q.correctAnswer) {
        correctCount++;
      } else {
        // SAVE MISTAKE
        let correctLabel = String(q.correctAnswer);
        if (activeTask.type === 'choice' && typeof q.correctAnswer === 'number' && q.options) {
           correctLabel = q.options[q.correctAnswer];
        }
        
        let userLabel = String(userAns !== undefined ? userAns : "(brak)");
        if (activeTask.type === 'choice' && typeof userAns === 'number' && q.options) {
           userLabel = q.options[userAns];
        }

        saveMistake(
          'listening',
          q.text,
          userLabel,
          correctLabel,
          activeTask.title
        );
      }
    });

    playFeedbackSound(correctCount === activeTask.questions.length ? 'success' : 'error');

    // Pass the specific taskId to track completion persistence
    saveTaskResult('listening', correctCount, activeTask.questions.length, activeTask.id);
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

  const isTaskCompleted = submitted[activeTaskId];

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6 pb-6 lg:pb-0">
      
      {/* 1. Sidebar Navigation */}
      <div className="w-full lg:w-72 flex-shrink-0 flex flex-col gap-2">
        <div className="bg-[#0A1628] rounded-xl border border-white/5 p-4 hidden lg:block">
           <h3 className="text-matura-muted uppercase tracking-wider text-xs font-bold mb-4">Lista Zadań</h3>
           <div className="space-y-2">
             {LISTENING_TASKS.map((task, idx) => (
               <button
                 key={task.id}
                 onClick={() => setActiveTaskId(task.id)}
                 className={`w-full text-left p-3 rounded-lg flex items-center justify-between transition-all group ${
                   activeTaskId === task.id 
                    ? 'bg-matura-accent text-matura-bg font-bold shadow-lg shadow-yellow-500/10' 
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                 }`}
               >
                 <div className="flex items-center gap-3">
                   <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${activeTaskId === task.id ? 'bg-black/20 text-white' : 'bg-black/40'}`}>
                     {idx + 1}
                   </div>
                   <span className="text-sm truncate">{task.type === 'true_false' ? 'Prawda/Fałsz' : task.type === 'matching' ? 'Dobieranie' : 'Wybór'}</span>
                 </div>
                 {submitted[task.id] && <CheckCircle2 size={16} className={activeTaskId === task.id ? 'text-black/50' : 'text-green-500'} />}
               </button>
             ))}
           </div>
        </div>

        {/* Mobile Horizontal Scroll */}
        <div className="lg:hidden overflow-x-auto pb-2 flex gap-2">
            {LISTENING_TASKS.map((task, idx) => (
               <button
                 key={task.id}
                 onClick={() => setActiveTaskId(task.id)}
                 className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold border ${
                   activeTaskId === task.id 
                    ? 'bg-matura-accent border-matura-accent text-matura-bg' 
                    : 'bg-matura-card border-white/10 text-gray-400'
                 }`}
               >
                 Zadanie {idx + 1}
               </button>
             ))}
        </div>
      </div>

      {/* 2. Main Workspace */}
      <div className="flex-1 flex flex-col bg-[#0A1628] rounded-xl border border-white/5 overflow-hidden shadow-2xl relative">
        
        {/* Header & Audio Player */}
        <div className="bg-[#0F1B2D] border-b border-white/5 p-6 md:p-8 flex flex-col items-center text-center relative overflow-hidden">
           {/* Abstract Background Decoration */}
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-matura-accent via-purple-500 to-matura-accent opacity-50"></div>
           
           <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-2 relative z-10">{activeTask.title}</h2>
           <p className="text-matura-muted text-sm md:text-base max-w-2xl mb-8 relative z-10">{activeTask.description}</p>

           {/* Audio Player Controls */}
           <div className="flex items-center gap-6 relative z-10 w-full max-w-md justify-center">
              <button 
                onClick={togglePlay}
                disabled={isLoadingAudio}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all transform hover:scale-105 shadow-xl ${
                  isPlaying 
                  ? 'bg-red-500 text-white shadow-red-500/30' 
                  : 'bg-matura-accent text-matura-bg shadow-yellow-500/30'
                }`}
              >
                {isLoadingAudio ? (
                  <Loader2 size={32} className="animate-spin text-matura-bg"/>
                ) : isPlaying ? (
                  <Pause size={32} fill="currentColor" />
                ) : (
                  <Play size={32} fill="currentColor" className="ml-1" />
                )}
              </button>
              
              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden relative">
                 {isPlaying && (
                   <div className="absolute inset-0 bg-gradient-to-r from-matura-accent to-purple-500 animate-pulse w-full h-full opacity-70"></div>
                 )}
                 <div className="absolute inset-0 flex items-center justify-around opacity-30">
                    {[...Array(20)].map((_, i) => <div key={i} className="w-0.5 h-full bg-white"></div>)}
                 </div>
              </div>
           </div>

           {/* Transcript Toggle */}
           <button 
             onClick={() => setShowScript(!showScript)}
             className="mt-6 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-white flex items-center gap-2 transition-colors"
           >
             {showScript ? <EyeOff size={14} /> : <Eye size={14} />}
             {showScript ? 'Ukryj transkrypcję' : 'Pokaż transkrypcję'}
           </button>

           {showScript && (
             <div className="mt-4 p-4 bg-black/20 rounded-xl border border-white/5 text-left text-gray-300 text-sm italic leading-relaxed max-w-2xl animate-fade-in">
               {activeTask.script}
             </div>
           )}
        </div>

        {/* Questions Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 bg-[#0A1628]">
          <div className="max-w-3xl mx-auto space-y-6 pb-20">
            
            {/* --- Matching Options Panel (Sticky if matching) --- */}
            {activeTask.type === 'matching' && activeTask.matchingOptions && (
              <div className="bg-[#112240] p-4 rounded-xl border border-white/10 mb-6">
                 <h4 className="text-matura-accent text-xs font-bold uppercase mb-3 flex items-center gap-2">
                   <HelpCircle size={14}/> Opcje do wyboru:
                 </h4>
                 <div className="grid gap-2">
                   {activeTask.matchingOptions.map(opt => (
                     <div key={opt} className="text-sm text-gray-300 bg-black/20 p-2 rounded border border-white/5">
                       {opt}
                     </div>
                   ))}
                 </div>
              </div>
            )}

            {/* Questions List */}
            {activeTask.questions.map((q, idx) => {
               const userAnswer = answers[`${activeTask.id}-${q.id}`];
               
               return (
                 <div key={q.id} className="bg-[#0F1B2D] p-5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                   <div className="mb-4 text-lg text-white font-medium flex items-start gap-3">
                     <span className="text-matura-accent font-bold">{idx + 1}.</span>
                     {q.text}
                   </div>

                   {/* Question Interaction Types */}
                   
                   {/* TYPE: TRUE / FALSE */}
                   {activeTask.type === 'true_false' && (
                     <div className="flex gap-4">
                       {['True', 'False'].map(opt => {
                         const isSelected = userAnswer === opt;
                         let btnClass = "flex-1 py-3 px-4 rounded-lg border font-bold text-sm transition-all ";
                         
                         if (isTaskCompleted) {
                           if (opt === q.correctAnswer) btnClass += "bg-green-500/20 border-green-500 text-green-400";
                           else if (isSelected && opt !== q.correctAnswer) btnClass += "bg-red-500/20 border-red-500 text-red-400 opacity-50";
                           else btnClass += "border-white/5 bg-black/20 text-gray-600 opacity-30";
                         } else {
                           btnClass += isSelected 
                            ? "bg-blue-600 border-blue-500 text-white shadow-lg" 
                            : "bg-[#0A1628] border-white/10 text-gray-400 hover:bg-white/5 hover:text-white";
                         }

                         return (
                           <button 
                             key={opt}
                             disabled={isTaskCompleted}
                             onClick={() => handleAnswer(q.id, opt)}
                             className={btnClass}
                           >
                             {opt === 'True' ? 'PRAWDA' : 'FAŁSZ'}
                           </button>
                         );
                       })}
                     </div>
                   )}

                   {/* TYPE: MULTIPLE CHOICE */}
                   {activeTask.type === 'choice' && q.options && (
                     <div className="grid gap-2">
                       {q.options.map((opt, oIdx) => {
                         const isSelected = userAnswer === oIdx;
                         const isCorrectOpt = oIdx === q.correctAnswer;
                         
                         let btnClass = "w-full text-left p-3 rounded-lg border text-sm transition-all flex items-center gap-3 ";

                         if (isTaskCompleted) {
                           if (isCorrectOpt) btnClass += "bg-green-500/20 border-green-500 text-green-400";
                           else if (isSelected) btnClass += "bg-red-500/20 border-red-500 text-red-400";
                           else btnClass += "border-white/5 bg-black/20 text-gray-600 opacity-50";
                         } else {
                            btnClass += isSelected
                              ? "bg-blue-600 border-blue-500 text-white"
                              : "bg-[#0A1628] border-white/10 text-gray-400 hover:bg-white/5 hover:text-gray-200";
                         }

                         return (
                           <button
                             key={oIdx}
                             disabled={isTaskCompleted}
                             onClick={() => handleAnswer(q.id, oIdx)}
                             className={btnClass}
                           >
                             <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                               isSelected || (isTaskCompleted && isCorrectOpt) ? 'border-current' : 'border-gray-600'
                             }`}>
                               {(isSelected || (isTaskCompleted && isCorrectOpt)) && <div className="w-2.5 h-2.5 rounded-full bg-current"></div>}
                             </div>
                             {opt}
                           </button>
                         )
                       })}
                     </div>
                   )}

                   {/* TYPE: MATCHING */}
                   {activeTask.type === 'matching' && activeTask.matchingOptions && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                        {['A','B','C','D','E'].map(letter => {
                           const isSelected = userAnswer === letter;
                           const isCorrectLetter = letter === q.correctAnswer;
                           
                           let btnClass = "py-2 rounded-lg border font-bold text-center transition-all ";

                           if (isTaskCompleted) {
                              if (isCorrectLetter) btnClass += "bg-green-500/20 border-green-500 text-green-400";
                              else if (isSelected) btnClass += "bg-red-500/20 border-red-500 text-red-400";
                              else btnClass += "border-white/5 bg-black/20 text-gray-600 opacity-30";
                           } else {
                              btnClass += isSelected
                                ? "bg-blue-600 border-blue-500 text-white"
                                : "bg-[#0A1628] border-white/10 text-gray-400 hover:bg-white/5 hover:text-white";
                           }

                           return (
                             <button
                               key={letter}
                               disabled={isTaskCompleted}
                               onClick={() => handleAnswer(q.id, letter)}
                               className={btnClass}
                             >
                               {letter}
                             </button>
                           )
                        })}
                      </div>
                   )}
                   
                   {/* Feedback Message */}
                   {isTaskCompleted && (
                      <div className="mt-3 text-sm flex items-center gap-2">
                        {userAnswer === q.correctAnswer ? (
                          <span className="text-green-500 font-bold flex items-center"><CheckCircle2 size={16} className="mr-1"/> Dobrze!</span>
                        ) : (
                          <span className="text-red-400 font-bold flex items-center">
                            <XCircle size={16} className="mr-1"/> 
                            Źle. Poprawna odp: <span className="text-white ml-1 bg-white/10 px-1 rounded">
                              {activeTask.type === 'choice' && q.options 
                                ? String.fromCharCode(65 + (q.correctAnswer as number)) 
                                : q.correctAnswer}
                            </span>
                          </span>
                        )}
                      </div>
                   )}

                 </div>
               );
            })}
          </div>
        </div>

        {/* 3. Sticky Action Footer */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-[#0A1628]/90 backdrop-blur-xl p-4 flex justify-end z-20">
             {!submitted[activeTaskId] ? (
               <button 
                 onClick={checkAnswers}
                 className="px-8 py-3 bg-matura-accent text-matura-bg font-bold rounded-xl hover:bg-yellow-400 transition-all shadow-lg flex items-center gap-2"
               >
                 <CheckCircle2 size={20} /> Sprawdź odpowiedzi
               </button>
             ) : (
                <div className="flex items-center gap-4 w-full justify-between md:justify-end">
                   <div className="text-green-400 font-bold text-sm hidden md:block">
                      Zadanie ukończone
                   </div>
                    <button 
                      onClick={retryTask}
                      className="px-6 py-3 bg-blue-600/20 border border-blue-500/40 text-blue-200 font-bold rounded-xl hover:bg-blue-600/30 transition-all flex items-center gap-2"
                    >
                      <RotateCcw size={18} /> Powtórz zadanie
                    </button>
                    <button 
                      onClick={() => {
                         // Go to next task logic
                         const currentIdx = LISTENING_TASKS.findIndex(t => t.id === activeTaskId);
                        if (currentIdx < LISTENING_TASKS.length - 1) {
                          setActiveTaskId(LISTENING_TASKS[currentIdx + 1].id);
                        }
                     }}
                     disabled={LISTENING_TASKS.findIndex(t => t.id === activeTaskId) === LISTENING_TASKS.length - 1}
                     className="px-6 py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     Następne zadanie <ChevronRight size={18} />
                   </button>
                </div>
             )}
        </div>

      </div>
    </div>
  );
};

export default Listening;
