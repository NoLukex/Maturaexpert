
import React, { useState } from 'react';
import { 
  User, 
  Lock, 
  Trash2, 
  Volume2, 
  Bell, 
  ShieldAlert, 
  GraduationCap, 
  Hammer, 
  UserCheck, 
  Cloud, 
  Download, 
  Upload, 
  Copy, 
  Check, 
  Smartphone, 
  Monitor 
} from 'lucide-react';
import { getStats } from '../services/storageService';

const Settings: React.FC = () => {
  const [exportCode, setExportCode] = useState<string>('');
  const [importCode, setImportCode] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const handleResetProgress = () => {
    if (confirm("Czy na pewno chcesz zresetować WSZYSTKIE postępy? Ta operacja jest nieodwracalna. (Ale spokojnie, imię Mateusz Wiśniewski zostanie!)")) {
      localStorage.removeItem('matura_master_stats');
      localStorage.removeItem('matura_master_flashcards');
      localStorage.removeItem('matura_master_vocab_indices');
      localStorage.removeItem('matura_master_daily_plan_v1');
      window.location.reload();
    }
  };

  const generateExportCode = () => {
    try {
      // Gather all local storage data
      const data = {
        stats: localStorage.getItem('matura_master_stats'),
        flashcards: localStorage.getItem('matura_master_flashcards'),
        vocabIndices: localStorage.getItem('matura_master_vocab_indices'),
        dailyPlan: localStorage.getItem('matura_master_daily_plan_v1'),
        timestamp: new Date().toISOString()
      };
      
      // Create a base64 string
      const jsonString = JSON.stringify(data);
      const encoded = btoa(encodeURIComponent(jsonString)); // encodeURIComponent handles special chars/emojis correctly before base64
      setExportCode(encoded);
      setCopySuccess(false);
    } catch (e) {
      console.error("Export failed", e);
      alert("Wystąpił błąd podczas generowania zapisu.");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(exportCode);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleImport = () => {
    if (!importCode.trim()) return;

    try {
      const jsonString = decodeURIComponent(atob(importCode.trim()));
      const data = JSON.parse(jsonString);

      if (!data.stats) throw new Error("Nieprawidłowy kod zapisu");

      if (confirm(`Znaleziono zapis z dnia ${new Date(data.timestamp).toLocaleDateString()}. Czy chcesz nadpisać obecne postępy na tym urządzeniu?`)) {
        if (data.stats) localStorage.setItem('matura_master_stats', data.stats);
        if (data.flashcards) localStorage.setItem('matura_master_flashcards', data.flashcards);
        if (data.vocabIndices) localStorage.setItem('matura_master_vocab_indices', data.vocabIndices);
        if (data.dailyPlan) localStorage.setItem('matura_master_daily_plan_v1', data.dailyPlan);
        
        alert("Pomyślnie zaimportowano postępy! Strona zostanie odświeżona.");
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
      setImportError("Ten kod jest nieprawidłowy lub uszkodzony.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 animate-fade-in space-y-8 pb-20">
      
      <div className="mb-6">
        <h2 className="text-3xl font-display font-bold text-white flex items-center gap-3">
          Ustawienia Konta
        </h2>
        <p className="text-gray-400">Personalizacja i zarządzanie aplikacją.</p>
      </div>

      {/* Cloud Sync Section - NEW */}
      <div className="bg-gradient-to-br from-[#112240] to-[#0A1628] rounded-3xl p-8 border border-matura-accent/20 shadow-xl relative overflow-hidden">
         <div className="absolute top-0 right-0 p-6 opacity-5">
            <Cloud size={120}/>
         </div>
         
         <h3 className="text-sm font-bold text-matura-accent uppercase tracking-widest mb-4 flex items-center gap-2">
           <Cloud size={16}/> Synchronizacja Postępów
         </h3>
         
         <p className="text-sm text-gray-300 mb-6 leading-relaxed max-w-lg">
           Chcesz przenieść postępy z komputera na telefon (lub odwrotnie)? 
           Wygeneruj <strong>Kod Zapisu</strong> na jednym urządzeniu i wklej go na drugim.
         </p>

         <div className="grid md:grid-cols-2 gap-8">
            
            {/* EXPORT */}
            <div className="bg-black/20 p-5 rounded-2xl border border-white/5">
               <div className="flex items-center gap-3 mb-4 text-blue-400 font-bold">
                 <Upload size={20}/> 1. Eksportuj (Wyślij)
               </div>
               
               {!exportCode ? (
                 <button 
                   onClick={generateExportCode}
                   className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg"
                 >
                   Generuj Kod Zapisu
                 </button>
               ) : (
                 <div className="space-y-3 animate-fade-in">
                   <div className="text-xs text-gray-500 uppercase font-bold">Twój kod (skopiuj go):</div>
                   <div className="bg-[#050B14] p-3 rounded-lg border border-white/10 break-all text-[10px] font-mono text-gray-400 h-24 overflow-y-auto custom-scrollbar select-all">
                     {exportCode}
                   </div>
                   <button 
                     onClick={copyToClipboard}
                     className={`w-full py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all ${copySuccess ? 'bg-green-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                   >
                     {copySuccess ? <><Check size={14}/> Skopiowano!</> : <><Copy size={14}/> Skopiuj do schowka</>}
                   </button>
                   <p className="text-[10px] text-gray-500 text-center">Wyślij ten kod sobie na Messenger/Email.</p>
                 </div>
               )}
            </div>

            {/* IMPORT */}
            <div className="bg-black/20 p-5 rounded-2xl border border-white/5">
               <div className="flex items-center gap-3 mb-4 text-green-400 font-bold">
                 <Download size={20}/> 2. Importuj (Odbierz)
               </div>
               
               <div className="space-y-3">
                 <textarea 
                   placeholder="Wklej tutaj kod z drugiego urządzenia..."
                   value={importCode}
                   onChange={(e) => {
                     setImportCode(e.target.value);
                     setImportError(null);
                   }}
                   className="w-full bg-[#050B14] border border-white/10 rounded-xl p-3 text-xs text-white focus:border-green-500 outline-none resize-none h-24 font-mono placeholder-gray-600"
                 />
                 {importError && <p className="text-red-400 text-xs font-bold flex items-center gap-1"><ShieldAlert size={12}/> {importError}</p>}
                 
                 <button 
                   onClick={handleImport}
                   disabled={!importCode}
                   className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg"
                 >
                   Wczytaj Zapis
                 </button>
               </div>
            </div>

         </div>

         <div className="mt-6 flex items-center justify-center gap-8 opacity-40">
            <Monitor size={32} />
            <div className="flex gap-1">
               <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce"></div>
               <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce delay-75"></div>
               <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce delay-150"></div>
            </div>
            <Smartphone size={32} />
         </div>
      </div>

      {/* Profil Section */}
      <div className="bg-[#112240] rounded-3xl p-8 border border-white/5 shadow-lg relative overflow-hidden">
         <div className="absolute top-0 right-0 p-6 opacity-5">
            <User size={120}/>
         </div>
         
         <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
           <UserCheck size={16}/> Profil Ucznia
         </h3>

         <div className="grid gap-6">
            <div className="space-y-2">
               <label className="text-xs text-gray-500 font-bold uppercase">Imię i Nazwisko</label>
               <div className="flex items-center gap-3 bg-[#0A1628] p-4 rounded-xl border border-white/10 opacity-70 cursor-not-allowed">
                  <User size={20} className="text-gray-400"/>
                  <span className="text-white font-bold text-lg flex-1">Mateusz Wiśniewski</span>
                  <Lock size={16} className="text-red-400"/>
               </div>
               <p className="text-[10px] text-gray-500 flex items-center gap-1">
                 <Lock size={10}/> To pole jest zablokowane przez administratora.
               </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
               <div className="bg-[#0A1628] p-4 rounded-xl border border-white/5">
                  <div className="text-xs text-gray-500 font-bold uppercase mb-1">Szkoła</div>
                  <div className="text-white font-medium flex items-center gap-2">
                    <Hammer size={16} className="text-orange-500"/> Technikum Budowlane
                  </div>
               </div>
               <div className="bg-[#0A1628] p-4 rounded-xl border border-white/5">
                  <div className="text-xs text-gray-500 font-bold uppercase mb-1">Status</div>
                  <div className="text-white font-medium flex items-center gap-2">
                    <GraduationCap size={16} className="text-matura-accent"/> Klasa Maturalna
                  </div>
               </div>
            </div>
            
            {/* Hidden Bio for User's Amusement */}
            <div className="bg-black/20 p-4 rounded-xl border border-white/5 text-xs text-gray-400 leading-relaxed">
               <strong className="text-gray-300 block mb-1">Notatki Systemowe (AI Context):</strong>
               Uczeń preferuje spodnie typu rurki. Bywalec siłowni. Cel maturalny: zaimponować Hani. Posiada wujka z Mustangiem. 
               <span className="text-red-400 ml-2">(Nie edytowalne)</span>
            </div>
         </div>
      </div>

      {/* Preferences */}
      <div className="bg-[#112240] rounded-3xl p-8 border border-white/5 shadow-lg">
         <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
           Preferencje
         </h3>
         
         <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-[#0A1628] rounded-xl border border-white/5">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                     <Volume2 size={20}/>
                  </div>
                  <div>
                     <div className="text-white font-bold text-sm">Efekty Dźwiękowe</div>
                     <div className="text-xs text-gray-500">Dźwięki przy poprawnej odpowiedzi</div>
                  </div>
               </div>
               <div className="w-12 h-6 bg-green-500 rounded-full relative cursor-pointer opacity-80">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-md"></div>
               </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#0A1628] rounded-xl border border-white/5">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
                     <Bell size={20}/>
                  </div>
                  <div>
                     <div className="text-white font-bold text-sm">Przypomnienia o nauce</div>
                     <div className="text-xs text-gray-500">Codzienne powiadomienia</div>
                  </div>
               </div>
               <div className="w-12 h-6 bg-green-500 rounded-full relative cursor-pointer opacity-80">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-md"></div>
               </div>
            </div>
         </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-500/5 rounded-3xl p-8 border border-red-500/20 shadow-lg">
         <h3 className="text-sm font-bold text-red-400 uppercase tracking-widest mb-6 flex items-center gap-2">
           <ShieldAlert size={16}/> Strefa Niebezpieczna
         </h3>
         
         <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-400">
               <p>Usuwa całą historię nauki, XP, passę i osiągnięcia z tego urządzenia.</p>
               <p className="text-xs mt-1 opacity-60">Aby przenieść dane, użyj sekcji Synchronizacji powyżej.</p>
            </div>
            <button 
               onClick={handleResetProgress}
               className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-red-900/20 flex items-center gap-2 whitespace-nowrap"
            >
               <Trash2 size={18}/> Resetuj Postępy
            </button>
         </div>
      </div>

    </div>
  );
};

export default Settings;
