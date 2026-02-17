import React, { useState, useEffect, useRef } from 'react';
import { EXAMS, ExamTask, FullExam } from '../services/examData';
import { gradeWritingTask, generateExamReport, ExamReport, playTextToSpeech } from '../services/geminiService';
import { addXP, saveTaskResult } from '../services/storageService';
import { useChatContext } from '../contexts/ChatContext';
import { 
  Timer, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  FileText,
  Headphones,
  HelpCircle,
  XCircle,
  Trophy,
  BrainCircuit,
  Target,
  BarChart3,
  BookOpen,
  ArrowRight,
  Loader2,
  PenTool
} from 'lucide-react';

const Exam: React.FC = () => {
  const [selectedExam, setSelectedExam] = useState<FullExam | null>(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [examStatus, setExamStatus] = useState<'intro' | 'active' | 'grading' | 'finished'>('intro');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [writingResult, setWritingResult] = useState<any>(null);
  const [score, setScore] = useState(0);
  const [examReport, setExamReport] = useState<ExamReport | null>(null);
  const [gradingStep, setGradingStep] = useState<string>('');
  
  const stopAudioRef = useRef<(() => void) | null>(null);
  const { setScreenContext } = useChatContext();

  // --- TIMER ---
  useEffect(() => {
    let timer: any;
    if (examStatus === 'active' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && examStatus === 'active') {
      finishExam();
    }
    return () => clearInterval(timer);
  }, [examStatus, timeLeft]);

  // --- AUDIO CLEANUP ---
  useEffect(() => {
    return () => {
      if (stopAudioRef.current) stopAudioRef.current();
    };
  }, []);

  // Stop audio when changing tasks
  useEffect(() => {
    if (stopAudioRef.current) stopAudioRef.current();
    setIsPlaying(false);
    setIsLoadingAudio(false);
  }, [currentSectionIndex, currentTaskIndex]);

  // Update AI Context
  useEffect(() => {
    if (examStatus === 'active' && selectedExam) {
      const currentSection = selectedExam.sections[currentSectionIndex];
      const currentTask = currentSection.tasks[currentTaskIndex];

      setScreenContext(`
        TRYB: EGZAMIN MATURALNY (PRÓBNY)
        Arkusz: ${selectedExam.title}
        Sekcja: ${currentSection.name}
        Zadanie: ${currentTask.title}
        Polecenie: ${currentTask.instruction}
        
        TREŚĆ (Audio Script / Tekst):
        "${(currentTask.script || currentTask.readingText || 'Brak dodatkowego tekstu').substring(0, 1000)}..."
        
        Ponieważ jest to tryb egzaminacyjny, NIE PODAWAJ ODPOWIEDZI. Jedynie naprowadzaj, wyjaśniaj słówka lub strategie rozwiązywania zadań.
        Pozostały czas: ${Math.floor(timeLeft / 60)} min.
      `);
    } else {
      setScreenContext('TRYB EGZAMINU: Menu główne lub Raport końcowy.');
    }
  }, [examStatus, selectedExam, currentSectionIndex, currentTaskIndex, timeLeft, setScreenContext]);

  const toggleAudio = async (text: string) => {
    if (isPlaying) {
      if (stopAudioRef.current) stopAudioRef.current();
      setIsPlaying(false);
    } else {
      setIsLoadingAudio(true);
      try {
        const stopFn = await playTextToSpeech(text, () => setIsPlaying(false));
        stopAudioRef.current = stopFn;
        setIsPlaying(true);
      } catch (e) {
        console.error("Exam audio failed", e);
      } finally {
        setIsLoadingAudio(false);
      }
    }
  };

  // --- NAVIGATION ---
  const startExam = (exam: FullExam) => {
    setSelectedExam(exam);
    setTimeLeft(exam.duration * 60);
    setExamStatus('active');
    setCurrentSectionIndex(0);
    setCurrentTaskIndex(0);
    setAnswers({});
    setWritingResult(null);
    setExamReport(null);
    setScore(0);
  };

  const handleAnswer = (taskId: string, questionId: number | string, value: any) => {
    if (examStatus !== 'active') return;
    setAnswers(prev => ({
      ...prev,
      [`${taskId}-${questionId}`]: value
    }));
  };

  // --- GRADING ---
  const finishExam = async () => {
    if (!selectedExam) return;
    if (stopAudioRef.current) stopAudioRef.current(); // Stop audio
    setExamStatus('grading');

    setGradingStep('Sprawdzanie klucza odpowiedzi...');
    await new Promise(resolve => setTimeout(resolve, 1500)); // UX delay

    let closedPoints = 0;
    const mistakes: string[] = [];

    // Grade Closed Tasks
    selectedExam.sections.forEach(section => {
      section.tasks.forEach(task => {
        if (task.type === 'writing') return; // Handled separately

        let taskMistakes = 0;
        task.questions?.forEach(q => {
          const userAns = answers[`${task.id}-${q.id}`];
          if (!userAns) {
            taskMistakes++;
            return;
          }

          // Open questions (text input) - simple normalization
          if (Array.isArray(q.correctAnswer)) {
             const normalizedUser = String(userAns).trim().toLowerCase();
             const isCorrect = q.correctAnswer.some((ans: string) => String(ans).toLowerCase() === normalizedUser);
             if (isCorrect) closedPoints++;
             else taskMistakes++;
          } 
          // Closed questions
          else {
             if (String(userAns) === String(q.correctAnswer)) closedPoints++;
             else taskMistakes++;
          }
        });

        if (taskMistakes > 0) {
          mistakes.push(task.title);
        }
      });
    });

    // Grade Writing Task (AI)
    const writingTask = selectedExam.sections.flatMap(s => s.tasks).find(t => t.type === 'writing');
    let writingScore = 0;
    
    if (writingTask && writingTask.writingTask) {
      const userText = answers[`${writingTask.id}-writing`] || '';
      if (userText.length > 20) {
        setGradingStep('Egzaminator (AI) ocenia wypracowanie...');
        try {
          const assessment = await gradeWritingTask(writingTask.writingTask.instruction, userText);
          setWritingResult(assessment);
          writingScore = assessment.suma;
        } catch (e) {
          console.error("AI Grading failed", e);
          setWritingResult({ suma: 0, podsumowanie: "Błąd połączenia z AI. Sprawdź klucz API.", tresc: {}, spojnosc: {}, zakres: {}, poprawnosc: {}, wskazowki: [] });
        }
      } else {
        mistakes.push("Wypowiedź pisemna (brak tekstu lub za krótki)");
      }
    }

    const finalScore = closedPoints + writingScore;
    
    // Save Result to Stats with the specific EXAM ID
    saveTaskResult('exam', finalScore, selectedExam.totalScore, selectedExam.id);

    // Generate Report
    setGradingStep('Generowanie raportu końcowego...');
    const report = await generateExamReport(
      selectedExam.title,
      finalScore,
      selectedExam.totalScore,
      mistakes,
      writingScore
    );
    setExamReport(report);

    setScore(finalScore);
    setExamStatus('finished');
  };

  // --- RENDERERS ---

  const renderTimer = () => {
    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;
    return (
      <div className={`font-mono text-xl font-bold flex items-center gap-2 ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-matura-accent'}`}>
        <Timer />
        {hours}:{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </div>
    );
  };

  if (examStatus === 'intro') {
    return (
      <div className="max-w-5xl mx-auto p-6 grid gap-8">
        <div className="text-center mb-8">
           <h2 className="text-4xl font-display font-bold text-white mb-2">Symulacja Matury</h2>
           <p className="text-gray-400">Wybierz arkusz i sprawdź swoją wiedzę w warunkach egzaminacyjnych.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {EXAMS.map(exam => (
            <div key={exam.id} className="bg-[#112240] p-8 rounded-3xl border border-white/5 hover:border-matura-accent transition-all group flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:bg-matura-accent/10 transition-colors"></div>
              
              <div className="flex justify-between items-start mb-6 z-10">
                <div>
                  <h3 className="text-2xl font-bold text-white group-hover:text-matura-accent transition-colors">{exam.title}</h3>
                  <p className="text-gray-400 text-sm mt-1">{exam.date}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                   <span className="bg-matura-accent text-matura-bg px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                     {exam.totalScore} PKT
                   </span>
                </div>
              </div>
              
              <div className="flex-1 space-y-4 mb-8 z-10">
                 <div className="flex items-center gap-3 text-gray-300">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-matura-accent"><Timer size={18}/></div>
                    <span>{exam.duration} minut</span>
                 </div>
                 <div className="flex items-center gap-3 text-gray-300">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-matura-accent"><FileText size={18}/></div>
                    <span>{exam.sections.length} części (Słuchanie, Czytanie, Pisanie)</span>
                 </div>
              </div>

              <button 
                onClick={() => startExam(exam)}
                className="w-full py-4 bg-white/5 hover:bg-matura-accent text-white hover:text-matura-bg font-bold rounded-2xl transition-all border border-white/10 hover:border-transparent flex items-center justify-center gap-2"
              >
                Rozpocznij Egzamin <ArrowRight size={18}/>
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (examStatus === 'grading') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white space-y-6">
        <div className="relative">
           <div className="w-24 h-24 border-4 border-white/10 border-t-matura-accent rounded-full animate-spin"></div>
           <div className="absolute inset-0 flex items-center justify-center">
             <BrainCircuit size={32} className="text-matura-accent animate-pulse"/>
           </div>
        </div>
        <div className="text-center space-y-2">
           <h2 className="text-2xl font-bold">{gradingStep}</h2>
           <p className="text-gray-400 text-sm">Proszę nie zamykać okna.</p>
        </div>
      </div>
    );
  }

  if (examStatus === 'finished' && selectedExam && examReport) {
    const percentage = Math.round((score / selectedExam.totalScore) * 100);
    const passed = percentage >= 30;

    return (
      <div className="max-w-5xl mx-auto p-6 animate-slide-up pb-16">
        
        {/* Header Banner */}
        <div className={`relative p-8 rounded-3xl border-2 mb-8 overflow-hidden ${passed ? 'bg-green-900/10 border-green-500/30' : 'bg-red-900/10 border-red-500/30'}`}>
           <div className="absolute top-0 right-0 w-64 h-64 bg-current opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
           
           <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
              <div>
                 <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${passed ? 'bg-green-500/20 text-green-400 border-green-500/20' : 'bg-red-500/20 text-red-400 border-red-500/20'}`}>
                      {passed ? 'Egzamin Zdany' : 'Egzamin Niezdany'}
                    </span>
                    <span className="text-gray-500 text-xs">{new Date().toLocaleDateString()}</span>
                 </div>
                 <h2 className="text-4xl font-display font-bold text-white mb-2">{passed ? 'Gratulacje, Mateusz!' : 'Nie poddawaj się!'}</h2>
                 <p className="text-gray-300 max-w-lg leading-relaxed">{examReport.summary}</p>
              </div>

              <div className="flex flex-col items-center">
                 <div className="text-7xl font-display font-bold text-white mb-1">
                   {percentage}%
                 </div>
                 <div className="text-gray-400 font-mono text-sm">
                   {score} / {selectedExam.totalScore} PKT
                 </div>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           
           {/* Left Col: Analysis */}
           <div className="lg:col-span-2 space-y-6">
              
              {/* Detailed Breakdown */}
              <div className="bg-[#112240] p-6 rounded-3xl border border-white/5">
                 <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                   <Target size={20} className="text-blue-400"/> Analiza Wyników
                 </h3>
                 
                 <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                       <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-400">Mocne strony</span>
                          <CheckCircle2 size={16} className="text-green-500"/>
                       </div>
                       <ul className="space-y-2">
                          {examReport.strengths.map((s, i) => (
                            <li key={i} className="bg-green-500/10 text-green-300 px-3 py-2 rounded-lg text-sm border border-green-500/10 flex gap-2">
                               <span>•</span> {s}
                            </li>
                          ))}
                       </ul>
                    </div>
                    
                    <div className="space-y-4">
                       <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-400">Do poprawy</span>
                          <XCircle size={16} className="text-red-500"/>
                       </div>
                       <ul className="space-y-2">
                          {examReport.weaknesses.map((w, i) => (
                            <li key={i} className="bg-red-500/10 text-red-300 px-3 py-2 rounded-lg text-sm border border-red-500/10 flex gap-2">
                               <span>•</span> {w}
                            </li>
                          ))}
                       </ul>
                    </div>
                 </div>
              </div>

              {/* Writing Feedback */}
              {writingResult && (
                <div className="bg-[#112240] p-6 rounded-3xl border border-white/5">
                   <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <PenTool size={20} className="text-pink-400"/> Wypracowanie
                      </h3>
                      <span className="text-2xl font-bold text-white">{writingResult.suma}<span className="text-sm text-gray-500">/12</span></span>
                   </div>
                   
                   <div className="bg-black/20 p-4 rounded-xl text-sm text-gray-300 italic mb-6 border-l-4 border-pink-500">
                      "{writingResult.podsumowanie}"
                   </div>

                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries({
                        'Treść': writingResult.tresc,
                        'Spójność': writingResult.spojnosc,
                        'Zakres': writingResult.zakres,
                        'Poprawność': writingResult.poprawnosc
                      }).map(([key, val]: any) => (
                        <div key={key} className="bg-white/5 p-3 rounded-xl text-center">
                           <div className="text-[10px] uppercase text-gray-500 font-bold mb-1">{key}</div>
                           <div className="text-xl font-bold text-white">{val.punkty} pkt</div>
                        </div>
                      ))}
                   </div>
                </div>
              )}

           </div>

           {/* Right Col: Teacher's Card */}
           <div className="space-y-6">
              
              <div className="bg-gradient-to-b from-matura-accent/20 to-[#112240] p-1 rounded-3xl border border-matura-accent/30">
                 <div className="bg-[#0A1628] rounded-[22px] p-6 h-full relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                       <BrainCircuit size={64}/>
                    </div>
                    
                    <h3 className="text-matura-accent font-bold uppercase tracking-widest text-xs mb-4">Raport Nauczyciela (AI)</h3>
                    
                    <div className="space-y-6">
                       <div>
                          <p className="text-gray-400 text-xs uppercase font-bold mb-2">Wnioski</p>
                          <p className="text-white text-sm font-medium leading-relaxed">"{examReport.prediction}"</p>
                       </div>

                       <div>
                          <p className="text-gray-400 text-xs uppercase font-bold mb-2">Rekomendacje</p>
                          <ul className="space-y-3">
                             {examReport.recommendations.map((rec, i) => (
                               <li key={i} className="flex gap-3 text-sm text-gray-300">
                                  <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold flex-shrink-0">{i+1}</div>
                                  {rec}
                               </li>
                             ))}
                          </ul>
                       </div>
                    </div>

                    <button onClick={() => setExamStatus('intro')} className="w-full mt-8 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all text-sm">
                       Zamknij raport
                    </button>
                 </div>
              </div>

           </div>

        </div>
      </div>
    );
  }

  // --- ACTIVE EXAM VIEW ---
  
  if (!selectedExam) return null;

  const currentSection = selectedExam.sections[currentSectionIndex];
  const currentTask = currentSection.tasks[currentTaskIndex];

  const navigateTask = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentTaskIndex > 0) setCurrentTaskIndex(currentTaskIndex - 1);
      else if (currentSectionIndex > 0) {
        setCurrentSectionIndex(currentSectionIndex - 1);
        setCurrentTaskIndex(selectedExam.sections[currentSectionIndex - 1].tasks.length - 1);
      }
    } else {
      if (currentTaskIndex < currentSection.tasks.length - 1) setCurrentTaskIndex(currentTaskIndex + 1);
      else if (currentSectionIndex < selectedExam.sections.length - 1) {
        setCurrentSectionIndex(currentSectionIndex + 1);
        setCurrentTaskIndex(0);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050B14]">
      
      {/* Top Bar */}
      <header className="h-16 bg-[#0A1628] border-b border-white/10 flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-4">
          <span className="font-bold text-white hidden md:block">{selectedExam.title}</span>
          <span className="px-3 py-1 bg-white/10 rounded-lg text-xs text-gray-300 font-mono">
            {currentSection.name}
          </span>
        </div>
        
        {renderTimer()}

        <button 
          onClick={finishExam}
          className="bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-2 rounded-lg text-xs font-bold uppercase hover:bg-red-500/20 transition-all"
        >
          Zakończ Egzamin
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        
        {/* Sidebar Tasks */}
        <div className="w-full md:w-72 bg-[#08101E] border-r border-white/5 overflow-y-auto hidden md:block custom-scrollbar">
           {selectedExam.sections.map((section, sIdx) => (
             <div key={sIdx} className="mb-2">
               <div className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase bg-[#0A1628] sticky top-0 z-10 flex items-center gap-2">
                 {sIdx === 0 ? <Headphones size={12}/> : sIdx === 1 ? <BookOpen size={12}/> : sIdx === 2 ? <BrainCircuit size={12}/> : <FileText size={12}/>}
                 {section.name}
               </div>
               {section.tasks.map((task, tIdx) => {
                 const isActive = sIdx === currentSectionIndex && tIdx === currentTaskIndex;
                 const isDone = task.questions 
                    ? task.questions.every(q => answers[`${task.id}-${q.id}`] !== undefined)
                    : !!answers[`${task.id}-writing`] && (answers[`${task.id}-writing`] as string).length > 10;

                 return (
                   <button
                     key={task.id}
                     onClick={() => { setCurrentSectionIndex(sIdx); setCurrentTaskIndex(tIdx); }}
                     className={`w-full text-left px-4 py-3 text-sm border-l-2 transition-all flex items-center justify-between ${
                       isActive 
                        ? 'border-matura-accent bg-white/5 text-white' 
                        : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                     }`}
                   >
                     <span className="truncate pr-2">{task.title}</span>
                     {isDone && <CheckCircle2 size={12} className="text-green-500 flex-shrink-0" />}
                   </button>
                 );
               })}
             </div>
           ))}
        </div>

        {/* Task Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 bg-[#050B14]">
           <div className="max-w-4xl mx-auto">
              
              {/* Task Header */}
              <div className="mb-8 border-b border-white/10 pb-6">
                 <div className="flex items-center justify-between mb-2">
                   <h2 className="text-3xl font-bold text-white font-display">{currentTask.title}</h2>
                   <span className="text-sm font-bold text-gray-500 border border-white/10 px-2 py-1 rounded bg-black/20">{currentTask.score} pkt</span>
                 </div>
                 <p className="text-gray-400 text-sm leading-relaxed">{currentTask.instruction}</p>
              </div>

              {/* Specific Renderers */}
              
              {/* LISTENING */}
              {currentTask.script && (
                <div className="mb-8 p-6 bg-[#112240] rounded-2xl border border-white/5 flex flex-col items-center justify-center relative overflow-hidden group">
                   <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                   <div className="w-16 h-16 rounded-full bg-matura-accent flex items-center justify-center text-matura-bg mb-4 shadow-lg shadow-yellow-500/20 relative z-10">
                     <Headphones size={32} />
                   </div>
                   <button 
                     onClick={() => toggleAudio(currentTask.script!)}
                     disabled={isLoadingAudio}
                     className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-full text-white font-bold flex items-center gap-3 transition-all relative z-10"
                   >
                     {isLoadingAudio ? (
                       <Loader2 size={18} className="animate-spin"/>
                     ) : isPlaying ? (
                       <><Pause size={18}/> Pauza</>
                     ) : (
                       <><Play size={18}/> Odtwórz Nagranie (AI)</>
                     )}
                   </button>
                </div>
              )}

              {/* READING TEXT (Split View simulated) */}
              {currentTask.readingText && currentTask.type !== 'writing' && (
                <div className="mb-8 p-8 bg-[#162335] rounded-2xl border border-white/5 text-gray-300 leading-loose font-serif text-lg shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]">
                  {currentTask.readingText}
                </div>
              )}

              {/* MATCHING EXTRA OPTIONS */}
              {currentTask.extraOptions && (
                <div className="mb-8 flex flex-wrap gap-2">
                  {currentTask.extraOptions.map((opt, i) => (
                    <div key={i} className="bg-[#0f1823] px-4 py-2 rounded-lg border border-white/10 text-sm text-gray-300 shadow-sm">
                      {opt}
                    </div>
                  ))}
                </div>
              )}

              {/* QUESTIONS */}
              <div className="space-y-6 pb-24">
                 {/* WRITING */}
                 {currentTask.type === 'writing' && currentTask.writingTask && (
                   <div className="space-y-4">
                     <div className="bg-[#112240] p-6 rounded-2xl border border-white/10 text-sm text-gray-300 whitespace-pre-line leading-relaxed">
                       <strong className="text-white block mb-2 uppercase text-xs tracking-widest">Temat:</strong>
                       {currentTask.writingTask.instruction}
                     </div>
                     <div className="relative">
                        <textarea
                          className="w-full h-[500px] bg-[#0F1B2D] border border-white/10 rounded-2xl p-8 text-gray-200 focus:border-matura-accent outline-none resize-none font-sans leading-relaxed text-lg shadow-inner placeholder-gray-600"
                          placeholder="Tu wpisz swoją wypowiedź..."
                          value={answers[`${currentTask.id}-writing`] || ''}
                          onChange={(e) => handleAnswer(currentTask.id, 'writing', e.target.value)}
                        />
                        <div className="absolute bottom-4 right-4 text-xs font-bold bg-black/40 px-3 py-1 rounded text-gray-400 border border-white/5">
                          Słowa: {(answers[`${currentTask.id}-writing`] || '').trim().split(/\s+/).filter((w: string) => w.length > 0).length}
                        </div>
                     </div>
                   </div>
                 )}

                 {/* STANDARD QUESTIONS */}
                 {currentTask.questions?.map((q, idx) => {
                   // Smart check for Open Cloze mixed within Gapped Text (e.g. Dec 2022 Task 5)
                   const isInputQuestion = 
                      currentTask.type === 'open_cloze' || 
                      currentTask.type === 'translation' ||
                      (currentTask.type === 'gapped_text' && !q.options && !currentTask.extraOptions);

                   return (
                   <div key={q.id} className="bg-[#0F1B2D] p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                      <div className="mb-4 text-white font-medium flex gap-3 text-lg">
                        <span className="text-matura-accent font-bold mt-0.5">{q.text?.startsWith(String(q.id)) ? '' : `${q.id}.`}</span>
                        <span className="leading-relaxed">{q.text}</span>
                      </div>

                      {/* True/False */}
                      {currentTask.type === 'true_false' && (
                        <div className="flex gap-4">
                          {['True', 'False'].map(opt => (
                            <button
                              key={opt}
                              onClick={() => handleAnswer(currentTask.id, q.id, opt)}
                              className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${
                                answers[`${currentTask.id}-${q.id}`] === opt
                                  ? 'bg-blue-600 border-blue-500 text-white shadow-lg'
                                  : 'bg-[#0A1628] border-white/10 text-gray-400 hover:bg-white/5'
                              }`}
                            >
                              {opt.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Choice / Matching (A, B, C...) */}
                      {!isInputQuestion && (currentTask.type === 'choice' || currentTask.type === 'matching' || currentTask.type === 'gapped_text') && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                           {q.options ? (
                             // Explicit options provided
                             q.options.map((opt, idx) => (
                               <button
                                 key={idx}
                                 onClick={() => handleAnswer(currentTask.id, q.id, idx)} // Saving index for Choice
                                 className={`text-left p-4 rounded-xl border text-sm transition-all flex items-center gap-3 ${
                                   answers[`${currentTask.id}-${q.id}`] === idx
                                     ? 'bg-blue-600 border-blue-500 text-white'
                                     : 'bg-[#0A1628] border-white/10 text-gray-400 hover:bg-white/5'
                                 }`}
                               >
                                 <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${answers[`${currentTask.id}-${q.id}`] === idx ? 'border-white' : 'border-gray-500'}`}>
                                    {answers[`${currentTask.id}-${q.id}`] === idx && <div className="w-2.5 h-2.5 bg-white rounded-full"/>}
                                 </div>
                                 {opt}
                               </button>
                             ))
                           ) : (
                             // Implicit A-F options for matching
                             ['A','B','C','D','E','F'].slice(0, currentTask.extraOptions ? currentTask.extraOptions.length : 4).map(opt => (
                               <button
                                 key={opt}
                                 onClick={() => handleAnswer(currentTask.id, q.id, opt)}
                                 className={`py-3 rounded-xl border font-bold transition-all ${
                                   answers[`${currentTask.id}-${q.id}`] === opt
                                     ? 'bg-blue-600 border-blue-500 text-white'
                                     : 'bg-[#0A1628] border-white/10 text-gray-400 hover:bg-white/5'
                                 }`}
                               >
                                 {opt}
                               </button>
                             ))
                           )}
                        </div>
                      )}

                      {/* Open Cloze / Translation (Input) */}
                      {isInputQuestion && (
                        <div className="flex items-center gap-3 flex-wrap text-lg">
                           {q.prefix && <span className="text-gray-300">{q.prefix}</span>}
                           <input 
                             type="text" 
                             className="bg-black/30 border border-white/20 rounded-lg px-4 py-2 text-white focus:border-matura-accent outline-none min-w-[200px]"
                             value={answers[`${currentTask.id}-${q.id}`] || ''}
                             onChange={(e) => handleAnswer(currentTask.id, q.id, e.target.value)}
                           />
                           {q.suffix && <span className="text-gray-300">{q.suffix}</span>}
                        </div>
                      )}
                   </div>
                 )})}
              </div>

              {/* Navigation Footer */}
              <div className="flex justify-between mt-12 pt-6 border-t border-white/10">
                 <button onClick={() => navigateTask('prev')} className="flex items-center gap-2 text-gray-400 hover:text-white px-4 py-2 hover:bg-white/5 rounded-lg transition-colors">
                   <ChevronLeft size={20}/> Poprzednie
                 </button>
                 <button onClick={() => navigateTask('next')} className="flex items-center gap-2 text-white bg-white/10 px-6 py-3 rounded-xl hover:bg-white/20 transition-colors font-bold">
                   Następne Zadanie <ChevronRight size={20}/>
                 </button>
              </div>

           </div>
        </div>

      </div>
    </div>
  );
};

export default Exam;