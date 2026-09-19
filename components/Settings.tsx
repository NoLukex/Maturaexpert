
import React, { useState, useEffect } from 'react';
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
  Monitor,
  Cpu,
  Key,
  Sparkles
} from 'lucide-react';
import { getPreferences, updatePreferences } from '../services/storageService';
import { getApiKey, setCustomApiKey, hasValidApiKey, checkAIStatus } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';

const Settings: React.FC = () => {
  const initialPreferences = getPreferences();
  const { cloudUserId, syncing, lastSyncedAt, syncNow, switchCloudUser } = useAuth();
  const [exportCode, setExportCode] = useState<string>('');
  const [importCode, setImportCode] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState(initialPreferences.soundEffects);
  const [studyRemindersEnabled, setStudyRemindersEnabled] = useState(initialPreferences.studyReminders);
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [apiKeySaved, setApiKeySaved] = useState<boolean>(false);
  const [isKeyValid, setIsKeyValid] = useState<boolean>(false);
  const [cloudProfileInput, setCloudProfileInput] = useState<string>(cloudUserId || 'mateusz-wisniewski');
  const [cloudSyncFeedback, setCloudSyncFeedback] = useState<string | null>(null);
  const [aiEngineStatus, setAiEngineStatus] = useState<{ isRealAI: boolean; model: string; hasKey: boolean }>({
    isRealAI: true,
    model: 'Google Gemini',
    hasKey: true
  });

  useEffect(() => {
    const key = getApiKey();
    setApiKeyInput(key);
    setIsKeyValid(hasValidApiKey());
    checkAIStatus().then(status => {
      setAiEngineStatus(status);
    });
  }, []);

  const handleSaveApiKey = () => {
    setCustomApiKey(apiKeyInput.trim());
    setIsKeyValid(hasValidApiKey());
    setApiKeySaved(true);
    setTimeout(() => setApiKeySaved(false), 2500);
  };

  const toggleSoundEffects = () => {
    const next = !soundEffectsEnabled;
    setSoundEffectsEnabled(next);
    updatePreferences({ soundEffects: next });
  };

  const toggleStudyReminders = () => {
    const next = !studyRemindersEnabled;
    setStudyRemindersEnabled(next);
    updatePreferences({ studyReminders: next });
  };

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

      {/* Cloud Sync Section - Enhanced */}
      <div className="bg-gradient-to-br from-[#112240] to-[#0A1628] rounded-3xl p-8 border border-emerald-500/30 shadow-xl relative overflow-hidden">
         <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
            <Cloud size={140}/>
         </div>
         
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
              <Cloud size={16}/> Chmura i Automatyczna Synchronizacja Postępów
            </h3>
            <span className="text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <span className={`w-2 h-2 rounded-full ${syncing ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`}></span>
              {syncing ? 'Trwa zapis w chmurze...' : 'Chmura Aktywna (100% bez logowania)'}
            </span>
         </div>
         
         <p className="text-sm text-gray-300 mb-6 leading-relaxed max-w-2xl">
           Twoje postępy (XP, rozwiązane zadania, błędy, nauczone słownictwo) są <strong>automatycznie zapisywane na bieżąco w bezpiecznej chmurze serwerowej</strong>. Nie musisz zakładać konta ani wpisywać haseł.
         </p>

         {/* Server Cloud Quick Controls */}
         <div className="bg-[#050B14] p-5 rounded-2xl border border-white/10 mb-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
               <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Twój Identyfikator w Chmurze:</span>
                    <span className="text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {cloudUserId}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1">
                    {lastSyncedAt ? `Ostatni zapis w chmurze: ${new Date(lastSyncedAt).toLocaleTimeString()}` : 'Gotowy do synchronizacji'}
                  </div>
               </div>

               <button
                  onClick={async () => {
                    await syncNow();
                    setCloudSyncFeedback('Postępy pomyślnie zapisane w chmurze serwera!');
                    setTimeout(() => setCloudSyncFeedback(null), 3000);
                  }}
                  disabled={syncing}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950/30"
               >
                  <Cloud size={14}/>
                  {syncing ? 'Zapisywanie...' : 'Zsynchronizuj teraz z chmurą'}
               </button>
            </div>

            {cloudSyncFeedback && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 font-medium flex items-center gap-2 animate-fade-in">
                <Check size={14}/> {cloudSyncFeedback}
              </div>
            )}

            {/* Profile Switcher / Device link */}
            <div className="pt-3 border-t border-white/5">
              <label className="text-[11px] text-gray-400 font-bold uppercase block mb-1.5">
                Chcesz połączyć drugie urządzenie (telefon/tablet)?
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Wpisz ID profilu z drugiego urządzenia (np. mateusz-wisniewski)"
                  value={cloudProfileInput}
                  onChange={(e) => setCloudProfileInput(e.target.value)}
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-emerald-500 font-mono"
                />
                <button
                  onClick={async () => {
                    if (!cloudProfileInput.trim()) return;
                    await switchCloudUser(cloudProfileInput.trim());
                    setCloudSyncFeedback(`Wczytano i połączono z profilem: ${cloudProfileInput.trim()}`);
                    setTimeout(() => setCloudSyncFeedback(null), 3500);
                  }}
                  disabled={syncing || !cloudProfileInput.trim()}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Download size={14}/> Wczytaj profil
                </button>
              </div>
              <p className="text-[10px] text-gray-500 mt-1.5">
                Wystarczy wpisać ten sam identyfikator na telefonie, aby natychmiast mieć te same postępy.
              </p>
            </div>
         </div>

         <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
           Alternatywny Eksport / Kopia Zapasowa (Plik / Kod)
         </div>

         <div className="grid md:grid-cols-2 gap-6">
            
            {/* EXPORT */}
            <div className="bg-black/20 p-5 rounded-2xl border border-white/5">
               <div className="flex items-center gap-3 mb-4 text-blue-400 font-bold text-xs">
                 <Upload size={18}/> 1. Eksportuj Kod Zapisu
               </div>
               
               {!exportCode ? (
                 <button 
                   onClick={generateExportCode}
                   className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg"
                 >
                   Generuj Kod Zapisu
                 </button>
               ) : (
                 <div className="space-y-3 animate-fade-in">
                   <div className="text-xs text-gray-500 uppercase font-bold">Twój kod (skopiuj go):</div>
                   <div className="bg-[#050B14] p-3 rounded-lg border border-white/10 break-all text-[10px] font-mono text-gray-400 h-20 overflow-y-auto custom-scrollbar select-all">
                     {exportCode}
                   </div>
                   <button 
                     onClick={copyToClipboard}
                     className={`w-full py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all ${copySuccess ? 'bg-green-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                   >
                     {copySuccess ? <><Check size={14}/> Skopiowano!</> : <><Copy size={14}/> Skopiuj do schowka</>}
                   </button>
                 </div>
               )}
            </div>

            {/* IMPORT */}
            <div className="bg-black/20 p-5 rounded-2xl border border-white/5">
               <div className="flex items-center gap-3 mb-4 text-green-400 font-bold text-xs">
                 <Download size={18}/> 2. Importuj Kod Zapisu
               </div>
               
               <div className="space-y-3">
                 <textarea 
                   placeholder="Wklej tutaj kod zapisu z drugiego urządzenia..."
                   value={importCode}
                   onChange={(e) => {
                     setImportCode(e.target.value);
                     setImportError(null);
                   }}
                   className="w-full bg-[#050B14] border border-white/10 rounded-xl p-3 text-xs text-white focus:border-green-500 outline-none resize-none h-20 font-mono placeholder-gray-600"
                 />
                 {importError && <p className="text-red-400 text-xs font-bold flex items-center gap-1"><ShieldAlert size={12}/> {importError}</p>}
                 
                 <button 
                   onClick={handleImport}
                   disabled={!importCode}
                   className="w-full py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg"
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
                <button
                  type="button"
                  aria-pressed={soundEffectsEnabled}
                  onClick={toggleSoundEffects}
                  className={`w-12 h-6 rounded-full relative cursor-pointer opacity-90 transition-colors ${soundEffectsEnabled ? 'bg-green-500' : 'bg-gray-600'}`}
                >
                   <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all ${soundEffectsEnabled ? 'right-1' : 'left-1'}`}></div>
                </button>
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
                <button
                  type="button"
                  aria-pressed={studyRemindersEnabled}
                  onClick={toggleStudyReminders}
                  className={`w-12 h-6 rounded-full relative cursor-pointer opacity-90 transition-colors ${studyRemindersEnabled ? 'bg-green-500' : 'bg-gray-600'}`}
                >
                   <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all ${studyRemindersEnabled ? 'right-1' : 'left-1'}`}></div>
                </button>
             </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Przypomnienia sa wyswietlane raz dziennie po otwarciu aplikacji.
          </p>
       </div>

      {/* AI Engine & API Key Section */}
      <div className="bg-[#112240] rounded-3xl p-8 border border-white/5 shadow-lg relative overflow-hidden">
         <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
               <Cpu size={16} className="text-blue-400"/> Silnik Prawdziwego AI i Tryb Egzaminacyjny
            </h3>
            <span className="text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
               <Sparkles size={12}/>
               {aiEngineStatus.isRealAI ? 'Google Gemini AI (Aktywne)' : 'Silnik CKE (Aktywny)'}
            </span>
         </div>

         <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-5 flex items-start gap-3">
           <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping mt-1 flex-shrink-0"></div>
           <div>
             <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Prawdziwe AI Google Gemini 3.8 / Flash</h4>
             <p className="text-xs text-gray-300 mt-1 leading-relaxed">
               Aplikacja jest w pełni połączona z serwerowym silnikiem <strong>Google Gemini</strong>. Prawdziwa sztuczna inteligencja odpowiada na Twoje pytania w czacie z trenerem Mateusza, sprawdza wypracowania według oficjalnych kryteriów CKE oraz asystuje w przygotowaniach do matury.
             </p>
           </div>
         </div>

         <div className="bg-[#0A1628] p-5 rounded-2xl border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
               <label className="text-xs text-gray-400 font-bold uppercase flex items-center gap-2">
                  <Key size={14} className="text-yellow-400"/> Własny klucz API (opcjonalny)
               </label>
               <span className="text-[11px] text-gray-500">NVIDIA NIM / OpenAI compatible</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
               <input
                  type="password"
                  placeholder="Wklej klucz (np. nvapi-...), aby użyć zewnętrznych modeli chmurowych"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="flex-1 bg-[#050B14] border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-600 outline-none focus:border-blue-500 font-mono"
               />
               <button
                  onClick={handleSaveApiKey}
                  className={`px-5 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${apiKeySaved ? 'bg-green-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
               >
                  {apiKeySaved ? <><Check size={14}/> Zapisano</> : 'Zapisz'}
               </button>
            </div>
            <p className="text-[11px] text-gray-500">
               Pozostaw to pole puste – serwer Google Gemini działa od razu i bez konieczności konfiguracji.
            </p>
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
