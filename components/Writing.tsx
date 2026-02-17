import React, { useState, useEffect } from 'react';
import { WritingAssessment, WritingTask } from '../types';
import { gradeWritingTask } from '../services/geminiService';
import { addXP, saveTaskResult } from '../services/storageService';
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
  ChevronRight
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
• zaproponuj koledze wspólny wyjazd w góry w przyszłym roku`
  },
  {
    id: 'w2',
    type: 'blog',
    title: 'Blog: Festiwal Kulinarny',
    instruction: `W Twoim mieście odbył się niedawno festiwal kulinarny. Na swoim blogu:
• wyjaśnij, dlaczego zdecydowałeś/aś się wziąć udział w tym wydarzeniu
• opisz potrawę, która najbardziej Ci smakowała
• napisz o spotkaniu z kucharzem, który Cię zainspirował
• zachęć czytelników do odwiedzania podobnych imprez w ich okolicy`
  },
  {
    id: 'w3',
    type: 'email_informal',
    title: 'E-mail: Zgubiona rzecz',
    instruction: `Podczas niedawnego pobytu w Londynie u koleżanki zgubiłeś/aś cenną dla Ciebie rzecz. W e-mailu do niej:
• napisz, co zgubiłeś/aś i w jakich okolicznościach to się stało
• wyjaśnij, dlaczego ta rzecz jest dla Ciebie tak ważna
• poproś o sprawdzenie, czy nie zostawiłeś/aś jej w jej domu
• zaproponuj sposób odebrania zguby, jeśli się znajdzie`
  },
  {
    id: 'w4',
    type: 'blog',
    title: 'Blog: Pierwsza praca',
    instruction: `Właśnie zacząłeś/aś swoją pierwszą pracę dorywczą. Podziel się wrażeniami na forum młodzieżowym:
• napisz, jaką pracę wykonujesz i jakie są Twoje główne obowiązki
• opisz swoich nowych współpracowników
• zrelacjonuj stresującą sytuację, która wydarzyła się pierwszego dnia
• napisz, na co zamierzasz przeznaczyć zarobione pieniądze`
  },
  {
    id: 'w5',
    type: 'email_informal',
    title: 'E-mail: Nowy uczeń',
    instruction: `Do Twojej klasy dołączył nowy uczeń z zagranicy. W e-mailu do przyjaciela z USA:
• napisz, jak wygląda nowy kolega i z jakiego kraju pochodzi
• opisz, jak klasa przywitała nowego ucznia
• zrelacjonuj problem, z jakim uczeń spotkał się pierwszego dnia w szkole
• napisz, jak pomogłeś/aś mu w tej trudnej sytuacji`
  },
  {
    id: 'w6',
    type: 'description',
    title: 'Opis: Koncert zespołu',
    instruction: `Byłeś/aś ostatnio na koncercie swojego ulubionego zespołu. W e-mailu do kolegi:
