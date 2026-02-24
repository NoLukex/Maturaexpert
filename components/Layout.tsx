import * as React from 'react';
import { useState, useEffect } from 'react';
import { ViewState } from '../types';
import ChatAssistant from './ChatAssistant';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookA,
  PenTool,
  Headphones,
  FileText,
  GraduationCap,
  Menu,
  X,
  Library,
  ArrowLeft,
  ChevronRight,
  BrainCircuit,
  AlertOctagon,
  Award,
  Settings,
  Bell,
  LogIn,
  LogOut,
  Cloud
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notification, setNotification] = useState<{ title: string; icon: string; kind: 'achievement' | 'reminder' } | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, syncing, enabled, login, logout } = useAuth();

  // Map path to ViewState for backward compatibility/styling
  const getCurrentView = (): ViewState => {
    const path = location.pathname.substring(1);
    if (path === '') return 'dashboard';
    return path as ViewState;
  };

  const currentView = getCurrentView();

  // --- NOTIFICATION SYSTEM ---
  useEffect(() => {
    const handleUnlock = (e: Event) => {
      const customEvent = e as CustomEvent<{ title: string; icon: string }>;
      const { title, icon } = customEvent.detail;
      setNotification({ title, icon, kind: 'achievement' });

      // Auto dismiss
      setTimeout(() => setNotification(null), 4000);
    };

    const handleReminder = () => {
      setNotification({
        title: 'Czas na codzienna powtorke',
        icon: 'Bell',
        kind: 'reminder'
      });

      // Auto dismiss
      setTimeout(() => setNotification(null), 4000);
    };

    window.addEventListener('achievement-unlocked', handleUnlock);
    window.addEventListener('study-reminder', handleReminder);

    return () => {
      window.removeEventListener('achievement-unlocked', handleUnlock);
      window.removeEventListener('study-reminder', handleReminder);
    };
  }, []);

  const NavItem = ({ to, icon: Icon, label, viewName }: { to: string; icon: React.ComponentType<{ size?: number; className?: string }>; label: string; viewName: ViewState }) => (
    <Link
      to={to}
      onClick={() => setMobileMenuOpen(false)}
      className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all mb-1.5 group relative overflow-hidden ${currentView === viewName
        ? 'text-matura-bg font-bold shadow-[0_0_20px_rgba(245,197,24,0.3)]'
        : 'text-gray-400 hover:text-white'
        }`}
    >
      {/* Active Background */}
      {currentView === viewName && (
        <div className="absolute inset-0 bg-matura-accent" />
      )}
      {/* Hover Background */}
      {currentView !== viewName && (
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}

      <Icon size={20} className={`relative z-10 transition-transform duration-300 group-hover:scale-110 group-active:scale-95 ${currentView === viewName ? 'text-matura-bg' : 'text-gray-400 group-hover:text-white'}`} />
      <span className="relative z-10 text-sm tracking-wide">{label}</span>
    </Link>
  );

  const isTaskView = currentView !== 'dashboard';

  return (
    <div className="min-h-screen flex flex-col md:flex-row h-screen overflow-hidden selection:bg-matura-accent selection:text-matura-bg text-gray-200 font-sans">

      {/* --- TOAST NOTIFICATION OVERLAY --- */}
      {notification && (
        <div className="fixed top-6 right-6 z-[100] animate-slide-up">
          <div className="bg-[#112240]/90 backdrop-blur-xl border border-matura-accent/50 shadow-[0_0_30px_rgba(245,197,24,0.2)] rounded-2xl p-4 flex items-center gap-4 min-w-[320px] relative overflow-hidden">
            {/* Shine effect */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]"></div>

            <div className="w-12 h-12 rounded-full bg-matura-accent flex items-center justify-center text-matura-bg shadow-lg flex-shrink-0">
              {notification.kind === 'achievement' ? <Award size={24} className="animate-bounce" /> : <Bell size={22} className="animate-bounce" />}
            </div>
            <div>
              <p className="text-matura-accent font-bold text-[10px] uppercase tracking-widest mb-0.5">
                {notification.kind === 'achievement' ? 'Odblokowano Osiagniecie!' : 'Przypomnienie'}
              </p>
              <p className="text-white font-display font-bold text-lg leading-tight">{notification.title}</p>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Desktop - Hide on task views */}
      <aside className={`flex-col w-72 bg-[#0A1628]/80 backdrop-blur-xl border-r border-white/5 h-full hidden ${!isTaskView ? 'md:flex' : ''} shadow-2xl z-20`}>
        <div className="p-8 pb-4">
          {/* NEW BRANDING LOCKUP */}
          <div className="flex items-center gap-4 mb-1">
            <div className="w-12 h-12 bg-gradient-to-br from-matura-accent to-yellow-600 rounded-full flex items-center justify-center text-matura-bg font-black text-3xl shadow-[0_0_20px_rgba(245,197,24,0.2)] border border-white/10 flex-shrink-0">
              K
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-[10px] text-matura-accent font-bold uppercase tracking-[0.3em] leading-none mb-1 opacity-80">BY</span>
              <span className="text-xl font-display font-black text-white tracking-widest leading-none">KRYSTIAN</span>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4 pl-1 opacity-50 border-t border-white/5 pt-3">
            <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse"></div>
            <p className="text-[9px] text-matura-muted uppercase tracking-[0.2em] font-bold">Matura Intelligence System</p>
          </div>
        </div>

        <nav className="flex-1 px-6 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          <NavItem to="/" viewName="dashboard" icon={LayoutDashboard} label="Dashboard" />

          <div className="my-8">
            <p className="px-4 text-[10px] font-bold text-gray-500 uppercase mb-4 tracking-widest flex items-center gap-2">
              <span className="w-8 h-[1px] bg-white/10"></span> Moduły
            </p>
            <div className="space-y-1">
              <NavItem to="/vocabulary" viewName="vocabulary" icon={BookA} label="Słownictwo" />
              <NavItem to="/grammar" viewName="grammar" icon={Library} label="Gramatyka" />
              <NavItem to="/listening" viewName="listening" icon={Headphones} label="Słuchanie" />
              <NavItem to="/reading" viewName="reading" icon={FileText} label="Czytanie" />
              <NavItem to="/writing" viewName="writing" icon={PenTool} label="Pisanie (AI)" />
              <NavItem to="/speaking" viewName="speaking" icon={BrainCircuit} label="Matura Ustna" />
            </div>
          </div>

          <div className="my-8">
            <p className="px-4 text-[10px] font-bold text-gray-500 uppercase mb-4 tracking-widest flex items-center gap-2">
              <span className="w-8 h-[1px] bg-white/10"></span> Egzaminy
            </p>
            <NavItem to="/exam" viewName="exam" icon={GraduationCap} label="Arkusze Maturalne" />
            <NavItem to="/mistakes" viewName="mistakes" icon={AlertOctagon} label="Bank Błędów" />
          </div>
        </nav>

        <div className="p-6 border-t border-white/5 bg-black/10">
          {enabled && (
            <div className="mb-3 p-2 rounded-xl border border-white/10 bg-white/5">
              {user ? (
                <div className="space-y-2">
                  <div className="text-[10px] text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Cloud size={12} className={syncing ? 'animate-pulse text-matura-accent' : 'text-matura-accent'} />
                    {syncing ? 'Synchronizacja...' : 'Sync aktywny'}
                  </div>
                  <div className="text-xs text-white truncate">{user.email}</div>
                  <button
                    onClick={logout}
                    className="w-full text-xs font-bold py-2 rounded-lg bg-red-500/15 border border-red-500/40 text-red-300 hover:bg-red-500/25 flex items-center justify-center gap-2"
                  >
                    <LogOut size={14} /> Wyloguj
                  </button>
                </div>
              ) : (
                <button
                  onClick={login}
                  className="w-full text-xs font-bold py-2 rounded-lg bg-matura-accent/15 border border-matura-accent/40 text-matura-accent hover:bg-matura-accent/25 flex items-center justify-center gap-2"
                >
                  <LogIn size={14} /> Zaloguj i synchronizuj
                </button>
              )}
            </div>
          )}

          <NavItem to="/settings" viewName="settings" icon={Settings} label="Ustawienia" />

          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/5 group cursor-default">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-matura-accent to-yellow-600 flex items-center justify-center text-matura-bg font-bold shadow-md group-hover:scale-105 transition-transform">MW</div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">Mateusz Wiśniewski</p>
              <p className="text-[10px] text-matura-muted truncate flex items-center gap-1">
                <Award size={10} className="text-matura-accent" /> Wersja Premium
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col h-full relative">
        {/* Header - Always visible on mobile, visible on desktop if task view */}
        <div className={`h-16 flex items-center justify-between border-b border-white/5 bg-[#0A1628]/80 backdrop-blur-xl z-50 px-4 md:px-6 transition-all ${!isTaskView ? 'md:hidden' : ''}`}>
          <div className="flex items-center gap-4">
            {isTaskView && (
              <button
                onClick={() => navigate('/')}
                className="group flex items-center gap-3 pr-4 border-r border-white/10 hover:opacity-100 opacity-60 transition-all"
                title="Wróć do menu głównego"
              >
                <div className="p-2 bg-white/5 rounded-xl group-hover:bg-matura-accent group-hover:text-matura-bg transition-colors">
                  <ArrowLeft size={18} />
                </div>
                <span className="hidden sm:block text-sm font-bold tracking-wide group-hover:text-white">Wróć</span>
              </button>
            )}

            <div className="flex items-center gap-2">
              {!isTaskView && (
                <div className="flex items-center gap-3 md:hidden">
                  <div className="w-8 h-8 bg-gradient-to-br from-matura-accent to-yellow-600 rounded-full flex items-center justify-center text-matura-bg font-bold text-lg shadow-sm">K</div>
                  <div className="flex flex-col justify-center">
                    <span className="text-[8px] text-matura-accent font-bold uppercase tracking-[0.2em] leading-none">BY</span>
                    <span className="text-sm font-display font-bold text-white tracking-widest leading-none">KRYSTIAN</span>
                  </div>
                </div>
              )}

              {isTaskView && (
                <div className="flex items-center gap-2 animate-fade-in">
                  <span className="text-matura-accent bg-matura-accent/5 border border-matura-accent/20 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest shadow-[0_0_10px_rgba(245,197,24,0.1)]">
                    {currentView === 'grammar' ? 'Gramatyka' :
                      currentView === 'vocabulary' ? 'Słownictwo' :
                        currentView === 'listening' ? 'Słuchanie' :
                          currentView === 'writing' ? 'Pisanie' :
                            currentView === 'reading' ? 'Czytanie' :
                              currentView === 'speaking' ? 'Mówienie' :
                                currentView === 'mistakes' ? 'Błędy' :
                                  currentView === 'settings' ? 'Ustawienia' :
                                    currentView === 'exam' ? 'Arkusze' : ''}
                  </span>
                </div>
              )}
            </div>
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 hover:bg-white/10 rounded-xl transition-colors">
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {enabled && (
          <div className={`px-4 py-2 border-b border-white/5 bg-[#0A1628]/90 ${!isTaskView ? 'md:hidden' : ''}`}>
            {user ? (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400 truncate">{user.email}</span>
                <button onClick={logout} className="text-red-300 font-bold">Wyloguj</button>
              </div>
            ) : (
              <button onClick={login} className="text-xs text-matura-accent font-bold flex items-center gap-2">
                <LogIn size={14} /> Zaloguj i synchronizuj
              </button>
            )}
          </div>
        )}

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 bg-[#050B14]/95 backdrop-blur-xl pt-24 px-6 animate-fade-in">
            <nav className="space-y-2">
              <NavItem to="/" viewName="dashboard" icon={LayoutDashboard} label="Dashboard" />
              <NavItem to="/vocabulary" viewName="vocabulary" icon={BookA} label="Słownictwo" />
              <NavItem to="/grammar" viewName="grammar" icon={Library} label="Gramatyka" />
              <NavItem to="/listening" viewName="listening" icon={Headphones} label="Słuchanie" />
              <NavItem to="/reading" viewName="reading" icon={FileText} label="Czytanie" />
              <NavItem to="/writing" viewName="writing" icon={PenTool} label="Pisanie (AI)" />
              <NavItem to="/speaking" viewName="speaking" icon={BrainCircuit} label="Matura Ustna" />
              <NavItem to="/mistakes" viewName="mistakes" icon={AlertOctagon} label="Bank Błędów" />
              <NavItem to="/exam" viewName="exam" icon={GraduationCap} label="Arkusze" />
              <NavItem to="/settings" viewName="settings" icon={Settings} label="Ustawienia" />
            </nav>
          </div>
        )}

        {/* Content Area */}
        <div className={`flex-1 w-full mx-auto ${currentView === 'grammar' ? 'h-full overflow-hidden p-0' : 'overflow-y-auto custom-scrollbar p-4 md:p-8 max-w-7xl'}`}>
          {children}
        </div>

        {/* AI Chat Assistant */}
        <ChatAssistant currentView={currentView} />
      </main>
    </div>
  );
};

export default Layout;
