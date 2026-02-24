
import * as React from 'react';
import { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import { UserStats } from './types';
import { getStats, shouldShowStudyReminder, STATS_UPDATED_EVENT } from './services/storageService';
import { ChatProvider } from './contexts/ChatContext';
import { AuthProvider } from './contexts/AuthContext';

const Dashboard = lazy(() => import('./components/Dashboard'));
const Vocabulary = lazy(() => import('./components/Vocabulary'));
const Writing = lazy(() => import('./components/Writing'));
const Listening = lazy(() => import('./components/Listening'));
const Grammar = lazy(() => import('./components/Grammar'));
const Reading = lazy(() => import('./components/Reading'));
const Exam = lazy(() => import('./components/Exam'));
const Speaking = lazy(() => import('./components/Speaking'));
const Mistakes = lazy(() => import('./components/Mistakes'));
const Settings = lazy(() => import('./components/Settings'));

const AppContent: React.FC = () => {
  const [stats, setStats] = useState<UserStats>(getStats());
  const location = useLocation();

  const refreshStats = React.useCallback(() => {
    setStats(getStats());
  }, []);

  useEffect(() => {
    refreshStats();
  }, [location.pathname, refreshStats]);

  useEffect(() => {
    const handleStatsUpdate = () => refreshStats();
    const handleStorageUpdate = (event: StorageEvent) => {
      if (event.key === 'matura_master_stats' || event.key === null) {
        refreshStats();
      }
    };

    window.addEventListener(STATS_UPDATED_EVENT, handleStatsUpdate);
    window.addEventListener('storage', handleStorageUpdate);

    return () => {
      window.removeEventListener(STATS_UPDATED_EVENT, handleStatsUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, [refreshStats]);

  useEffect(() => {
    if (shouldShowStudyReminder()) {
      window.dispatchEvent(new CustomEvent('study-reminder'));
    }
  }, []);

  const handleTaskComplete = () => {
    refreshStats();
  };

  return (
    <Layout>
      <Suspense
        fallback={
          <div className="h-full min-h-[40vh] flex items-center justify-center text-gray-400">
            Ładowanie modułu...
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Dashboard stats={stats} />} />
          <Route path="/vocabulary" element={<Vocabulary />} />
          <Route path="/grammar" element={<Grammar />} />
          <Route path="/listening" element={<Listening />} />
          <Route path="/reading" element={<Reading />} />
          <Route path="/writing" element={<Writing onComplete={handleTaskComplete} />} />
          <Route path="/speaking" element={<Speaking />} />
          <Route path="/mistakes" element={<Mistakes />} />
          <Route path="/exam" element={<Exam />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Dashboard stats={stats} />} />
        </Routes>
      </Suspense>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <ChatProvider>
          <AppContent />
        </ChatProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
