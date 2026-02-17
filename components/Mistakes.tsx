
import React, { useState, useEffect } from 'react';
import { getStats, removeMistake } from '../services/storageService';
import { Mistake } from '../types';
import { AlertOctagon, Trash2, CheckCircle2, RefreshCw } from 'lucide-react';

const Mistakes: React.FC = () => {
  const [mistakes, setMistakes] = useState<Mistake[]>([]);

  useEffect(() => {
    const loadData = () => {
      const stats = getStats();
      setMistakes(stats.mistakes || []);
    };
    loadData();
    
    // Add event listener for local storage changes if needed, but for now direct load is ok on mount
  }, []);

  const handleDelete = (id: string) => {
    removeMistake(id);
    setMistakes(prev => prev.filter(m => m.id !== id));
  };

  if (mistakes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 size={48} className="text-green-500" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Świetna robota!</h2>
        <p className="text-gray-400 max-w-md">
          Twój Bank Błędów jest pusty. Oznacza to, że albo wszystko umiesz, albo jeszcze nie zacząłeś ćwiczyć. Wracaj do nauki!
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 h-full flex flex-col">
      <div className="mb-8">
        <h2 className="text-3xl font-display font-bold text-white flex items-center gap-3">
          <AlertOctagon size={32} className="text-red-500" /> Bank Błędów
        </h2>
        <p className="text-gray-400 mt-2">
          Tutaj trafiają zadania, które sprawiły Ci trudność. Przejrzyj je i usuń, gdy już zrozumiesz poprawną odpowiedź.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pb-20">
        {mistakes.map((mistake) => (
          <div key={mistake.id} className="bg-[#112240] border border-white/5 rounded-2xl p-6 relative group hover:border-red-500/30 transition-colors">
            
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => handleDelete(mistake.id)}
                className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                title="Usuń z listy (Umiem to!)"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="mb-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 bg-black/20 px-2 py-1 rounded">
                {mistake.module === 'grammar' ? 'Gramatyka' : mistake.module}
              </span>
              <span className="ml-3 text-xs text-gray-600">
                {new Date(mistake.timestamp).toLocaleDateString()}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-gray-400 text-xs uppercase font-bold mb-1">Pytanie / Kontekst</p>
                <div className="text-lg text-white font-medium">
                  {mistake.context ? (
                    <span className="opacity-70 mr-2">{mistake.context}</span>
                  ) : null}
                  {mistake.question}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
                  <p className="text-red-400 text-xs uppercase font-bold mb-1">Twoja odpowiedź</p>
                  <p className="text-gray-200 line-through decoration-red-500/50">{mistake.userAnswer || "(brak)"}</p>
                </div>
                <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-xl">
                  <p className="text-green-400 text-xs uppercase font-bold mb-1">Poprawna odpowiedź</p>
                  <p className="text-white font-bold">{mistake.correctAnswer}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Mistakes;
