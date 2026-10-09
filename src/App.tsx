import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { QuizEditor } from './components/QuizEditor';
import { HostScreen } from './components/HostScreen';
import { PlayerScreen } from './components/PlayerScreen';
import { AuthModal } from './components/AuthModal';
import { AIGeneratorModal } from './components/AIGeneratorModal';
import { SupabaseModal } from './components/SupabaseModal';
import { SettingsModal } from './components/SettingsModal';
import { HistoryModal } from './components/HistoryModal';
import { api, AuthUser } from './services/api';
import { getSocket } from './services/socket';
import { Quiz, Question, LiveGameState } from './types/quiz';

export default function App() {
  const socket = getSocket();

  // Authentication state
  const [user, setUser] = useState<AuthUser | null>(api.getUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // App Views: 'dashboard' | 'editor' | 'host_live' | 'player'
  const [currentView, setCurrentView] = useState<'dashboard' | 'editor' | 'host_live' | 'player'>('dashboard');

  // Modals state
  const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Quizzes state
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [generatedAIQuestions, setGeneratedAIQuestions] = useState<{ questions: Question[]; topic: string } | null>(null);

  // Active Host Game State
  const [activePin, setActivePin] = useState<string>('');
  const [liveGameState, setLiveGameState] = useState<LiveGameState | null>(null);

  // Initial Player PIN from query params
  const [initialPlayerPin, setInitialPlayerPin] = useState<string>('');

  // Initial load
  useEffect(() => {
    // Check url search params for ?pin=XXXXXX
    const urlParams = new URLSearchParams(window.location.search);
    const pinParam = urlParams.get('pin');
    if (pinParam) {
      setInitialPlayerPin(pinParam);
      setCurrentView('player');
    }

    // Check user profile
    checkAuthAndLoadQuizzes();

    // Socket game events for host
    const handleGameCreated = ({ pin, state }: { pin: string; state: LiveGameState }) => {
      setActivePin(pin);
      setLiveGameState(state);
      setCurrentView('host_live');
    };

    const handleGameStateChanged = (state: LiveGameState) => {
      setLiveGameState(state);
    };

    const handlePlayerListUpdated = ({ playersCount, players }: { playersCount: number; players: unknown[] }) => {
      setLiveGameState((prev) => (prev ? { ...prev, playersCount } : null));
    };

    socket.on('host:game_created', handleGameCreated);
    socket.on('game:state_changed', handleGameStateChanged);
    socket.on('game:player_list_updated', handlePlayerListUpdated);

    return () => {
      socket.off('host:game_created', handleGameCreated);
      socket.off('game:state_changed', handleGameStateChanged);
      socket.off('game:player_list_updated', handlePlayerListUpdated);
    };
  }, [socket]);

  const checkAuthAndLoadQuizzes = async () => {
    try {
      const me = await api.getMe();
      setUser(me);
      if (me) await loadQuizzes();
      else setQuizzes([]);
    } catch (err) {
      console.error('Failed to restore the signed-in session:', err);
      setUser(null);
      setQuizzes([]);
    }
  };

  const loadQuizzes = async () => {
    try {
      const list = await api.getQuizzes();
      setQuizzes(list);
    } catch (err) {
      console.error('Failed to load quizzes:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.error('Failed to revoke the signed-in session:', err);
    }
    setUser(null);
    setQuizzes([]);
    setActivePin('');
    setLiveGameState(null);
    setCurrentView('dashboard');
  };

  const handleHostGame = (quizId: string) => {
    const token = api.getToken();
    if (!user || !token) {
      setIsAuthModalOpen(true);
      return;
    }
    socket.emit('host:create_game', { quizId, token });
  };

  const handleEditQuiz = (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setCurrentView('editor');
  };

  const handleNewQuiz = () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    setEditingQuiz(null);
    setCurrentView('editor');
  };

  const handleDuplicateQuiz = async (quizId: string) => {
    try {
      await api.duplicateQuiz(quizId);
      loadQuizzes();
    } catch (err) {
      console.error('Failed to duplicate quiz:', err);
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    try {
      await api.deleteQuiz(quizId);
      loadQuizzes();
    } catch (err) {
      console.error('Failed to delete quiz:', err);
    }
  };

  const handleSaveQuiz = async (quizData: Partial<Quiz>) => {
    if (editingQuiz) {
      await api.updateQuiz(editingQuiz.id, quizData);
    } else {
      await api.createQuiz(quizData);
    }
    await loadQuizzes();
    setCurrentView('dashboard');
  };

  const handleQuestionsGenerated = (questions: Question[], topic: string) => {
    setGeneratedAIQuestions({ questions, topic });
    setEditingQuiz(null);
    setCurrentView('editor');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Navbar is displayed on standard views */}
      {currentView !== 'host_live' && currentView !== 'player' && (
        <Navbar
          user={user}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onLogout={handleLogout}
          hasActiveGame={Boolean(activePin && liveGameState?.status !== 'podium')}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onOpenHistory={() => setIsHistoryModalOpen(true)}
          onOpenSupabaseSQL={() => setIsSupabaseModalOpen(true)}
          onOpenAIGenerator={() => setIsAIGeneratorOpen(true)}
          onNewQuiz={handleNewQuiz}
          onSwitchToPlayer={() => setCurrentView('player')}
          currentView={currentView}
          onNavigate={(view) => {
            if (view === 'dashboard') {
              setCurrentView('dashboard');
            } else if (view === 'editor') {
              handleNewQuiz();
            } else if (view === 'player') {
              setCurrentView('player');
            }
          }}
        />
      )}

      {/* Main View Router */}
      <main className="flex-1">
        {currentView === 'dashboard' && (
          <Dashboard
            quizzes={quizzes}
            onHostGame={handleHostGame}
            onEditQuiz={handleEditQuiz}
            onDuplicateQuiz={handleDuplicateQuiz}
            onDeleteQuiz={handleDeleteQuiz}
            onCreateNewQuiz={handleNewQuiz}
            onOpenAIGenerator={() => setIsAIGeneratorOpen(true)}
            onOpenPlayerTester={() => setCurrentView('player')}
          />
        )}

        {currentView === 'editor' && (
          <QuizEditor
            initialQuiz={editingQuiz}
            onSave={handleSaveQuiz}
            onCancel={() => setCurrentView('dashboard')}
            onOpenAIGenerator={() => setIsAIGeneratorOpen(true)}
            generatedQuestions={generatedAIQuestions}
            onClearGeneratedQuestions={() => setGeneratedAIQuestions(null)}
          />
        )}

        {currentView === 'host_live' && liveGameState && (
          <HostScreen
            pin={activePin}
            gameState={liveGameState}
            onExitGame={() => {
              setActivePin('');
              setLiveGameState(null);
              setCurrentView('dashboard');
            }}
          />
        )}

        {currentView === 'player' && (
          <PlayerScreen
            initialPin={initialPlayerPin}
            onExit={() => setCurrentView('dashboard')}
          />
        )}
      </main>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(u) => {
          setUser(u);
          loadQuizzes();
        }}
      />

      <AIGeneratorModal
        isOpen={isAIGeneratorOpen}
        onClose={() => setIsAIGeneratorOpen(false)}
        onQuestionsGenerated={handleQuestionsGenerated}
      />

      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />

      {user && (
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          user={user}
          onUserUpdated={(u) => setUser(u)}
          onLogout={handleLogout}
        />
      )}

      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
      />
    </div>
  );
}
