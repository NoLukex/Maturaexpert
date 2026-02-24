
import { FC, useState } from 'react';
import { useGrammar } from '../hooks/useGrammar';
import {
  PenTool,
  MessageSquare,
  WholeWord,
  Shuffle,
  Copy,
  Info,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowRight,
  Sparkles,
  Loader2,
  ChevronUp,
  ChevronDown,
  XCircle,
  LayoutList,
  RotateCcw
} from 'lucide-react';

const Grammar: FC = () => {
  const {
    sections,
    activeSection,
    activeSectionId,
    setActiveSectionId,
    activeTask,
    activeTaskId,
    setActiveTaskId,
    answers,
    submitted,
    isGenerating,
    error,
    handleInputChange,
    checkAnswers,
    generateAiTask,
    isCorrect,
    cycleNextTask,
    retryTask
  } = useGrammar();

  const [showDescription, setShowDescription] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const getIcon = (id: string, size = 18) => {
    switch (id) {
      case 'translations': return <PenTool className="mr-3 flex-shrink-0" size={size} />;
      case 'minidialogues': return <MessageSquare className="mr-3 flex-shrink-0" size={size} />;
      case 'abc_grammar': return <WholeWord className="mr-3 flex-shrink-0" size={size} />;
      case 'paraphrase': return <Shuffle className="mr-3 flex-shrink-0" size={size} />;
      case 'double_meaning': return <Copy className="mr-3 flex-shrink-0" size={size} />;
      default: return <Info className="mr-3 flex-shrink-0" size={size} />;
    }
  };

  if (!activeSection || !activeTask) return <div className="p-8 text-center text-gray-400">Ładowanie modułu...</div>;

  return (
    <div className="flex h-full bg-[#050B14]">
      <div className={`flex-shrink-0 border-r border-white/5 bg-[#0A1628] transition-all duration-300 overflow-hidden flex flex-col ${isSidebarOpen ? 'w-80' : 'w-0'}`}>
        <div className="p-6 border-b border-white/5"><h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Kategorie zadań</h3></div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {sections.map(section => (
            <button key={section.id} onClick={() => { setActiveSectionId(section.id); setIsSidebarOpen(false); }} className={`w-full text-left px-4 py-4 rounded-xl flex items-center transition-all ${activeSectionId === section.id ? 'bg-gradient-to-r from-matura-accent/20 to-transparent text-matura-accent border-l-4 border-matura-accent' : 'text-gray-400 hover:bg-white/5 border-l-4 border-transparent'}`}>
              {getIcon(section.id, 20)}
              <span className="font-medium text-sm whitespace-nowrap">{section.title}</span>
              {activeSectionId === section.id && <ArrowRight size={16} className="ml-auto opacity-50" />}
            </button>
          ))}
        </nav>
      </div>

      <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-[#050B14]">
        <header className="bg-[#0A1628]/80 backdrop-blur-md border-b border-white/5 p-4 md:px-8 md:py-5 flex flex-col gap-4">
          <div className="flex items-start gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`mt-0.5 p-2 rounded-lg border border-white/5 ${isSidebarOpen ? 'bg-matura-accent/10 text-matura-accent' : 'bg-white/5 text-gray-400'}`}>
              {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowDescription(!showDescription)}>
                <h2 className="text-2xl font-bold font-display text-white">{activeSection.title}</h2>
                <button className="text-gray-500">{showDescription ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
              </div>
              <div className={`overflow-hidden transition-all duration-300 ${showDescription ? 'max-h-24 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                <p className="text-sm text-gray-400 max-w-2xl">{activeSection.description}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 ml-12">
            {activeSection.tasks.map((task, index) => (
              <button key={task.id} onClick={() => setActiveTaskId(task.id)} className={`flex items-center px-4 py-2 rounded-lg text-xs font-bold transition-all border uppercase tracking-wider ${activeTaskId === task.id ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : submitted[task.id] ? 'bg-green-500/10 border-green-500/30 text-green-400' : task.id.startsWith('ai') ? 'bg-purple-600/20 border-purple-500/30 text-purple-300' : 'bg-[#0F1B2D] border-white/5 text-gray-500'}`}>
                {task.id.startsWith('ai') ? <Sparkles size={14} className="mr-2" /> : <LayoutList size={14} className="mr-2" />}
                {task.instruction.includes(':') ? task.instruction.split(':')[0] : task.id.startsWith('ai') ? 'AI' : `Zestaw ${index + 1}`}
              </button>
            ))}
            <button onClick={generateAiTask} disabled={isGenerating} className="flex items-center px-4 py-2 rounded-lg text-xs font-bold bg-matura-accent text-matura-bg border-matura-accent hover:bg-yellow-400 disabled:opacity-50">
              {isGenerating ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Sparkles size={14} className="mr-2" />}
              {isGenerating ? 'Generuję...' : 'Nowy Zestaw (NVIDIA AI)'}
            </button>
          </div>
          {error && (
            <div className="mt-4 mx-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300 text-sm flex items-center animate-in fade-in slide-in-from-top-2">
              <XCircle size={16} className="mr-2 flex-shrink-0" />
              {error}
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#050B14]">
          <div className="max-w-4xl mx-auto pb-24">
            {activeTask.content && (
              <div className="mb-8 p-6 bg-[#0F1B2D] rounded-2xl border border-white/5"><p className="text-gray-300 italic leading-relaxed whitespace-pre-line font-serif text-lg">{activeTask.content}</p></div>
            )}
            <div className="flex items-center gap-3 mb-6"><div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div><span className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">{activeTask.instruction}</span><div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div></div>
            <div className="space-y-4">
              {activeTask.questions.map((q, idx) => {
                const userAnswer = answers[`${activeTask.id}-${q.id}`] || '';
                const status = submitted[activeTask.id] ? (isCorrect(userAnswer, q.correctAnswer) ? 'correct' : 'wrong') : 'neutral';
                return (
                  <div key={q.id} className={`p-5 rounded-2xl border transition-all duration-300 ${status === 'correct' ? 'bg-green-900/10 border-green-500/30' : status === 'wrong' ? 'bg-red-900/10 border-red-500/30' : 'bg-[#0F1B2D] border-white/5'}`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-1.5 flex-shrink-0 ${status === 'correct' ? 'bg-green-500' : status === 'wrong' ? 'bg-red-500' : 'bg-white/5 text-gray-500'}`}>{idx + 1}</div>
                      <div className="flex-1 space-y-3">
                        {activeTask.type === 'translation' && (
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-3 text-lg text-gray-300">
                            <span>{q.prefix}</span>
                            <input type="text" disabled={submitted[activeTask.id]} value={userAnswer} onChange={(e) => handleInputChange(activeTask.id, q.id, e.target.value)} placeholder={q.text} className={`px-4 py-2 rounded-lg font-medium outline-none transition-all w-64 ${status === 'correct' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : status === 'wrong' ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-black/20 text-white border border-white/10 focus:border-matura-accent'}`} />
                            <span>{q.suffix}</span>
                          </div>
                        )}
                        {activeTask.type === 'choice' && (
                          <div className="w-full">
                            <p className="font-medium text-gray-200 text-lg mb-4">{q.text}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {q.options?.map(opt => (
                                <label key={opt} className={`flex items-center p-3 rounded-xl cursor-pointer border transition-all ${userAnswer === opt ? 'bg-blue-600/10 border-blue-500' : 'bg-[#0A1628] border-white/5 hover:bg-white/5'}`}>
                                  <input type="radio" name={`${activeTask.id}-${q.id}`} value={opt} disabled={submitted[activeTask.id]} checked={userAnswer === opt} onChange={(e) => handleInputChange(activeTask.id, q.id, e.target.value)} className="hidden" />
                                  <span className={`text-sm font-medium ${userAnswer === opt ? 'text-white' : 'text-gray-400'}`}>{opt}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                        {status === 'wrong' && <div className="mt-2 text-sm bg-green-500/5 border border-green-500/10 rounded-lg p-3 inline-block">Poprawna: <span className="text-gray-200 font-mono">{Array.isArray(q.correctAnswer) ? q.correctAnswer[0] : q.correctAnswer}</span></div>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-[#0A1628]/90 backdrop-blur-xl p-4 z-40 shadow-2xl">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            {!submitted[activeTask.id] ? (
              <button onClick={() => checkAnswers(activeTask.id)} className="w-full md:w-auto px-10 py-3 bg-matura-accent text-matura-bg font-bold rounded-xl hover:bg-yellow-400 shadow-lg">Sprawdź odpowiedzi</button>
            ) : (
              <div className="w-full md:w-auto flex gap-3">
                <button onClick={() => retryTask(activeTask.id)} className="w-full md:w-auto px-8 py-3 bg-blue-600/20 border border-blue-500/40 text-blue-200 font-bold rounded-xl hover:bg-blue-600/30 shadow-lg flex items-center justify-center gap-2">
                  <RotateCcw size={18} /> Powtórz
                </button>
                <button onClick={cycleNextTask} className="w-full md:w-auto px-8 py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 shadow-lg flex items-center justify-center gap-2">{isGenerating ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />} {isGenerating ? 'Generuję...' : 'Następne'}</button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Grammar;
