
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Vocabulary from './components/Vocabulary';
import Writing from './components/Writing';
import Listening from './components/Listening';
import Grammar from './components/Grammar';
import Reading from './components/Reading';
import Exam from './components/Exam';
import Speaking from './components/Speaking';
import Mistakes from './components/Mistakes';
import Settings from './components/Settings';
import { ViewState, UserStats } from './types';
import { getStats } from './services/storageService';
import { ChatProvider } from './contexts/ChatContext';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [stats, setStats] = useState<UserStats>(getStats());

  useEffect(() => {
    // Refresh stats when view changes (in case XP was gained)
    setStats(getStats());
  }, [currentView]);

  const handleTaskComplete = () => {
    // Logic to update global stats state locally to reflect immediate changes
    setStats(getStats());
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard stats={stats} onNavigate={setCurrentView} />;
      case 'vocabulary':
        return <Vocabulary />;
      case 'grammar':
        return <Grammar />;
      case 'listening':
        return <Listening />;
      case 'reading':
        return <Reading />;
      case 'writing':
        return <Writing onComplete={handleTaskComplete} />;
      case 'speaking':
        return <Speaking />;
      case 'mistakes':
        return <Mistakes />;
      case 'exam':
        return <Exam />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard stats={stats} onNavigate={setCurrentView} />;
    }
  };

  return (
    <ChatProvider>
      <Layout currentView={currentView} onChangeView={setCurrentView}>
        {renderView()}
      </Layout>
    </ChatProvider>
  );
};

export default App;
