
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getFlashcards, updateFlashcardStatus, addXP, getCategoryIndex, saveCategoryIndex, playFeedbackSound } from '../services/storageService';
import { Flashcard } from '../types';
import { RotateCw, Check, X, HelpCircle, Layers, ChevronLeft, Keyboard, Book, BrainCircuit, Trophy, PieChart, BarChart3, ArrowRight } from 'lucide-react';
import { useChatContext } from '../contexts/ChatContext';

const Vocabulary: React.FC = () => {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [viewMode, setViewMode] = useState<'overview' | 'study'>('overview');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Study State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  const { setScreenContext } = useChatContext();

  useEffect(() => {
    setCards(getFlashcards());
  }, []);

  // Prepare Statistics per Category
  const categoryStats = useMemo(() => {
    const categories = Array.from(new Set(cards.map(c => c.category)));
    
    return categories.map(cat => {
      const catCards = cards.filter(c => c.category === cat);
      const total = catCards.length;
      const mastered = catCards.filter(c => c.status === 'mastered').length;
      const learning = catCards.filter(c => c.status === 'learning').length;
      const _new = catCards.filter(c => c.status === 'new').length;
      const progress = total > 0 ? Math.round((mastered / total) * 100) : 0;
      
      return {
        name: cat,
        total,
        mastered,
        learning,
        new: _new,
        progress
      };
    }).sort((a, b) => b.progress - a.progress); // Sort by progress descending
  }, [cards]);

  const globalStats = useMemo(() => {
    const total = cards.length;
    const mastered = cards.filter(c => c.status === 'mastered').length;
    const progress = total > 0 ? Math.round((mastered / total) * 100) : 0;
    return { total, mastered, progress };
  }, [cards]);

  const exitStudyMode = useCallback(() => {
    setViewMode('overview');
    setSelectedCategory(null);
    setIsFlipped(false);
  }, []);

  // Enter Study Mode
  const startStudying = (category: string) => {
    setSelectedCategory(category);
    const savedIndex = getCategoryIndex(category);
    
    // Ensure index is valid for current category length
    const catLength = cards.filter(c => c.category === category).length;
    setCurrentIndex(savedIndex >= catLength ? 0 : savedIndex);
    
    setIsFlipped(false);
    setViewMode('study');
    window.history.pushState({ vocabularyStudy: true, category }, '', window.location.href);
  };

  const activeCards = useMemo(() => {
    if (!selectedCategory) return [];
    return cards.filter(c => c.category === selectedCategory);
  }, [cards, selectedCategory]);

  const currentCard = activeCards[currentIndex];

  useEffect(() => {
    const onPopState = () => {
      if (viewMode === 'study') {
        exitStudyMode();
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [viewMode, exitStudyMode]);

  // Update AI Context
  useEffect(() => {
    if (viewMode === 'overview') {
      setScreenContext(`
        MODUŁ: SŁOWNICTWO - PRZEGLĄD
        Uczeń przegląda statystyki swoich fiszek.
        Całkowity postęp: ${globalStats.progress}%.
        Liczba słów opanowanych: ${globalStats.mastered} / ${globalStats.total}.
        
        Jeśli uczeń zapyta, którą kategorię wybrać, zasugeruj tę, gdzie ma najwięcej słów "New" lub najsłabszy postęp.
      `);
    } else if (currentCard) {
      setScreenContext(`
        MODUŁ: SŁOWNICTWO (FISZKI)
        Kategoria: ${currentCard.category}
        Słowo Angielskie: ${currentCard.en}
        Słowo Polskie: ${currentCard.pl}
        Status nauki: ${currentCard.status}
        
        Jeśli uczeń pyta, podaj przykładowe zdanie z tym słowem, wymowę (opisz fonetycznie) lub synonimy.
      `);
    }
  }, [viewMode, currentCard, globalStats, setScreenContext]);

  const handleNext = useCallback((status: Flashcard['status']) => {
    if (!currentCard || !selectedCategory) return;
    
    updateFlashcardStatus(currentCard.id, status);
    
    const updatedCards = cards.map(c => c.id === currentCard.id ? { ...c, status } : c);
    setCards(updatedCards);
    
    if (status === 'mastered') addXP(5);
    else if (status === 'learning') addXP(2);
    else addXP(1);

    playFeedbackSound(status === 'mastered' ? 'success' : 'error');

    setIsFlipped(false);
    setTimeout(() => {
      const nextIndex = (currentIndex + 1) % activeCards.length;
      setCurrentIndex(nextIndex);
      saveCategoryIndex(selectedCategory, nextIndex);
    }, 150);
  }, [currentCard, cards, currentIndex, activeCards.length, selectedCategory]);

  // Keyboard Shortcuts (Only in Study Mode)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode !== 'study' || !currentCard) return;
      
      switch(e.code) {
        case 'Space':
        case 'ArrowUp':
        case 'ArrowDown':
          e.preventDefault();
          setIsFlipped(prev => !prev);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleNext('new');
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleNext('mastered');
          break;
        case 'KeyL': 
           handleNext('learning');
           break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, currentCard, viewMode]);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'mastered': return <span className="text-green-400 bg-green-500/10 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.2)]">Opanowane</span>;
      case 'learning': return <span className="text-yellow-400 bg-yellow-500/10 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.2)]">Do powtórki</span>;
      default: return <span className="text-gray-400 bg-gray-500/10 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-gray-500/20">Nowe</span>;
    }
  };

  // --- VIEW: OVERVIEW (DASHBOARD) ---
  if (viewMode === 'overview') {
    return (
      <div className="max-w-6xl mx-auto space-y-8 pb-12 animate-fade-in">
        
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-gradient-to-br from-[#112240] to-[#0A1628] p-6 rounded-3xl border border-white/5 relative overflow-hidden group hover:border-white/10 transition-all">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Book size={100} />
              </div>
              <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Baza Słownictwa</h3>
              <div className="text-4xl font-display font-bold text-white mb-1">{globalStats.total}</div>
              <p className="text-sm text-gray-500">Wszystkich dostępnych słówek</p>
           </div>

           <div className="bg-gradient-to-br from-[#112240] to-[#0A1628] p-6 rounded-3xl border border-white/5 relative overflow-hidden group hover:border-matura-accent/30 transition-all">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-matura-accent">
                <Trophy size={100} />
              </div>
              <h3 className="text-matura-accent text-xs font-bold uppercase tracking-widest mb-2">Opanowane</h3>
              <div className="text-4xl font-display font-bold text-matura-accent mb-1">{globalStats.mastered}</div>
              <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                 <div style={{ width: `${globalStats.progress}%` }} className="h-full bg-matura-accent rounded-full shadow-[0_0_10px_rgba(245,197,24,0.5)]"></div>
              </div>
              <p className="text-xs text-matura-accent/70 mt-2 font-bold">{globalStats.progress}% całości</p>
           </div>

           <div className="bg-gradient-to-br from-[#112240] to-[#0A1628] p-6 rounded-3xl border border-white/5 relative overflow-hidden flex items-center justify-center text-center group hover:border-purple-500/30 transition-all">
               <div className="space-y-2">
                 <div className="w-12 h-12 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/10">
                   <BrainCircuit size={24}/>
                 </div>
                 <h3 className="text-white font-bold">Tryb Inteligentny</h3>
                 <p className="text-xs text-gray-400 max-w-[200px]">AI dobierze słówka, z którymi masz największy problem.</p>
                 <button className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-bold mt-2 transition-colors">
                   Wkrótce
                 </button>
               </div>
           </div>
        </div>

        {/* Categories Grid */}
        <div>
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Layers size={20} className="text-gray-400"/> Wybierz kategorię do nauki
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryStats.map((cat) => (
              <button
                key={cat.name}
                onClick={() => startStudying(cat.name)}
                className="bg-[#0F1B2D]/80 backdrop-blur-md border border-white/5 hover:border-matura-accent/50 p-6 rounded-2xl text-left transition-all hover:bg-[#13233b] group relative overflow-hidden hover:-translate-y-1 shadow-lg"
              >
                <div className="flex justify-between items-start mb-4 relative z-10">
                   <div>
                     <h3 className="font-bold text-lg text-white group-hover:text-matura-accent transition-colors">{cat.name}</h3>
                     <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{cat.total} fiszek</p>
                   </div>
                   <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 group-hover:bg-matura-accent group-hover:text-matura-bg transition-colors">
                      <ArrowRight size={18}/>
                   </div>
                </div>

                {/* Progress Bars */}
                <div className="space-y-2 relative z-10">
                   <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      <span>Postęp</span>
                      <span className={cat.progress === 100 ? 'text-green-500' : 'text-gray-300'}>{cat.progress}%</span>
                   </div>
                   <div className="h-2 w-full bg-black/40 rounded-full flex overflow-hidden">
                      <div style={{ width: `${(cat.mastered / cat.total) * 100}%` }} className="h-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]" title="Opanowane"/>
                      <div style={{ width: `${(cat.learning / cat.total) * 100}%` }} className="h-full bg-yellow-500" title="W trakcie"/>
                      <div style={{ width: `${(cat.new / cat.total) * 100}%` }} className="h-full bg-gray-700" title="Nowe"/>
                   </div>
                   
                   <div className="flex gap-4 mt-2 pt-2 border-t border-white/5 text-[10px] text-gray-400">
                      <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>{cat.mastered}</span>
                      <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>{cat.learning}</span>
                      <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>{cat.new}</span>
                   </div>
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>
    );
  }

  // --- VIEW: STUDY MODE ---
  return (
    <div className="max-w-xl mx-auto h-full flex flex-col py-2 md:py-6 animate-slide-up">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={exitStudyMode}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-wide px-3 py-2 rounded-lg hover:bg-white/5 group"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> Wróć do listy
        </button>
        
        <div className="text-center">
          <h2 className="text-white font-bold">{selectedCategory}</h2>
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
             <span>{currentIndex + 1}</span>
             <span className="opacity-40">/</span>
             <span>{activeCards.length}</span>
          </div>
        </div>

        <div className="w-24 flex justify-end">
           {/* Placeholder */}
        </div>
      </div>

      {/* Progress Line for Session */}
      <div className="h-1.5 w-full bg-[#0F1B2D] rounded-full flex overflow-hidden mb-6 shadow-inner">
          {activeCards.map((c, i) => (
            <div 
              key={c.id} 
              className={`flex-1 mx-[1px] rounded-full transition-all duration-300 ${
                i === currentIndex ? 'bg-white scale-y-150 shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 
                c.status === 'mastered' ? 'bg-green-500/50' : 
                c.status === 'learning' ? 'bg-yellow-500/50' : 'bg-gray-700/30'
              }`} 
            />
          ))}
      </div>

      {/* Flashcard Area */}
      <div className="flex-1 flex items-center justify-center perspective-1000 my-2">
        {currentCard ? (
          <div 
            onClick={() => setIsFlipped(!isFlipped)}
            className={`relative w-full aspect-[4/5] md:aspect-[5/3] transition-all duration-700 transform-style-3d cursor-pointer group ${isFlipped ? 'rotate-y-180' : ''}`}
          >
            {/* FRONT */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-3xl border border-white/10 flex flex-col items-center justify-center shadow-2xl backface-hidden group-hover:border-matura-accent/30 transition-all p-8 group-hover:scale-[1.02]">
               <div className="absolute top-6 right-6">
                 {getStatusBadge(currentCard.status)}
               </div>
               
               <div className="text-center space-y-8">
                 <span className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">Angielski</span>
                 <h2 className="text-4xl md:text-5xl font-display font-bold text-white drop-shadow-lg break-words max-w-full leading-tight">
                   {currentCard.en}
                 </h2>
                 <p className="text-matura-accent text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity animate-pulse flex items-center justify-center gap-2 absolute bottom-8 left-0 right-0">
                   <RotateCw size={12}/> Odwróć (Spacja)
                 </p>
               </div>
            </div>

            {/* BACK */}
            <div className="absolute inset-0 bg-[#0F1B2D] rounded-3xl border border-matura-accent/40 flex flex-col items-center justify-center shadow-[0_0_30px_rgba(245,197,24,0.1)] rotate-y-180 backface-hidden p-8">
               <div className="absolute top-6 right-6 opacity-50">
                 {getStatusBadge(currentCard.status)}
               </div>
               
               <div className="text-center space-y-4">
                 <span className="text-xs text-gray-500 font-serif italic">znaczenie:</span>
                 <h2 className="text-3xl md:text-4xl font-bold text-matura-accent break-words max-w-full leading-tight">
                   {currentCard.pl}
                 </h2>
               </div>
            </div>
          </div>
        ) : (
          <div className="text-gray-500 flex flex-col items-center animate-fade-in">
             <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                <Check size={48} className="text-green-500"/>
             </div>
             <span className="text-lg font-bold text-white">Koniec kart w tej kategorii</span>
             <button onClick={() => setViewMode('overview')} className="mt-6 text-sm bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl transition-colors text-white font-bold">Wróć do menu</button>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-4 mt-6">
        <div className="grid grid-cols-3 gap-4">
          <button 
            onClick={(e) => { e.stopPropagation(); handleNext('new'); }}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#0F1B2D] border border-red-500/20 text-gray-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all active:scale-95 group hover:-translate-y-1"
          >
            <X className="mb-1 text-red-500/50 group-hover:text-red-500 transition-colors" size={24} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Nie znam</span>
            <span className="text-[9px] text-gray-600 mt-1 font-mono">← LEFT</span>
          </button>

          <button 
            onClick={(e) => { e.stopPropagation(); handleNext('learning'); }}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#0F1B2D] border border-yellow-500/20 text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 hover:border-yellow-500/50 transition-all active:scale-95 group hover:-translate-y-1"
          >
            <HelpCircle className="mb-1 text-yellow-500/50 group-hover:text-yellow-500 transition-colors" size={24} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Prawie</span>
            <span className="text-[9px] text-gray-600 mt-1 font-mono">L</span>
          </button>

          <button 
            onClick={(e) => { e.stopPropagation(); handleNext('mastered'); }}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#0F1B2D] border border-green-500/20 text-gray-400 hover:text-green-400 hover:bg-green-500/10 hover:border-green-500/50 transition-all active:scale-95 group hover:-translate-y-1"
          >
            <Check className="mb-1 text-green-500/50 group-hover:text-green-500 transition-colors" size={24} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Umiem!</span>
            <span className="text-[9px] text-gray-600 mt-1 font-mono">RIGHT →</span>
          </button>
        </div>
      </div>

    </div>
  );
};

export default Vocabulary;
