
import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserStats } from '../types';
import {
  getDaysToMatura, ACHIEVEMENTS_LIST, getDailyPlanStatus, toggleDailyPlanTask, getLocalDateKey,
  getDailyChallengeStatus, completeDailyChallenge
} from '../services/storageService';
import {
  Zap, Trophy, Target, BookOpen, Clock, CheckCircle, BrainCircuit,
  AlertOctagon, BookA, Library, Headphones, FileText, Star, Award,
  Crown, Moon, Sun, Trash2, CheckSquare, Square,
  Languages, Lightbulb, Dumbbell, Heart, Flame, RotateCw, Check,
  Car, Hammer, Volume2, Sparkles, CheckCircle2, Shuffle, ArrowRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Card from './ui/Card';
import Button from './ui/Button';

interface DashboardProps {
  stats: UserStats;
}

// Icon mapping
const ICON_MAP: Record<string, any> = {
  Dumbbell, Heart, Zap, BrainCircuit, Trophy, Star, BookOpen, Car, Hammer, Lightbulb, Clock, Trash2, BookA, Volume2, Sparkles
};

// --- 50 UNIKALNYCH ZDAŃ (MATEUSZ LORE) ---
const MATEUSZ_CHALLENGES = [
  // ... (Keep existing array content same as previous update)
  // HANIA (Love Interest)
  { en: "I saw Hania at the bus stop and forgot my own name.", pl: "Zobaczyłem Hanię na przystanku i zapomniałem, jak się nazywam.", icon: "Heart" },
  { en: "Hania liked my post on Instagram, so we are basically married.", pl: "Hania polubiła mój post na Instagramie, więc praktycznie jesteśmy małżeństwem.", icon: "Heart" },
  { en: "I bought flowers for Hania, but I gave them to my mom instead.", pl: "Kupiłem kwiaty dla Hani, ale dałem je mamie.", icon: "Heart" },
  { en: "Does Hania like boys who drive Mustangs?", pl: "Czy Hania lubi chłopaków, którzy jeżdżą Mustangami?", icon: "Car" },
  { en: "I pretended to read a book because Hania was looking.", pl: "Udawałem, że czytam książkę, bo Hania patrzyła.", icon: "BookOpen" },
  { en: "My biceps are huge, but my heart is empty without Hania.", pl: "Moje bicepsy są wielkie, ale serce puste bez Hani.", icon: "Dumbbell" },
  { en: "I hope Hania notices my new skinny jeans.", pl: "Mam nadzieję, że Hania zauważy moje nowe rurki.", icon: "Star" },
  { en: "Hania smiled at me, or maybe at the guy behind me.", pl: "Hania uśmiechnęła się do mnie, albo do gościa za mną.", icon: "BrainCircuit" },
  { en: "I need to pass Matura to impress Hania's father.", pl: "Muszę zdać maturę, żeby zaimponować ojcu Hani.", icon: "Trophy" },
  { en: "Every rep at the gym is for Hania.", pl: "Każde powtórzenie na siłowni jest dla Hani.", icon: "Dumbbell" },

  // MUSTANG & WUJEK
  { en: "My uncle said I can drive the Mustang if I pass English.", pl: "Wujek powiedział, że dam mi poprowadzić Mustanga, jak zdam angielski.", icon: "Car" },
  { en: "The Mustang is broken again, just like my dreams.", pl: "Mustang znowu się zepsuł, tak jak moje marzenia.", icon: "Car" },
  { en: "I tried to drift in the Mustang but I hit a tree.", pl: "Próbowałem driftować Mustangiem, ale uderzyłem w drzewo.", icon: "Car" },
  { en: "Krystian screamed when I started the Mustang's engine.", pl: "Krystian krzyknął, jak odpaliłem silnik Mustanga.", icon: "Car" },
  { en: "I took a photo with the Mustang to make Oliwia jealous.", pl: "Zrobiłem sobie fotkę z Mustangiem, żeby Oliwia była zazdrosna.", icon: "Car" },
  { en: "This Mustang consumes more fuel than I consume protein.", pl: "Ten Mustang pali więcej paliwa niż ja zjadam białka.", icon: "Zap" },
  { en: "My uncle loves his car more than his family.", pl: "Mój wujek kocha swój samochód bardziej niż rodzinę.", icon: "Heart" },
  { en: "I want to paint the Mustang matte black.", pl: "Chcę pomalować Mustanga na czarny mat.", icon: "Car" },

  // GYM & KRYSTIAN
  { en: "Krystian benches 100kg, but I have better technique.", pl: "Krystian wyciska 100kg, ale ja mam lepszą technikę.", icon: "Dumbbell" },
  { en: "Leg day is a myth invented by the government.", pl: "Dzień nóg to mit wymyślony przez rząd.", icon: "BrainCircuit" },
  { en: "My protein shake tastes like chalk, but gains are gains.", pl: "Mój szejk białkowy smakuje jak kreda, ale masa to masa.", icon: "Zap" },
  { en: "I spotted Krystian while he was lifting heavy weights.", pl: "Asekurowałem Krystiana, gdy podnosił duże ciężary.", icon: "Dumbbell" },
  { en: "Do I need English if I want to be a personal trainer?", pl: "Czy potrzebuję angielskiego, jeśli chcę być trenerem personalnym?", icon: "Trophy" },
  { en: "My gym membership is more expensive than my books.", pl: "Karnet na siłownię jest droższy niż moje książki.", icon: "Star" },
  { en: "I tore my favourite t-shirt while flexing.", pl: "Rozdarłem ulubioną koszulkę podczas napinania mięśni.", icon: "Dumbbell" },
  { en: "Krystian says creatine is safe, so I trust him.", pl: "Krystian mówi, że kreatyna jest bezpieczna, więc mu ufam.", icon: "BrainCircuit" },
  { en: "We train chest every Monday, no exceptions.", pl: "Robimy klatę w każdy poniedziałek, bez wyjątków.", icon: "Dumbbell" },

  // EX-GIRLFRIENDS (DRAMA)
  { en: "Sara texted me, but I am too busy studying.", pl: "Sara do mnie napisała, ale jestem zbyt zajęty nauką.", icon: "BrainCircuit" },
  { en: "Oliwia never appreciated my sense of style.", pl: "Oliwia nigdy nie doceniała mojego stylu.", icon: "Star" },
  { en: "I blocked Klaudia because she laughed at my shoes.", pl: "Zablokowałem Klaudię, bo śmiała się z moich butów.", icon: "Trash2" },
  { en: "My ex-girlfriend is dating a guy who rides a bike.", pl: "Moja była chodzi z gościem, który jeździ na rowerze.", icon: "Car" },
  { en: "I saw Sara at the cinema with someone else.", pl: "Widziałem Sarę w kinie z kimś innym.", icon: "Heart" },
  { en: "Gosia was my first love in primary school.", pl: "Gosia była moją pierwszą miłością w podstawówce.", icon: "Heart" },
  { en: "I don't need Sara, I have the gym.", pl: "Nie potrzebuję Sary, mam siłownię.", icon: "Dumbbell" },

  // FASHION (SKINNY JEANS)
  { en: "My jeans are so tight I cannot feel my legs.", pl: "Moje dżinsy są tak ciasne, że nie czuję nóg.", icon: "Zap" },
  { en: "It takes me ten minutes to take off these trousers.", pl: "Zajmuje mi dziesięć minut, żeby zdjąć te spodnie.", icon: "Clock" },
  { en: "Krystian says my pants look like leggings.", pl: "Krystian mówi, że moje spodnie wyglądają jak legginsy.", icon: "Star" },
  { en: "I cannot squat in these jeans.", pl: "Nie mogę zrobić przysiadu w tych dżinsach.", icon: "Dumbbell" },
  { en: "Fashion is pain, but I look good.", pl: "Moda to ból, ale wyglądam dobrze.", icon: "Star" },
  { en: "I need to buy tighter jeans for the party.", pl: "Muszę kupić węższe dżinsy na imprezę.", icon: "Trophy" },

  // GENERAL & SCHOOL
  { en: "I failed math again, but English is easy.", pl: "Znowu oblałem matmę, ale angielski jest łatwy.", icon: "BookOpen" },
  { en: "I used to be a pro in Fortnite, now I am retired.", pl: "Kiedyś byłem pro w Fortnite, teraz jestem na emeryturze.", icon: "Trophy" },
  { en: "The teacher asked me about the Future Simple tense.", pl: "Nauczyciel zapytał mnie o czas Future Simple.", icon: "BookA" },
  { en: "I am hungry, let's go for a kebab.", pl: "Jestem głodny, chodźmy na kebaba.", icon: "Zap" },
  { en: "My mother says I spend too much time on my phone.", pl: "Mama mówi, że spędzam za dużo czasu na telefonie.", icon: "BrainCircuit" },
  { en: "I will study tomorrow, today I rest.", pl: "Będę się uczył jutro, dzisiaj odpoczywam.", icon: "Clock" },
  { en: "Construction school is hard work.", pl: "Budowlanka to ciężka praca.", icon: "Hammer" },
  { en: "I need to fix the wall in my room.", pl: "Muszę naprawić ścianę w moim pokoju.", icon: "Hammer" },
  { en: "My phone battery is always dead.", pl: "Bateria w moim telefonie jest zawsze rozładowana.", icon: "Zap" },
  { en: "I want to be rich and famous.", pl: "Chcę być bogaty i sławny.", icon: "Star" }
];

const getChallengeCategory = (index: number) => {
  if (index < 10) return { label: 'Hania & Miłość', color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' };
  if (index < 18) return { label: 'Mustang Wujka', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
  if (index < 27) return { label: 'Siłownia & Krystian', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
  if (index < 34) return { label: 'Byli & Drama', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' };
  if (index < 40) return { label: 'Rurki & Moda', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
  return { label: 'Szkoła & Życie', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' };
};

const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
  const navigate = useNavigate();
  // --- DAILY PLANNER STATE ---
  const [planCompleted, setPlanCompleted] = useState<boolean[]>([false, false]);

  // --- CHALLENGE STATE ---
  const [isFlipped, setIsFlipped] = useState(false);
  const [challengeSolved, setChallengeSolved] = useState(false);
  const [challengeIndex, setChallengeIndex] = useState(() => {
    const daysSinceEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    return daysSinceEpoch % MATEUSZ_CHALLENGES.length;
  });
  const [userAttempt, setUserAttempt] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [challengeNotice, setChallengeNotice] = useState<string | null>(null);

  // Deterministic daily challenge
  const currentChallenge = useMemo(() => {
    return MATEUSZ_CHALLENGES[challengeIndex % MATEUSZ_CHALLENGES.length];
  }, [challengeIndex]);

  const currentCategory = useMemo(() => {
    return getChallengeCategory(challengeIndex % MATEUSZ_CHALLENGES.length);
  }, [challengeIndex]);

  useEffect(() => {
    setPlanCompleted(getDailyPlanStatus());
    const status = getDailyChallengeStatus();
    setChallengeSolved(status.solved);
  }, []);

  const handlePlanToggle = (index: number) => {
    const newStatus = toggleDailyPlanTask(index);
    setPlanCompleted(newStatus);
  };

  const handleSolveChallenge = () => {
    const res = completeDailyChallenge(25);
    setChallengeSolved(true);
    setPlanCompleted(getDailyPlanStatus());
    setChallengeNotice(res.xpAwarded > 0 ? 'Gratulacje! +25 XP dodane do Twojego konta! 🏆' : 'Wyzwanie zaliczone na dziś!');
    setTimeout(() => setChallengeNotice(null), 4000);
  };

  const handleNextChallenge = () => {
    setIsFlipped(false);
    setUserAttempt('');
    setChallengeIndex((prev) => (prev + 1) % MATEUSZ_CHALLENGES.length);
  };

  const speakSentence = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-GB';
      u.rate = 0.88;
      setIsPlayingAudio(true);
      u.onend = () => setIsPlayingAudio(false);
      u.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(u);
    } catch {
      setIsPlayingAudio(false);
    }
  };

  const tips = [
    // ... (Keep existing tips)
    "Na maturze zawsze sprawdź limit słów! Minimum 80 słów.",
    "W zadaniach na słuchanie, przeczytaj pytania ZANIM nagranie się zacznie.",
    "Jeśli nie wiesz, strzelaj. Nie ma punktów ujemnych za błędne odpowiedzi.",
    "W czytaniu szukaj synonimów, a nie tych samych słów co w tekście.",
    "Na początku egzaminu sprawdź, czy arkusz jest kompletny.",
    "Zostaw sobie 10 minut na koniec na sprawdzenie karty odpowiedzi.",
    "W zadaniach otwartych pisz czytelnie. Egzaminator nie będzie zgadywał.",
    "Jeśli utkniesz na zadaniu, idź dalej. Wrócisz do niego później.",
    "W e-mailu pamiętaj o akapitach. To punkty za spójność.",
    "Nie zostawiaj pustych luk. Spróbuj zgadnąć z kontekstu.",
    "Present Perfect używamy, gdy skutek widzimy 'teraz'.",
    "Po 'look forward to' czasownik ma końcówkę -ing (to seeing you).",
    "Unless znaczy to samo co 'if not' (Jeśli nie).",
    "Przymiotniki zakończone na -ed opisują uczucia (bored), a na -ing cechy (boring).",
    "Po czasownikach modalnych (can, should, must) czasownik jest w formie podstawowej.",
    "W zdaniach warunkowych (1. tryb): If + Present Simple, ... will + bezokolicznik.",
    "Pamiętaj: I agree (nie: I am agree).",
    "Used to używamy do nawyków z przeszłości, których już nie mamy.",
    "Who - do ludzi, Which - do rzeczy, Where - do miejsc.",
    "Liczbę mnogą od 'person' tworzymy nieregularnie: 'people'.",
  ];

  const randomTip = useMemo(() => tips[Math.floor(Math.random() * tips.length)], []);
  const daysToExam = getDaysToMatura();
  const maturaYear = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const thisYearsExam = new Date(`${year}-05-06T09:00:00`);
    return now.getTime() > thisYearsExam.getTime() ? year + 1 : year;
  }, []);

  // Calculate daily plan
  const dailyPlan = useMemo(() => {
    const day = new Date().getDay();
    const hasManyMistakes = stats.mistakes.length > 5;

    // 0 = Sunday, 1 = Monday, etc.
    const basePlans = [
      [{ text: 'Powtórka 20 fiszek', view: 'vocabulary' }, { text: '1 arkusz próbny (Relaks)', view: 'exam' }], // Sun
      [{ text: '5 zadań z gramatyki', view: 'grammar' }, { text: 'Czytanie: Dobieranie', view: 'reading' }], // Mon
      [{ text: 'Słuchanie: Prawda/Fałsz', view: 'listening' }, { text: 'Nauka 10 nowych słów', view: 'vocabulary' }], // Tue
      [{ text: 'Pisanie: E-mail formalny', view: 'writing' }, { text: 'Gramatyka: Tłumaczenia', view: 'grammar' }], // Wed
      [{ text: 'Czytanie: Tekst z lukami', view: 'reading' }, { text: 'Słuchanie: Wybór', view: 'listening' }], // Thu
      [{ text: 'Słownictwo (Quiz)', view: 'vocabulary' }, { text: 'Pisanie: Blog', view: 'writing' }], // Fri
      [{ text: 'Pełny arkusz maturalny', view: 'exam' }, { text: 'Matura Ustna (Symulacja)', view: 'speaking' }], // Sat
    ];

    let todaysPlan = [...basePlans[day]];

    if (hasManyMistakes) {
      todaysPlan[0] = { text: `Powtórka z Banku Błędów (${stats.mistakes.length})`, view: 'mistakes' };
    }

    return todaysPlan;
  }, [stats.mistakes.length]);

  const chartData = [
    { name: 'Słownictwo', progress: stats.moduleProgress.vocabulary, color: '#F5C518' },
    { name: 'Gramatyka', progress: stats.moduleProgress.grammar, color: '#3B82F6' },
    { name: 'Słuchanie', progress: stats.moduleProgress.listening, color: '#10B981' },
    { name: 'Czytanie', progress: stats.moduleProgress.reading, color: '#8B5CF6' },
    { name: 'Pisanie', progress: stats.moduleProgress.writing, color: '#EC4899' },
    { name: 'Arkusze', progress: stats.moduleProgress.exam, color: '#F97316' },
    { name: 'Ustna', progress: stats.moduleProgress.speaking, color: '#14B8A6' },
  ];

  const getHeatmapColor = (count: number) => {
    if (count === 0) return 'bg-white/5';
    if (count === 1) return 'bg-green-500/30 shadow-[0_0_8px_rgba(34,197,94,0.3)]';
    if (count === 2) return 'bg-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.5)]';
    if (count >= 3) return 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.8)] scale-110';
    return 'bg-green-500';
  };

  const heatmapDays = useMemo(() => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = getLocalDateKey(d);
      const activity = stats.activity.find(a => a.date === dateStr);
      days.push({
        date: dateStr,
        level: activity ? activity.count : 0
      });
    }
    return days;
  }, [stats.activity]);

  const ChallengeIcon = ICON_MAP[currentChallenge.icon] || Zap;

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto pb-12">

      {/* 1. Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Welcome Card */}
        <Card className="lg:col-span-2 bg-gradient-to-br from-[#112240] to-[#0A1628] relative overflow-hidden shadow-2xl group hover:shadow-matura-accent/5 transition-all duration-500" noPadding>
          <div className="p-8 relative z-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-matura-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-matura-accent/10 transition-all duration-700 pointer-events-none"></div>

            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%] animate-shimmer text-[10px] font-bold uppercase tracking-widest text-matura-accent border border-white/10 backdrop-blur-md">Matura {maturaYear}</span>
              <span className="text-gray-400 text-xs flex items-center gap-1"><Clock size={12} /> {new Date().toLocaleDateString('pl-PL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4 tracking-tight">
              Cześć, {stats.name.split(' ')[0]}! 👋
            </h1>
            <p className="text-gray-400 text-lg max-w-md leading-relaxed">
              Twój obecny poziom to <strong className="text-white">{stats.level}</strong>.
              Do egzaminu (6 maja) zostało:
            </p>
            <div className="text-matura-accent font-bold text-4xl my-2 flex items-baseline gap-2">
              {daysToExam} <span className="text-lg text-gray-400 font-normal">dni</span>
            </div>

            <div className="mt-8 flex gap-3 flex-wrap">
              <Button onClick={() => navigate('/exam')} variant="primary" className="flex items-center gap-2 shadow-[0_0_20px_rgba(245,197,24,0.3)]">
                <Target size={18} /> Rozwiąż arkusz
              </Button>
              <Button onClick={() => navigate('/speaking')} variant="secondary" className="flex items-center gap-2 group/btn border border-white/10">
                <BrainCircuit size={18} className="text-purple-400 group-hover/btn:text-purple-300" /> Matura Ustna
              </Button>
            </div>
          </div>
        </Card>

        {/* Right Column: Interactive Daily Challenge & Tip */}
        <div className="flex flex-col gap-6 h-full min-h-[400px]">

          {/* INTERACTIVE DAILY CHALLENGE */}
          <div
            className={`flex-1 rounded-3xl p-6 transition-all duration-300 border relative flex flex-col justify-between min-h-[310px] shadow-2xl overflow-hidden ${
              isFlipped
                ? 'bg-gradient-to-br from-[#1c2847] via-[#0f1b33] to-[#0a1224] border-matura-accent/35 shadow-[0_0_35px_rgba(245,197,24,0.12)]'
                : 'bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-white/10 hover:border-white/20'
            }`}
          >
            {/* Background decoration watermark */}
            <div className="absolute -bottom-5 -right-5 text-white/5 rotate-12 transform scale-150 pointer-events-none transition-transform duration-500">
              <ChallengeIcon size={130} />
            </div>

            {/* Top Toolbar */}
            <div className="relative z-10 flex items-center justify-between gap-2 flex-wrap mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1.5 text-matura-accent text-xs font-bold uppercase tracking-wider bg-matura-accent/10 px-2.5 py-1 rounded-lg border border-matura-accent/20">
                  <Zap size={13} className="fill-current" /> Wyzwanie Dnia
                </span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${currentCategory.color}`}>
                  {currentCategory.label}
                </span>
              </div>

              {challengeSolved ? (
                <span className="text-green-400 text-xs font-bold flex items-center gap-1 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full animate-fade-in">
                  <CheckCircle2 size={13} /> Zaliczone (+25 XP)
                </span>
              ) : (
                <span className="text-amber-300 text-[11px] font-bold flex items-center gap-1 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-full">
                  <Sparkles size={12} /> +25 XP za rozwiązanie
                </span>
              )}
            </div>

            {/* Challenge Notice / Toast */}
            {challengeNotice && (
              <div className="relative z-10 mb-3 p-2.5 rounded-xl bg-matura-accent/15 border border-matura-accent/30 text-matura-accent text-xs font-bold flex items-center gap-2 animate-fade-in shadow-lg">
                <Sparkles size={14} className="animate-spin" /> {challengeNotice}
              </div>
            )}

            {/* Body: Front or Flipped View */}
            {!isFlipped ? (
              /* --- FRONT VIEW: English Sentence --- */
              <div className="relative z-10 flex-1 flex flex-col justify-between gap-3 my-1">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest">
                      Przetłumacz na język polski:
                    </p>
                    <button
                      type="button"
                      onClick={() => speakSentence(currentChallenge.en)}
                      className="text-xs text-cyan-300 hover:text-cyan-200 flex items-center gap-1 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 px-2 py-1 rounded-lg transition-colors"
                      title="Posłuchaj wymowy"
                    >
                      <Volume2 size={13} className={isPlayingAudio ? 'animate-pulse text-matura-accent' : ''} />
                      <span className="text-[11px] font-medium">{isPlayingAudio ? 'Mówię...' : 'Wymowa'}</span>
                    </button>
                  </div>

                  <p className="text-xl sm:text-2xl font-bold text-white leading-snug font-display drop-shadow-md">
                    "{currentChallenge.en}"
                  </p>
                </div>

                {/* Optional Quick Test Input */}
                <div className="mt-1">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={userAttempt}
                      onChange={(e) => setUserAttempt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setIsFlipped(true);
                      }}
                      placeholder="Wpisz tłumaczenie (opcjonalnie)..."
                      className="w-full text-xs bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-gray-500 focus:outline-none focus:border-matura-accent/50 pr-8"
                    />
                    <button
                      type="button"
                      onClick={() => setIsFlipped(true)}
                      title="Sprawdź tłumaczenie"
                      className="absolute right-2 text-gray-400 hover:text-matura-accent transition-colors"
                    >
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>

                {/* Bottom Bar */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsFlipped(true)}
                    className="text-xs text-gray-200 hover:text-white flex items-center gap-1.5 bg-white/10 hover:bg-white/15 border border-white/15 px-3 py-2 rounded-xl font-medium transition-colors shadow-sm"
                  >
                    <RotateCw size={13} /> Pokaż odpowiedź
                  </button>

                  <div className="flex items-center gap-2">
                    {!challengeSolved && (
                      <button
                        type="button"
                        onClick={handleSolveChallenge}
                        className="bg-matura-accent text-matura-bg px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-yellow-400 transition-colors shadow-lg active:scale-95"
                      >
                        <Check size={14} /> Umiem to! (+25 XP)
                      </button>
                    )}
                    {challengeSolved && (
                      <button
                        type="button"
                        onClick={handleNextChallenge}
                        className="text-xs text-gray-300 hover:text-white flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 rounded-xl transition-colors"
                        title="Wylosuj inne zdanie"
                      >
                        <Shuffle size={13} /> Kolejne zdanie
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* --- BACK VIEW: Polish Translation & Verification --- */
              <div className="relative z-10 flex-1 flex flex-col justify-between gap-3 my-1 animate-fade-in">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-matura-accent/80 text-[11px] font-bold uppercase tracking-widest flex items-center gap-1">
                      <Languages size={13} /> Prawidłowe tłumaczenie:
                    </p>
                    <button
                      type="button"
                      onClick={() => speakSentence(currentChallenge.en)}
                      className="text-xs text-gray-300 hover:text-white flex items-center gap-1 bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-1 rounded-lg transition-colors"
                      title="Posłuchaj ponownie"
                    >
                      <Volume2 size={13} className={isPlayingAudio ? 'animate-pulse text-matura-accent' : ''} />
                      <span className="text-[11px]">Posłuchaj EN</span>
                    </button>
                  </div>

                  <p className="text-lg sm:text-xl font-bold text-matura-accent leading-snug drop-shadow-sm">
                    "{currentChallenge.pl}"
                  </p>

                  <p className="text-xs text-gray-400 mt-2 italic">
                    Oryginał: <span className="text-gray-300">"{currentChallenge.en}"</span>
                  </p>

                  {userAttempt.trim() && (
                    <div className="mt-2.5 p-2 rounded-xl bg-white/5 border border-white/10 text-xs">
                      <span className="text-gray-400">Twoja próba:</span>{' '}
                      <span className="text-white font-medium">"{userAttempt}"</span>
                    </div>
                  )}
                </div>

                {/* Bottom Bar */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsFlipped(false)}
                    className="text-xs text-gray-400 hover:text-white underline decoration-white/20 hover:decoration-white transition-all"
                  >
                    ← Wróć do pytania
                  </button>

                  <div className="flex items-center gap-2">
                    {!challengeSolved ? (
                      <button
                        type="button"
                        onClick={handleSolveChallenge}
                        className="bg-matura-accent text-matura-bg px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-yellow-400 transition-colors shadow-lg active:scale-95"
                      >
                        <Check size={14} /> Znam to! (+25 XP)
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleNextChallenge}
                        className="bg-white/10 hover:bg-white/15 text-white border border-white/15 px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <Shuffle size={13} /> Następne zdanie
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tip of the Day - VISIBILITY IMPROVED */}
          <div className="bg-gradient-to-br from-yellow-500/5 to-orange-600/5 rounded-3xl p-6 border border-yellow-500/10 relative overflow-hidden flex flex-col justify-center shadow-lg h-auto min-h-[140px] group hover:border-yellow-500/30 transition-all duration-300">
            <div className="absolute -right-4 -bottom-4 text-yellow-500/5 rotate-12 transform scale-150 pointer-events-none group-hover:text-yellow-500/10 transition-colors">
              <Lightbulb size={100} />
            </div>

            <div className="flex items-center gap-2 text-yellow-400 text-xs font-bold uppercase tracking-widest mb-3">
              <div className="bg-yellow-500/10 p-1.5 rounded-lg border border-yellow-500/20 animate-pulse"><Lightbulb size={14} /></div>
              Pro Tip Egzaminatora
            </div>

            <p className="text-gray-200 text-sm md:text-base font-medium leading-relaxed italic relative z-10 drop-shadow-sm group-hover:text-white transition-colors">
              "{randomTip}"
            </p>
          </div>

        </div>
      </div>

      {/* 2. Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Dni z rzędu', value: stats.streak, icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
          { label: 'Punkty XP', value: stats.xp, icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' },
          { label: 'Ukończone Zadania', value: stats.completedTasks, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20' },
          { label: 'Błędy do poprawy', value: stats.mistakes.length, icon: AlertOctagon, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
        ].map((stat, i) => (
          <Card key={i} className={`flex items-center gap-4 hover:bg-[#162a4d] transition-all hover:-translate-y-1 shadow-lg ${stat.border || 'border-white/5'}`} variant="glass" noPadding>
            <div className="p-4 flex items-center gap-4 w-full">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color} shadow-inner`}>
                <stat.icon size={24} />
              </div>
              <div>
                <div className="text-2xl font-bold text-white font-display">{stat.value}</div>
                <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{stat.label}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 3. Main Split: Progress & Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left: Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Module Progress */}
          <Card className="p-6 md:p-8 shadow-xl" variant="glass" noPadding>
            <div className="p-6 md:p-8">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Target size={20} className="text-matura-accent" /> Postęp w modułach
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }} />
                    <Tooltip
                      cursor={{ fill: '#ffffff05' }}
                      contentStyle={{ backgroundColor: '#0A1628', borderColor: '#ffffff10', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="progress" radius={[0, 6, 6, 0]} barSize={24} animationDuration={1500}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} className="opacity-80 hover:opacity-100 transition-opacity cursor-pointer" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>

          {/* Activity Heatmap */}
          <Card className="shadow-lg" variant="default">
            <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-widest flex items-center gap-2">
              <Clock size={16} /> Ostatnie 30 dni aktywności
            </h3>
            <div className="flex flex-wrap gap-2">
              {heatmapDays.map((day, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 md:w-4 md:h-4 rounded-md ${getHeatmapColor(day.level)} transition-all duration-500`}
                  title={`${day.date}: ${day.level > 0 ? 'Aktywny' : 'Brak'}`}
                ></div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right: Daily Plan */}
        <Card className="flex flex-col h-full shadow-xl relative overflow-hidden" variant="glass" noPadding>
          <div className="p-6 md:p-8 flex flex-col h-full">
            {/* Decor */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl"></div>

            <div className="mb-6 relative z-10">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <BookOpen size={20} className="text-green-400" /> Twój Plan na Dziś
              </h3>
              <p className="text-sm text-gray-400 mt-1">Zalecane zadania, aby zdać maturę.</p>
            </div>

            <div className="flex-1 space-y-4 relative z-10">
              {dailyPlan.map((task, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer group ${planCompleted[idx]
                    ? 'bg-green-500/10 border-green-500/20'
                    : 'bg-[#0A1628] border-white/5 hover:border-matura-accent/30 hover:bg-[#0E1A2E]'
                    }`}
                  onClick={() => handlePlanToggle(idx)}
                >
                  <div className="flex items-center gap-4">
                    <button className={`flex-shrink-0 transition-colors transform group-hover:scale-110 ${planCompleted[idx] ? 'text-green-500' : 'text-gray-600 group-hover:text-matura-accent'}`}>
                      {planCompleted[idx] ? <CheckSquare size={24} /> : <Square size={24} />}
                    </button>
                    <div className="flex-1">
                      <p className={`font-bold text-sm ${planCompleted[idx] ? 'text-gray-400 line-through' : 'text-white'}`}>
                        {task.text}
                      </p>
                      {!planCompleted[idx] && (
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate('/' + task.view); }}
                          className="text-[10px] text-matura-accent font-bold uppercase tracking-wider mt-1 hover:underline flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Rozpocznij <Target size={10} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Extra motivator */}
              {planCompleted.every(Boolean) && (
                <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 p-4 rounded-2xl border border-green-500/30 text-center animate-slide-up shadow-lg">
                  <Trophy size={24} className="text-green-400 mx-auto mb-2 animate-bounce" />
                  <p className="text-green-200 font-bold text-sm">Plan wykonany! Odpocznij.</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* 4. Achievements List */}
      <div className="mt-8">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 px-2">
          <Trophy size={20} className="text-yellow-500" /> Osiągnięcia
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {ACHIEVEMENTS_LIST.map(ach => {
            const isUnlocked = stats.unlockedAchievements.includes(ach.id);

            // Dynamic Icon Mapping
            let Icon = Star;
            if (ach.icon === 'Flame') Icon = Flame;
            if (ach.icon === 'Zap') Icon = Zap;
            if (ach.icon === 'BookA') Icon = BookA;
            if (ach.icon === 'BookOpen') Icon = BookOpen;
            if (ach.icon === 'Library') Icon = Library;
            if (ach.icon === 'CheckCircle') Icon = CheckCircle;
            if (ach.icon === 'Headphones') Icon = Headphones;
            if (ach.icon === 'FileText') Icon = FileText;
            if (ach.icon === 'PenTool') Icon = Trophy;
            if (ach.icon === 'GraduationCap') Icon = Trophy;
            if (ach.icon === 'Award') Icon = Award;
            if (ach.icon === 'Crown') Icon = Crown;
            if (ach.icon === 'Moon') Icon = Moon;
            if (ach.icon === 'Sun') Icon = Sun;
            if (ach.icon === 'AlertOctagon') Icon = AlertOctagon;
            if (ach.icon === 'Trash2') Icon = Trash2;

            return (
              <Card key={ach.id} className={`flex items-center gap-4 transition-all ${isUnlocked
                ? 'bg-[#112240] border-matura-accent/30 opacity-100 shadow-[0_0_15px_rgba(245,197,24,0.05)]'
                : 'bg-[#0A1628] border-white/5 opacity-50 grayscale hover:grayscale-0 hover:opacity-80'
                }`} variant="glass" noPadding>
                <div className="p-4 flex items-center gap-4 w-full">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isUnlocked ? 'bg-matura-accent text-matura-bg shadow-lg shadow-yellow-500/20' : 'bg-white/5 text-gray-500'
                    }`}>
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <h4 className={`text-sm font-bold truncate ${isUnlocked ? 'text-white' : 'text-gray-500'}`}>{ach.title}</h4>
                    <p className="text-[10px] text-gray-500 truncate">{ach.description}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
