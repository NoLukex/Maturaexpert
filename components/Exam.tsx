import React, { useState, useEffect, useRef } from 'react';
import { FullExam } from '../services/mockExams';
import { gradeWritingTask, generateExamReport, ExamReport, playTextToSpeech } from '../services/geminiService';
import { saveTaskResult } from '../services/storageService';
import { useChatContext } from '../contexts/ChatContext';
import { WritingAssessment } from '../types';
import { evaluateClosedTasks } from '../utils/examGrading';
import { CKE_2023_EXAMS } from '../services/exams2023';
import { validateExam } from '../utils/examValidation';
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
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [examStatus, setExamStatus] = useState<'intro' | 'active' | 'grading' | 'finished'>('intro');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [writingResult, setWritingResult] = useState<WritingAssessment | null>(null);
  const [score, setScore] = useState(0);
  const [examReport, setExamReport] = useState<ExamReport | null>(null);
  const [gradingStep, setGradingStep] = useState<string>('');
  const [isOfficialAudioPlaying, setIsOfficialAudioPlaying] = useState(false);

  const stopAudioRef = useRef<(() => void) | null>(null);
  const officialAudioRef = useRef<HTMLAudioElement | null>(null);
  const { setScreenContext } = useChatContext();
  const examIssues = selectedExam ? validateExam(selectedExam) : [];

  // --- TIMER ---
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
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
      if (officialAudioRef.current) {
        officialAudioRef.current.pause();
        officialAudioRef.current = null;
      }
    };
  }, []);

  // Stop audio when changing tasks
  useEffect(() => {
    if (stopAudioRef.current) stopAudioRef.current();
    if (officialAudioRef.current) {
      officialAudioRef.current.pause();
      officialAudioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setIsOfficialAudioPlaying(false);
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

  const toggleOfficialAudio = () => {
    if (!selectedExam?.audioUrl) return;

    if (!officialAudioRef.current) {
      officialAudioRef.current = new Audio(selectedExam.audioUrl);
      officialAudioRef.current.onended = () => setIsOfficialAudioPlaying(false);
      officialAudioRef.current.onpause = () => setIsOfficialAudioPlaying(false);
      officialAudioRef.current.onplay = () => setIsOfficialAudioPlaying(true);
    }

    if (isOfficialAudioPlaying) {
      officialAudioRef.current.pause();
      return;
    }

    officialAudioRef.current.play().catch((error) => {
      console.error('Official audio playback failed', error);
      setIsOfficialAudioPlaying(false);
    });
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

  const handleAnswer = (taskId: string, questionId: number | string, value: unknown) => {
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

    const { closedPoints, mistakes } = evaluateClosedTasks(selectedExam.sections, answers);

    // Grade Writing Task (AI)
    const writingTask = selectedExam.sections.flatMap(s => s.tasks).find(t => t.type === 'writing');
    let writingScore = 0;

    if (writingTask && writingTask.writingTask) {
      const userText = String(answers[`${writingTask.id}-writing`] || '');
      if (userText.length > 20) {
        setGradingStep('Egzaminator (AI) ocenia wypracowanie...');
        try {
          const assessment = await gradeWritingTask(writingTask.writingTask.instruction, userText);
          setWritingResult(assessment);
          writingScore = assessment.suma;
        } catch (e) {
          console.error("AI Grading failed", e);
          setWritingResult({
            tresc: { punkty: 0, komentarz: '-' },
            spojnosc: { punkty: 0, komentarz: '-' },
            zakres: { punkty: 0, komentarz: '-' },
            poprawnosc: { punkty: 0, komentarz: '-', bledy: [] },
            suma: 0,
            podsumowanie: "Blad polaczenia z AI.",
            wskazowki: []
          });
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
    const prioritizedExams = CKE_2023_EXAMS.filter((exam) => exam.sourceType === 'official');

    return (
      <div className="max-w-5xl mx-auto p-6 grid gap-8">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-display font-bold text-white mb-2">Matura pisemna - Formula 2023</h2>
          <p className="text-gray-400">Wybierz sesje i rozwiaz arkusz zgodny z ukladem CKE.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {prioritizedExams.map(exam => {
            const issues = validateExam(exam);
            const hasErrors = issues.some((issue) => issue.level === 'error');
            const hasWarnings = issues.some((issue) => issue.level === 'warning');
            const isReady = exam.sourceType === 'official' && !hasErrors;

            return (
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
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${exam.sourceType === 'official' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-300'}`}>
                    {exam.sourceType === 'official' ? 'CKE 1:1' : 'REKONSTRUKCJA'}
                  </span>
                </div>
              </div>

              <div className="flex-1 space-y-4 mb-8 z-10">
                <div className="flex items-center gap-3 text-gray-300">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-matura-accent"><Timer size={18} /></div>
                  <span>{exam.duration} minut</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-matura-accent"><FileText size={18} /></div>
                  <span>{exam.sections.length} części (Słuchanie, Czytanie, Pisanie)</span>
                </div>
                <div className="flex flex-wrap gap-3 text-xs">
                  {exam.sourceUrl && (
                    <a
                      href={exam.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-300 hover:text-blue-200 underline"
                    >
                      Arkusz CKE
                    </a>
                  )}
                  {exam.answerKeyUrl && (
                    <a
                      href={exam.answerKeyUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-300 hover:text-blue-200 underline"
                    >
                      Zasady oceniania
                    </a>
                  )}
                  {exam.transcriptUrl && (
                    <a
                      href={exam.transcriptUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-300 hover:text-blue-200 underline"
                    >
                      Transkrypcja
                    </a>
                  )}
                  {exam.audioUrl && (
                    <a
                      href={exam.audioUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-300 hover:text-blue-200 underline"
                    >
                      Nagranie MP3
                    </a>
                  )}
                </div>
                {hasWarnings && (
                  <div className="text-xs text-yellow-300 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2">
                    W trakcie importu 1:1. Ten slot jest zablokowany do czasu podmiany tresci i klucza CKE.
                  </div>
                )}
              </div>

              <button
                onClick={() => startExam(exam)}
                disabled={!isReady}
                className="w-full py-4 bg-white/5 hover:bg-matura-accent text-white hover:text-matura-bg font-bold rounded-2xl transition-all border border-white/10 hover:border-transparent flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isReady ? 'Rozpocznij Egzamin' : 'Niedostepne - import 1:1'} <ArrowRight size={18} />
              </button>
            </div>
          )})}
        </div>

        <div className="text-xs text-gray-400 bg-[#0F1B2D] border border-white/10 rounded-xl p-3">
          Udostepnione sa arkusze CKE 1:1 gotowe do pracy egzaminacyjnej. Rekonstrukcje robocze pozostaja zablokowane do czasu pelnej podmiany danych.
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
            <BrainCircuit size={32} className="text-matura-accent animate-pulse" />
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
                <Target size={20} className="text-blue-400" /> Analiza Wyników
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-400">Mocne strony</span>
                    <CheckCircle2 size={16} className="text-green-500" />
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
                    <XCircle size={16} className="text-red-500" />
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
                    <PenTool size={20} className="text-pink-400" /> Wypracowanie
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
                  }).map(([key, val]) => (
                    <div key={key} className="bg-white/5 p-3 rounded-xl text-center">
                      <div className="text-[10px] uppercase text-gray-500 font-bold mb-1">{key}</div>
                      <div className="text-xl font-bold text-white">{val?.punkty ?? 0} pkt</div>
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
                  <BrainCircuit size={64} />
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
                          <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</div>
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
  const isOfficialMode = selectedExam.sourceType === 'official';
  const isOfficialInputLayout = isOfficialMode && (currentTask.type === 'open_cloze' || currentTask.type === 'translation');
  const isOfficialLanguageSectionTask = isOfficialMode && currentSection.name === 'Znajomość środków językowych';
  const useOfficialAnswerSheetGrid =
    isOfficialMode &&
    !!currentTask.extraOptions &&
    (currentTask.type === 'matching' || currentTask.type === 'gapped_text');

  const transferToAnswerSheetMessage =
    currentTask.id === 'may23-3'
      ? 'PRZENIES ROZWIAZANIA ZADAN OD 1. DO 3. NA KARTE ODPOWIEDZI!'
      : currentTask.id === 'may23-4'
        ? 'PRZENIES ROZWIAZANIA NA KARTE ODPOWIEDZI!'
        : currentTask.id === 'may23-5a'
          ? 'PRZENIES ROZWIAZANIA ZADAN OD 5.1. DO 5.3. NA KARTE ODPOWIEDZI!'
          : currentTask.id === 'may23-6' || currentTask.id === 'may23-7' || currentTask.id === 'may23-8' || currentTask.id === 'may23-9'
            ? 'PRZENIES ROZWIAZANIA NA KARTE ODPOWIEDZI!'
            : isOfficialMode && currentTask.type !== 'writing'
              ? 'PRZENIES ROZWIAZANIA NA KARTE ODPOWIEDZI!'
              : null;

  const splitOptionLabel = (optionText: string, index: number) => {
    const match = optionText.match(/^([A-Z])[\.)]\s*(.*)$/);
    if (match) {
      return { label: match[1], content: match[2] };
    }
    return { label: String.fromCharCode(65 + index), content: optionText };
  };

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
                {sIdx === 0 ? <Headphones size={12} /> : sIdx === 1 ? <BookOpen size={12} /> : sIdx === 2 ? <BrainCircuit size={12} /> : <FileText size={12} />}
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
                    className={`w-full text-left px-4 py-3 text-sm border-l-2 transition-all flex items-center justify-between ${isActive
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
        <div className={`flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 ${isOfficialMode ? 'bg-[#050B14]' : 'bg-[#050B14]'}`}>
          <div className={`max-w-4xl mx-auto ${isOfficialMode ? 'bg-[#0F1B2D] border border-white/10 rounded-xl p-6 md:p-8 shadow-sm' : ''}`}>

            {/* Task Header */}
            <div className={`mb-8 pb-6 ${isOfficialMode ? 'border-b border-gray-300' : 'border-b border-white/10'}`}>
              {isOfficialMode && <div className="h-2 w-full bg-[#c9b3dd] rounded-sm mb-4" />}
              <div className="flex items-center justify-between mb-2">
                <h2 className={`${isOfficialMode ? 'text-2xl' : 'text-3xl'} font-bold font-display ${isOfficialMode ? 'text-white' : 'text-white'}`}>{currentTask.title}</h2>
                <span className={`text-sm font-bold px-2 py-1 rounded ${isOfficialMode ? 'text-gray-200 border border-white/20 bg-black/30' : 'text-gray-500 border border-white/10 bg-black/20'}`}>{currentTask.score} pkt</span>
              </div>
              <p className={`${isOfficialMode ? 'text-gray-300 font-medium' : 'text-gray-400'} text-sm leading-relaxed`}>{currentTask.instruction}</p>
              {examIssues.length > 0 && (
                <div className="mt-3 space-y-2">
                  {examIssues.map((issue, index) => (
                    <p
                      key={index}
                      className={`text-xs px-3 py-2 rounded-lg border ${issue.level === 'error' ? 'text-red-300 border-red-500/30 bg-red-500/10' : 'text-yellow-300 border-yellow-500/30 bg-yellow-500/10'}`}
                    >
                      {issue.message}
                    </p>
                  ))}
                </div>
              )}

            </div>

            {/* Specific Renderers */}

            {/* LISTENING */}
            {currentTask.script && (
              <div className={`mb-8 p-6 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group ${isOfficialMode ? 'bg-[#112240] border border-white/10' : 'bg-[#112240] border border-white/5'}`}>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-16 h-16 rounded-full bg-matura-accent flex items-center justify-center text-matura-bg mb-4 shadow-lg shadow-yellow-500/20 relative z-10">
                  <Headphones size={32} />
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 relative z-10">
                  {selectedExam?.audioUrl && (
                    <button
                      onClick={toggleOfficialAudio}
                      className={`px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-all ${isOfficialMode ? 'bg-matura-accent text-matura-bg' : 'bg-matura-accent text-matura-bg'}`}
                    >
                      {isOfficialAudioPlaying ? <><Pause size={18} /> Pauza CKE</> : <><Play size={18} /> Odtwórz CKE MP3</>}
                    </button>
                  )}
                  <button
                    onClick={() => toggleAudio(currentTask.script!)}
                    disabled={isLoadingAudio}
                    className={`px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-all ${isOfficialMode ? 'bg-white/10 border border-white/20 text-white hover:bg-white/20' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                  >
                    {isLoadingAudio ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : isPlaying ? (
                      <><Pause size={18} /> Pauza AI</>
                    ) : (
                      <><Play size={18} /> Odtwórz AI</>
                    )}
                  </button>
                </div>
                {selectedExam?.transcriptUrl && (
                  <a
                    href={selectedExam.transcriptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 text-xs text-blue-300 hover:text-blue-200 underline relative z-10"
                  >
                    Otworz oficjalna transkrypcje CKE
                  </a>
                )}
              </div>
            )}

            {/* READING TEXT (Split View simulated) */}
            {currentTask.taskImages && currentTask.taskImages.length > 0 && (
              <div className="mb-8 grid grid-cols-1 gap-4">
                {currentTask.taskImages.map((imgPath, index) => (
                  <img
                    key={`${imgPath}-${index}`}
                    src={imgPath}
                    alt={`Oficjalna grafika CKE ${index + 1}`}
                    className={`w-full rounded-2xl ${isOfficialMode ? 'border border-gray-300' : 'border border-white/10'}`}
                  />
                ))}
              </div>
            )}

            {currentTask.readingText && currentTask.type !== 'writing' && (
              <div className={`mb-8 p-8 rounded-2xl leading-loose font-serif text-lg whitespace-pre-line ${isOfficialMode ? 'bg-[#162335] border border-white/10 text-gray-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]' : 'bg-[#162335] border border-white/5 text-gray-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]'}`}>
                {currentTask.readingText}
              </div>
            )}

            {/* MATCHING EXTRA OPTIONS */}
            {currentTask.extraOptions && (
              <div className={`mb-8 ${isOfficialMode ? 'space-y-2' : 'flex flex-wrap gap-2'}`}>
                {currentTask.extraOptions.map((opt, i) => {
                  const parsed = splitOptionLabel(opt, i);

                  return isOfficialMode ? (
                    <div key={i} className="bg-[#0f1823] border border-white/20 text-gray-100 px-4 py-3 rounded-lg text-sm shadow-sm flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-white/10 border border-white/20 text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {parsed.label}
                      </span>
                      <span className="leading-relaxed">{parsed.content || parsed.label}</span>
                    </div>
                  ) : (
                    <div key={i} className="bg-[#0f1823] border-white/10 text-gray-300 px-4 py-2 rounded-lg border text-sm shadow-sm">
                      {opt}
                    </div>
                  );
                })}
              </div>
            )}

            {useOfficialAnswerSheetGrid && currentTask.questions && currentTask.extraOptions && (
              <div className="mb-8 bg-[#0F1B2D] border border-white/20 rounded-xl p-4 md:p-5">
                <p className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-3">Karta odpowiedzi CKE</p>
                <div className="overflow-x-auto">
                  <table className="min-w-[680px] w-full border-separate border-spacing-y-2">
                    <thead>
                      <tr>
                        <th className="text-left text-xs font-bold text-gray-400 px-3 py-2">Nr</th>
                        <th className="text-left text-xs font-bold text-gray-400 px-3 py-2">Odpowiedź</th>
                        {currentTask.extraOptions.map((opt, i) => {
                          const parsed = splitOptionLabel(opt, i);
                          return (
                            <th key={parsed.label} className="text-center text-xs font-bold text-gray-400 px-2 py-2 w-10">
                              {parsed.label}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {currentTask.questions.map((q) => {
                        const selected = String(answers[`${currentTask.id}-${q.id}`] || '');

                        return (
                          <tr key={q.id} className="bg-[#0A1628] border border-white/10">
                            <td className="px-3 py-3 text-sm font-bold text-white rounded-l-lg whitespace-nowrap">{q.text || q.id}</td>
                            <td className="px-3 py-3 text-xs text-gray-300">Zaznacz jedną literę</td>
                            {currentTask.extraOptions.map((opt, i) => {
                              const parsed = splitOptionLabel(opt, i);
                              const isSelected = selected === parsed.label;

                              return (
                                <td key={`${q.id}-${parsed.label}`} className="px-2 py-2 text-center">
                                  <button
                                    onClick={() => handleAnswer(currentTask.id, q.id, parsed.label)}
                                    className={`w-8 h-8 rounded-md border text-xs font-bold transition-all ${isSelected
                                      ? 'bg-black border-white text-white'
                                      : 'bg-[#0A1628] border-white/20 text-gray-200 hover:bg-white/5'
                                      }`}
                                    aria-label={`Wybierz ${parsed.label} dla ${q.text || q.id}`}
                                  >
                                    {parsed.label}
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* QUESTIONS */}
            <div className="space-y-6 pb-24">
              {/* WRITING */}
              {currentTask.type === 'writing' && currentTask.writingTask && (
                <div className="space-y-4">
                  <div className={`${isOfficialMode ? 'bg-[#112240] border-white/20 text-gray-200' : 'bg-[#112240] border-white/10 text-gray-300'} p-6 rounded-2xl border text-sm whitespace-pre-line leading-relaxed`}>
                    <strong className={`${isOfficialMode ? 'text-white' : 'text-white'} block mb-2 uppercase text-xs tracking-widest`}>Temat:</strong>
                    {currentTask.writingTask.instruction}
                  </div>
                  <div className="relative">
                    <textarea
                      className={`w-full h-[500px] rounded-2xl p-8 focus:border-matura-accent outline-none resize-none font-sans leading-relaxed text-lg shadow-inner ${isOfficialMode ? 'bg-[#0B1626] border border-white/20 text-gray-100 placeholder-gray-500' : 'bg-[#0F1B2D] border border-white/10 text-gray-200 placeholder-gray-600'}`}
                      placeholder="Tu wpisz swoją wypowiedź..."
                      value={String(answers[`${currentTask.id}-writing`] || '')}
                      onChange={(e) => handleAnswer(currentTask.id, 'writing', e.target.value)}
                    />
                    <div className={`absolute bottom-4 right-4 text-xs font-bold px-3 py-1 rounded ${isOfficialMode ? 'bg-black/50 border border-white/20 text-gray-300' : 'bg-black/40 text-gray-400 border border-white/5'}`}>
                      Słowa: {String(answers[`${currentTask.id}-writing`] || '').trim().split(/\s+/).filter((w: string) => w.length > 0).length}
                    </div>
                  </div>
                  <button
                    onClick={() => void finishExam()}
                    className="w-full py-3 bg-matura-accent text-matura-bg font-bold rounded-xl hover:opacity-90 transition-opacity"
                  >
                    Zakoncz mature i wygeneruj podsumowanie AI
                  </button>
                </div>
              )}

              {/* STANDARD QUESTIONS */}
              {!useOfficialAnswerSheetGrid && currentTask.questions?.map((q, idx) => {
                // Smart check for Open Cloze mixed within Gapped Text (e.g. Dec 2022 Task 5)
                const isInputQuestion =
                  currentTask.type === 'open_cloze' ||
                  currentTask.type === 'translation' ||
                  (currentTask.type === 'gapped_text' && !q.options && !currentTask.extraOptions);

                return (
                  <div key={q.id} className={`${isOfficialMode ? 'bg-[#0F1B2D] border-white/20' : 'bg-[#0F1B2D] border-white/5 hover:border-white/10'} ${isOfficialInputLayout ? 'p-5 md:p-6' : 'p-6'} ${isOfficialLanguageSectionTask ? 'rounded-lg' : 'rounded-2xl'} border transition-colors`}>
                    <div className={`mb-4 ${isOfficialMode ? 'text-white' : 'text-white'} font-medium flex gap-3 text-lg`}>
                      <span className="text-matura-accent font-bold mt-0.5">{isOfficialMode || q.text?.startsWith(String(q.id)) ? '' : `${q.id}.`}</span>
                      <span className="leading-relaxed">{q.text}</span>
                    </div>

                    {/* True/False */}
                    {currentTask.type === 'true_false' && (
                      <div className="flex gap-4">
                        {['True', 'False'].map(opt => (
                          <button
                            key={opt}
                            onClick={() => handleAnswer(currentTask.id, q.id, opt)}
                            className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${answers[`${currentTask.id}-${q.id}`] === opt
                              ? 'bg-black border-black text-white shadow-lg'
                              : isOfficialMode ? 'bg-[#0A1628] border-white/20 text-gray-200 hover:bg-white/5' : 'bg-[#0A1628] border-white/10 text-gray-400 hover:bg-white/5'
                              }`}
                          >
                            {opt.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Choice / Matching (A, B, C...) */}
                    {!isInputQuestion && (currentTask.type === 'choice' || currentTask.type === 'matching' || currentTask.type === 'gapped_text') && (
                      <div className={`grid gap-3 ${q.optionsType === 'image' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
                        {/* IMAGE OPTIONS */}
                        {q.optionsType === 'image' && q.optionImages ? (
                          q.optionImages.map((imgSrc, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleAnswer(currentTask.id, q.id, idx)}
                              className={`relative group rounded-xl overflow-hidden border-2 transition-all aspect-square ${answers[`${currentTask.id}-${q.id}`] === idx
                                ? 'border-matura-accent bg-matura-accent/20'
                                : 'border-white/10 hover:border-white/30 bg-black/20'
                                }`}
                            >
                              <img src={imgSrc} alt={`Option ${idx}`} className="w-full h-full object-cover p-4" />
                              <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-xs font-bold text-white border border-white/10">
                                {String.fromCharCode(65 + idx)}
                              </div>
                              {answers[`${currentTask.id}-${q.id}`] === idx && (
                                <div className="absolute inset-0 bg-matura-accent/10 flex items-center justify-center">
                                  <CheckCircle2 size={32} className="text-matura-accent drop-shadow-lg" />
                                </div>
                              )}
                            </button>
                          ))
                        ) : (
                          /* TEXT OPTIONS (Standard) */
                          q.options ? (
                            q.options.map((opt, idx) => {
                              const parsed = splitOptionLabel(opt, idx);
                              const isSelected = answers[`${currentTask.id}-${q.id}`] === idx;

                              return (
                                <button
                                  key={idx}
                                  onClick={() => handleAnswer(currentTask.id, q.id, idx)}
                                  className={`text-left p-4 ${isOfficialLanguageSectionTask ? 'rounded-lg' : 'rounded-xl'} border text-sm transition-all flex items-start gap-3 ${isSelected
                                    ? 'bg-black border-black text-white'
                                    : isOfficialMode ? 'bg-[#0A1628] border-white/20 text-gray-200 hover:bg-white/5' : 'bg-[#0A1628] border-white/10 text-gray-400 hover:bg-white/5'
                                    }`}
                                >
                                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 font-bold text-xs ${isSelected ? 'border-white text-white' : 'border-gray-500 text-gray-300'}`}>
                                    {parsed.label}
                                  </div>
                                  <span className="leading-relaxed">{parsed.content}</span>
                                </button>
                              );
                            })
                          ) : (
                            // Implicit A-F options for matching
                            ['A', 'B', 'C', 'D', 'E', 'F'].slice(0, currentTask.extraOptions ? currentTask.extraOptions.length : 4).map(opt => (
                              <button
                                key={opt}
                                onClick={() => handleAnswer(currentTask.id, q.id, opt)}
                                className={`py-3 ${isOfficialLanguageSectionTask ? 'rounded-lg' : 'rounded-xl'} border font-bold transition-all ${answers[`${currentTask.id}-${q.id}`] === opt
                                    ? 'bg-black border-black text-white'
                                     : isOfficialMode ? 'bg-[#0A1628] border-white/20 text-gray-200 hover:bg-white/5' : 'bg-[#0A1628] border-white/10 text-gray-400 hover:bg-white/5'
                                    }`}
                              >
                                {opt}
                              </button>
                            ))
                          )
                        )}
                      </div>
                    )}

                    {/* Open Cloze / Translation (Input) */}
                    {isInputQuestion && (
                      isOfficialInputLayout ? (
                        <div className="space-y-3 text-lg">
                          <p className="text-sm font-semibold text-gray-700">{q.text}</p>
                          <div className="flex items-center gap-2 flex-wrap leading-relaxed">
                            {q.prefix && <span className="text-gray-200">{q.prefix}</span>}
                            <input
                              type="text"
                              className="bg-[#0A1628] border-b-2 border-white/30 text-white px-2 py-1 outline-none min-w-[320px]"
                              value={String(answers[`${currentTask.id}-${q.id}`] || '')}
                              onChange={(e) => handleAnswer(currentTask.id, q.id, e.target.value)}
                            />
                            {q.suffix && <span className="text-gray-200">{q.suffix}</span>}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 flex-wrap text-lg">
                          {q.prefix && <span className={isOfficialMode ? 'text-gray-200' : 'text-gray-300'}>{q.prefix}</span>}
                          <input
                            type="text"
                            className={`${isOfficialMode ? 'bg-[#0A1628] border-white/30 text-white' : 'bg-black/30 border-white/20 text-white'} border rounded-lg px-4 py-2 focus:border-matura-accent outline-none min-w-[200px]`}
                            value={String(answers[`${currentTask.id}-${q.id}`] || '')}
                            onChange={(e) => handleAnswer(currentTask.id, q.id, e.target.value)}
                          />
                          {q.suffix && <span className={isOfficialMode ? 'text-gray-200' : 'text-gray-300'}>{q.suffix}</span>}
                        </div>
                      )
                    )}
                  </div>
                )
              })}

              {transferToAnswerSheetMessage && (
                <p className={`mt-2 text-sm font-bold italic underline ${isOfficialMode ? 'text-gray-200' : 'text-gray-200'}`}>
                  {transferToAnswerSheetMessage}
                </p>
              )}
            </div>

            {/* Navigation Footer */}
            <div className={`flex justify-between mt-12 pt-6 ${isOfficialMode ? 'border-t border-gray-300' : 'border-t border-white/10'}`}>
              <button onClick={() => navigateTask('prev')} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isOfficialMode ? 'text-gray-300 hover:text-white hover:bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <ChevronLeft size={20} /> Poprzednie
              </button>
              <button onClick={() => navigateTask('next')} className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-colors font-bold ${isOfficialMode ? 'text-matura-bg bg-matura-accent hover:opacity-90' : 'text-white bg-white/10 hover:bg-white/20'}`}>
                Następne Zadanie <ChevronRight size={20} />
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Exam;