• napisz, gdzie odbył się koncert i jaka panowała atmosfera
• opisz wygląd i zachowanie wokalisty na scenie
• zrelacjonuj niespodziankę przygotowaną przez fanów dla zespołu
• wyraź swoją opinię na temat organizacji całego wydarzenia`
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

  const { setScreenContext } = useChatContext();

  // Word count logic similar to CKE (ignoring single characters usually, but basic split is fine)
  const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
  // CKE range for basic matura is 80-130 words. Limits are usually strict.
  const isLengthCorrect = wordCount >= 80 && wordCount <= 130;
  const isTooShort = wordCount > 0 && wordCount < 80;
  const isTooLong = wordCount > 130;

  // Update AI Context
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

  const handleGrade = async () => {
    if (wordCount < 10) {
      alert("Tekst jest zdecydowanie za krótki, aby go ocenić. Napisz przynajmniej kilka zdań.");
      return;
    }

    setIsGrading(true);
    // We pass the full instruction including bullet points to the AI
    const assessment = await gradeWritingTask(selectedTask.instruction, text);
    setResult(assessment);
    setIsGrading(false);
    
    // Reward XP if passed (approx 30% is usually passing, so > 3/10 points)
    if (assessment.suma >= 0) { // Always save result if graded successfully
      // Pass the specific ID of the writing task to saveTaskResult
      saveTaskResult('writing', assessment.suma, 10, selectedTask.id);
      onComplete();
    }
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
                <span className="text-gray-300 leading-relaxed">{trimmed.replace(/^[•-]\s*/, '')}</span>
              </div>
            );
          }
          return (
            <p key={idx} className="text-white font-medium mb-2 leading-relaxed">
              {line}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 h-full max-w-7xl mx-auto pb-12">
      
      {/* LEFT COLUMN: Editor & Instructions */}
      <div className="flex flex-col h-full gap-5">
        
        {/* Toolbar & Task Selector */}
        <div className="bg-[#0A1628] p-4 rounded-2xl border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
           <div className="flex items-center gap-3 w-full sm:w-auto">
             <div className="w-10 h-10 rounded-xl bg-pink-600/20 flex items-center justify-center text-pink-400 border border-pink-500/20">
               <PenTool size={20}/>
             </div>
             <div>
               <h2 className="text-white font-bold text-sm uppercase tracking-wide">Zadanie Pisemne</h2>
               <p className="text-xs text-gray-500">Wybierz temat z listy</p>
             </div>
           </div>
           
           <select 
              className="w-full sm:w-auto bg-[#0F1B2D] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-matura-accent focus:ring-1 focus:ring-matura-accent transition-all cursor-pointer font-medium"
              value={selectedTask.id}
              onChange={(e) => {
                setSelectedTask(TASKS.find(t => t.id === e.target.value) || TASKS[0]);
                setResult(null);
                setText('');
              }}
            >
              {TASKS.map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
        </div>

        {/* CKE Style Instruction Box */}
        <div className="bg-[#112240] p-6 rounded-2xl border border-white/10 shadow-md relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-matura-accent"></div>
            <div className="flex items-center gap-2 mb-4">
               <ListChecks className="text-matura-accent" size={18}/>
               <h3 className="text-xs font-bold text-matura-accent uppercase tracking-widest">Treść zadania</h3>
            </div>
            
            <div className="text-sm">
              {renderInstruction(selectedTask.instruction)}
            </div>
            
            <div className="mt-5 pt-4 border-t border-white/5 text-xs text-gray-500 italic flex items-center gap-2">
              <Info size={12}/>
              Rozwiń swoją wypowiedź w każdym z czterech podpunktów. Limit słów: 80-130.
            </div>
        </div>

        {/* Text Area Container */}
        <div className="flex-1 relative group flex flex-col min-h-[400px]">
           <div className="absolute -top-3 left-4 bg-[#0A1628] px-2 text-xs font-bold text-gray-500 uppercase tracking-widest z-10 border border-white/5 rounded">Twój tekst</div>
           <textarea
              className="flex-1 w-full bg-[#0F1B2D] border border-white/10 rounded-2xl p-6 text-gray-200 focus:outline-none focus:border-matura-accent/50 focus:bg-[#13233b] resize-none font-sans leading-relaxed text-base shadow-inner transition-all placeholder-gray-600"
              placeholder="Hi Tom, I hope you're doing well..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              spellCheck={false}
           />
           
           {/* Floating Word Counter */}
           <div className={`absolute bottom-4 right-4 px-3 py-1.5 rounded-lg text-xs font-bold border backdrop-blur-md transition-all flex items-center gap-2 shadow-lg ${
             isLengthCorrect 
               ? 'bg-green-500/10 text-green-400 border-green-500/30' 
               : (isTooShort || isTooLong)
                  ? 'bg-red-500/10 text-red-400 border-red-500/30'
                  : 'bg-gray-800/80 text-gray-400 border-white/10'
           }`}>
             {isLengthCorrect && <CheckCircle size={12} />}
             {(isTooShort || isTooLong) && <AlertTriangle size={12} />}
             <span>{wordCount} słów</span>
             <span className="opacity-40 font-normal border-l border-white/10 pl-2 ml-1">Limit: 80-130</span>
           </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleGrade}
          disabled={isGrading || wordCount === 0}
          className={`w-full py-4 rounded-xl font-bold flex items-center justify-center transition-all shadow-xl text-sm uppercase tracking-wider ${
            isGrading 
            ? 'bg-gray-800 text-gray-500 cursor-wait border border-white/5' 
            : 'bg-matura-accent text-matura-bg hover:bg-yellow-400 transform hover:-translate-y-1 shadow-yellow-500/20 active:translate-y-0 active:scale-[0.99]'
          }`}
        >
          {isGrading ? (
            <><RefreshCw className="animate-spin mr-3" /> Egzaminator sprawdza pracę...</>
          ) : (
            <><Sparkles className="mr-3" size={18} /> Oceń moją pracę (AI)</>
          )}
        </button>
      </div>

      {/* RIGHT COLUMN: Results */}
      <div className="h-full overflow-y-auto custom-scrollbar">
        {result ? (
          <div className="space-y-6 animate-slide-up pb-10">
            
            {/* Score Header */}
            <div className="bg-gradient-to-br from-[#0F1B2D] to-[#0A1628] p-8 rounded-3xl border border-white/10 relative overflow-hidden shadow-2xl">
               <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
               
               <div className="relative z-10">
                  <h3 className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
                    <Target size={14}/> Wynik Egzaminu
                  </h3>
                  
                  <div className="flex items-baseline gap-1 mb-4">
                     <span className={`text-6xl font-display font-bold ${result.suma >= 6 ? 'text-green-400' : result.suma >= 4 ? 'text-yellow-400' : 'text-red-400'}`}>
                       {result.suma}
                     </span>
                     <span className="text-2xl text-gray-500 font-bold">/ 10 pkt</span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden mb-6 border border-white/5">
                    <div 
                      style={{ width: `${(result.suma / 10) * 100}%` }} 
                      className={`h-full rounded-full transition-all duration-1000 ${
                        result.suma >= 6 ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 
                        result.suma >= 4 ? 'bg-gradient-to-r from-yellow-500 to-orange-400' : 
                        'bg-gradient-to-r from-red-500 to-rose-400'
                      }`}
                    ></div>
                  </div>

                  <div className="bg-black/20 p-4 rounded-xl border border-white/5 text-sm text-gray-200 leading-relaxed italic">
                    "{result.podsumowanie}"
                  </div>
               </div>
            </div>

            {/* Criteria Grid */}
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mt-2 ml-1">Szczegółowa ocena</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ScoreCard label="Treść" score={result.tresc.punkty} max={4} comment={result.tresc.komentarz} />
              <ScoreCard label="Spójność i logika" score={result.spojnosc.punkty} max={2} comment={result.spojnosc.komentarz} />
              <ScoreCard label="Zakres środków" score={result.zakres.punkty} max={2} comment={result.zakres.komentarz} />
              <ScoreCard label="Poprawność" score={result.poprawnosc.punkty} max={2} comment={result.poprawnosc.komentarz} />
            </div>

            {/* Errors Section */}
            {result.poprawnosc.bledy && result.poprawnosc.bledy.length > 0 && (
               <div className="bg-[#1a1313] rounded-2xl border border-red-500/20 p-6 shadow-inner">
                 <h4 className="flex items-center gap-2 text-red-400 font-bold text-sm mb-4 uppercase tracking-wider">
                   <AlertTriangle size={16}/> Wykryte błędy
                 </h4>
                 <ul className="space-y-3">
                   {result.poprawnosc.bledy.map((err, i) => (
                     <li key={i} className="text-sm text-gray-300 pl-4 border-l-2 border-red-500/40 bg-red-500/5 p-3 rounded-r-lg flex items-start">
                       <span className="mr-2 opacity-50">•</span> "{err}"
                     </li>
                   ))}
                 </ul>
               </div>
            )}

            {/* Tips Section */}
            <div className="bg-[#0F1B2D] rounded-2xl border border-matura-accent/20 p-6 shadow-inner">
               <h4 className="flex items-center gap-2 text-matura-accent font-bold text-sm mb-4 uppercase tracking-wider">
                 <Sparkles size={16}/> Wskazówki Egzaminatora
               </h4>
               <ul className="space-y-3">
                 {result.wskazowki.map((tip, i) => (
                   <li key={i} className="text-sm text-gray-300 flex items-start gap-3 bg-matura-accent/5 p-3 rounded-lg border border-matura-accent/10">
                     <div className="mt-1 w-5 h-5 rounded-full bg-matura-accent/20 flex items-center justify-center flex-shrink-0 text-matura-accent text-[10px] font-bold">
                        {i + 1}
                     </div>
                     <span className="leading-snug">{tip}</span>
                   </li>
                 ))}
               </ul>
            </div>

          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 border-2 border-dashed border-white/5 rounded-3xl bg-[#0A1628]/30 p-12 text-center group">
             <div className="w-24 h-24 rounded-full bg-[#0F1B2D] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 border border-white/5">
               <FileText size={48} className="text-gray-600 group-hover:text-matura-accent transition-colors"/>
             </div>
             <h3 className="text-xl font-bold text-gray-300 mb-2">Czekam na Twoją pracę</h3>
             <p className="text-sm max-w-xs leading-relaxed opacity-60 mb-8">
               Wybierz temat po lewej stronie, napisz tekst (pamiętając o 4 podpunktach) i kliknij "Oceń".
             </p>
             <div className="flex gap-2 text-xs font-bold uppercase tracking-widest text-gray-600">
                <span>Treść</span> • <span>Spójność</span> • <span>Zakres</span> • <span>Poprawność</span>
             </div>
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
        <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">{label}</span>
        <div className={`text-lg font-bold font-mono ${color}`}>{score}<span className="text-gray-600 text-sm">/{max}</span></div>
      </div>
      
      <div className="w-full h-1.5 bg-black/40 rounded-full mb-4 overflow-hidden">
        <div style={{ width: `${percentage}%` }} className={`h-full ${bg} rounded-full`}></div>
      </div>
      
      <p className="text-xs text-gray-400 leading-relaxed border-t border-white/5 pt-3 mt-auto">
        {comment}
      </p>
    </div>
  );
};

export default Writing;