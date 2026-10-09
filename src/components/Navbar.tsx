import React, { useState } from 'react';
import {
  Sparkles,
  Volume2,
  VolumeX,
  LogOut,
  User,
  Database,
  History,
  Settings,
  PlusCircle,
  Smartphone,
  Play,
  Download,
} from 'lucide-react';
import { AuthUser } from '../services/api';
import { sound } from '../utils/sound';

interface NavbarProps {
  user: AuthUser | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  hasActiveGame: boolean;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  onOpenSupabaseSQL: () => void;
  onOpenAIGenerator: () => void;
  onNewQuiz: () => void;
  onSwitchToPlayer: () => void;
  currentView: string;
  onNavigate: (view: 'dashboard' | 'editor' | 'player') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onOpenAuth,
  onLogout,
  hasActiveGame,
  onOpenSettings,
  onOpenHistory,
  onOpenSupabaseSQL,
  onOpenAIGenerator,
  onNewQuiz,
  onSwitchToPlayer,
  currentView,
  onNavigate,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(sound.enabled);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const toggleSound = () => {
    const enabled = sound.toggleMute();
    setSoundEnabled(enabled);
  };

  const handleLogoutClick = () => {
    if (hasActiveGame) {
      setShowLogoutConfirm(true);
    } else {
      onLogout();
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-400 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <span className="text-white font-fun text-2xl font-bold">⚡</span>
            </div>
            <div>
              <span className="text-2xl font-black font-fun tracking-tight bg-gradient-to-r from-white via-pink-200 to-purple-400 bg-clip-text text-transparent">
                QuizBlast
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                LIVE
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {user ? (
              <>
                <button
                  onClick={() => onNavigate('dashboard')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    currentView === 'dashboard'
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  My Quizzes
                </button>

                <button
                  onClick={onOpenAIGenerator}
                  className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-purple-300 bg-purple-900/40 hover:bg-purple-900/60 border border-purple-700/50 transition-all hover:scale-105"
                >
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>AI Generator</span>
                </button>

                <button
                  onClick={onNewQuiz}
                  className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-pink-600 hover:bg-pink-500 text-white shadow-md shadow-pink-600/30 transition-all hover:scale-105"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create Quiz</span>
                </button>

                <button
                  onClick={onOpenHistory}
                  title="Past Live Game Results"
                  className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <History className="w-5 h-5" />
                </button>

                <button
                  onClick={onOpenSupabaseSQL}
                  title="Supabase Schema & Security Rules (RLS)"
                  className="p-2 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 transition-colors border border-emerald-500/30 rounded-lg bg-emerald-950/30"
                >
                  <Database className="w-5 h-5" />
                </button>

                <button
                  onClick={onOpenSettings}
                  title="Account Settings"
                  className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <Settings className="w-5 h-5" />
                </button>

                <a
                  href="/api/download-zip"
                  download="quizblast-project.zip"
                  title="Download Complete Project Code (ZIP)"
                  className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-sky-300 bg-sky-950/50 hover:bg-sky-900/60 border border-sky-500/30 transition-all hover:scale-105"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Code</span>
                </a>
              </>
            ) : null}

            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              title={soundEnabled ? 'Mute Audio FX' : 'Enable Audio FX'}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              {soundEnabled ? <Volume2 className="w-5 h-5 text-amber-400" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
            </button>

            {/* Quick Player Buzzer button */}
            <button
              onClick={onSwitchToPlayer}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-colors"
            >
              <Smartphone className="w-4 h-4" />
              <span>Join PIN</span>
            </button>

            {/* User Profile or Login */}
            {user ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
                <span className="hidden lg:inline text-xs font-medium text-slate-300 max-w-[120px] truncate">
                  {user.display_name}
                </span>
                <button
                  onClick={handleLogoutClick}
                  title="Log out"
                  className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30 transition-all hover:scale-105"
              >
                <User className="w-4 h-4" />
                <span>Host Login</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Logout Warning Dialog if live game running */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center mb-4">
              <LogOut className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Active Game Running!</h3>
            <p className="text-slate-300 text-sm mb-6">
              You have a live game currently in progress. Logging out will disconnect the session for joined players. Log out anyway?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  onLogout();
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm shadow-lg shadow-rose-600/30 transition-colors"
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
