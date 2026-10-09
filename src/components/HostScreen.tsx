import React, { useEffect, useState } from 'react';
import {
  Users,
  Play,
  Lock,
  Unlock,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  UserX,
  Bot,
  ArrowRight,
  Trophy,
  Download,
  Flame,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  QrCode,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { LiveGameState, QUESTION_COLORS } from '../types/quiz';
import { getSocket } from '../services/socket';
import { sound } from '../utils/sound';
import { QRCodeDisplay } from './QRCodeDisplay';
import { HostRecommendations } from './HostRecommendations';
import { PlayerScreen } from './PlayerScreen';

interface HostScreenProps {
  pin: string;
  gameState: LiveGameState;
  onExitGame: () => void;
}

export const HostScreen: React.FC<HostScreenProps> = ({ pin, gameState, onExitGame }) => {
  const socket = getSocket();
  const [copiedLink, setCopiedLink] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(sound.enabled);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [previewSeconds, setPreviewSeconds] = useState(3);
  const [showPhoneSimulator, setShowPhoneSimulator] = useState(false);

  // Sound effects & music control per state
  useEffect(() => {
    if (gameState.status === 'lobby') {
      sound.startLobbyMusic();
    } else {
      sound.stopLobbyMusic();
    }

    if (gameState.status === 'question_active') {
      sound.playClick();
    } else if (gameState.status === 'question_result') {
      sound.playCorrect();
    } else if (gameState.status === 'podium') {
      sound.playFanfare();
      // Launch celebratory confetti bursts
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      setTimeout(() => {
        confetti({ particleCount: 80, angle: 60, spread: 55, origin: { x: 0 } });
        confetti({ particleCount: 80, angle: 120, spread: 55, origin: { x: 1 } });
      }, 400);
    }
  }, [gameState.status]);

  // Preview countdown listener
  useEffect(() => {
    const handlePreviewTick = ({ seconds }: { seconds: number }) => {
      setPreviewSeconds(seconds);
      sound.playTick(true);
    };

    const handleTimerTick = ({ timeRemaining }: { timeRemaining: number }) => {
      if (timeRemaining <= 5 && timeRemaining > 0) {
        sound.playTick(true);
      }
    };

    socket.on('game:preview_tick', handlePreviewTick);
    socket.on('game:timer_tick', handleTimerTick);

    return () => {
      socket.off('game:preview_tick', handlePreviewTick);
      socket.off('game:timer_tick', handleTimerTick);
    };
  }, [socket]);

  const toggleSound = () => {
    const s = sound.toggleMute();
    setSoundEnabled(s);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleCopyLink = () => {
    const playerUrl = `${window.location.origin}?pin=${pin}`;
    navigator.clipboard.writeText(playerUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleStartGame = () => {
    socket.emit('host:start_game', { pin });
  };

  const handleShowLeaderboard = () => {
    socket.emit('host:show_leaderboard', { pin });
  };

  const handleNextQuestion = () => {
    socket.emit('host:next_question', { pin });
  };

  const handleToggleLock = () => {
    socket.emit('host:toggle_lock', { pin });
  };

  const handleKickPlayer = (playerId: string) => {
    socket.emit('host:kick_player', { pin, playerId });
  };

  const handleAddTestBots = () => {
    socket.emit('host:simulate_players', { pin, count: 3 });
  };

  const handleExportPodiumCSV = () => {
    if (!gameState.podium) return;
    let csv = 'Rank,Nickname,Score,CorrectAnswers,TotalQuestions,Date,QuizTitle\n';
    const now = new Date().toISOString();
    gameState.podium.forEach((p) => {
      csv += `"${p.rank}","${p.nickname.replace(/"/g, '""')}","${p.score}","${p.correctCount}","${gameState.totalQuestions}","${now}","${gameState.quizTitle.replace(/"/g, '""')}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `quizblast-results-${pin}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderScreenContent = () => {
    // -----------------------------------------------------------
    // 1. LOBBY VIEW
    // -----------------------------------------------------------
    if (gameState.status === 'lobby') {
      return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-between p-4 sm:p-8 relative overflow-hidden">
        {/* Animated ambient background lights */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top bar controls */}
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center space-x-3">
            <span className="text-xl sm:text-2xl font-black font-fun tracking-tight text-white flex items-center space-x-2">
              <span className="text-purple-400">⚡</span>
              <span>{gameState.quizTitle}</span>
            </span>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={() => setShowPhoneSimulator(!showPhoneSimulator)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                showPhoneSimulator
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-2 ring-amber-400/40'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title="Toggle on-screen mobile phone buzzer simulator"
            >
              <Smartphone className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">{showPhoneSimulator ? 'Hide Test Phone' : 'Simulate Phone'}</span>
            </button>

            <button
              onClick={handleAddTestBots}
              title="Add 3 Bot Players (for instant testing without second phone)"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-purple-900/40 hover:bg-purple-900/70 border border-purple-500/40 text-purple-300 text-xs font-bold transition-all hover:scale-105"
            >
              <Bot className="w-4 h-4 text-purple-400" />
              <span className="hidden sm:inline">Add 3 Test Bots</span>
            </button>

            <button
              onClick={handleToggleLock}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                gameState.locked
                  ? 'bg-rose-950/60 border-rose-500 text-rose-300'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              {gameState.locked ? <Lock className="w-3.5 h-3.5 text-rose-400" /> : <Unlock className="w-3.5 h-3.5 text-slate-400" />}
              <span>{gameState.locked ? 'Locked' : 'Lock'}</span>
            </button>

            <button
              onClick={toggleSound}
              className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onExitGame}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Exit
            </button>
          </div>
        </div>

        {/* Host Recommendations Banner */}
        <div className="z-10 max-w-4xl mx-auto w-full my-3">
          <HostRecommendations
            onAddTestBots={handleAddTestBots}
            onOpenPlayerTester={() => {
              window.open(`${window.location.origin}?pin=${pin}`, '_blank');
            }}
            isLive={true}
          />
        </div>

        {/* Center: BIG GAME PIN DISPLAY + REAL QR CODE */}
        <div className="my-auto text-center z-10 max-w-5xl mx-auto w-full">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs sm:text-sm font-semibold mb-4">
            <span>Join at</span>
            <strong className="text-white underline">{window.location.host}</strong>
            <span className="hidden sm:inline">or point camera at the QR code</span>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-6 max-w-3xl mx-auto mb-6">
            {/* PIN Card */}
            <div className="flex-1 w-full bg-slate-900/90 backdrop-blur-xl border-2 border-purple-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-purple-900/20 text-center relative group">
              <span className="text-xs uppercase font-extrabold tracking-widest text-slate-400 block mb-1">
                Game PIN:
              </span>
              <div className="text-5xl sm:text-6xl font-black font-fun tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-pink-200 to-purple-300 select-all my-2">
                {pin.slice(0, 3)} {pin.slice(3)}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={handleCopyLink}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{copiedLink ? 'Link Copied!' : 'Copy Direct Link'}</span>
                </button>

                <button
                  onClick={() => {
                    window.open(`${window.location.origin}?pin=${pin}`, '_blank');
                  }}
                  title="Open a phone buzzer test tab in your browser"
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-purple-950/70 hover:bg-purple-900/80 border border-purple-500/40 text-xs font-bold text-purple-200 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
                  <span>Open Test Player Tab</span>
                </button>
              </div>
            </div>

            {/* Scannable QR Code */}
            <div className="flex-shrink-0">
              <QRCodeDisplay pin={pin} size={155} />
            </div>
          </div>

          {/* Player Count & Joined Players Grid */}
          <div className="mt-8">
            <div className="flex items-center justify-center space-x-2 text-slate-300 font-bold text-lg mb-4">
              <Users className="w-5 h-5 text-purple-400" />
              <span>{gameState.playersCount} Players Ready</span>
            </div>

            {gameState.playersCount === 0 ? (
              <div className="text-slate-500 text-sm italic animate-pulse">
                Waiting for players to enter PIN on their phones...
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-2.5 max-h-48 overflow-y-auto px-4 py-2">
                {gameState.leaderboard.map((p) => (
                  <div
                    key={p.id}
                    className="group relative flex items-center space-x-2 bg-slate-900 border border-slate-700/80 rounded-2xl px-3.5 py-2 shadow-md hover:border-purple-500 transition-all hover:scale-105"
                  >
                    <span className="text-lg">{p.avatar}</span>
                    <span className="text-sm font-bold text-white max-w-[120px] truncate">{p.nickname}</span>
                    <button
                      onClick={() => handleKickPlayer(p.id)}
                      title="Kick player"
                      className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-300 transition-opacity ml-1"
                    >
                      <UserX className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom bar: Big Start Button */}
        <div className="flex items-center justify-between z-10 pt-4 border-t border-slate-800">
          <div className="text-xs text-slate-400">
            Total questions: <strong className="text-white">{gameState.totalQuestions}</strong>
          </div>

          <button
            onClick={handleStartGame}
            disabled={gameState.playersCount === 0}
            className="flex items-center space-x-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-extrabold text-base shadow-xl shadow-emerald-600/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>START GAME</span>
          </button>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------
  // 2. QUESTION PREVIEW (3 SECONDS)
  // -----------------------------------------------------------
  if (gameState.status === 'question_preview') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="inline-block px-4 py-1.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-sm font-bold mb-6">
          Question {gameState.currentQuestionIndex + 1} of {gameState.totalQuestions}
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-white font-fun max-w-3xl leading-snug mb-8">
          {gameState.question?.text}
        </h2>
        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-purple-500 flex items-center justify-center font-black font-fun text-5xl sm:text-6xl text-white shadow-2xl shadow-purple-500/40 animate-pulse">
          {previewSeconds}
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------
  // 3. QUESTION ACTIVE (PLAYERS ANSWERING)
  // -----------------------------------------------------------
  if (gameState.status === 'question_active') {
    const q = gameState.question;
    const progressPercent = q ? Math.max(0, (gameState.timeRemaining / q.timeLimit) * 100) : 0;

    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-between p-4 sm:p-8">
        {/* Top status bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-950/60 px-3 py-1.5 rounded-xl border border-purple-800">
              Q{gameState.currentQuestionIndex + 1} / {gameState.totalQuestions}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              {q?.points} Points
            </span>
          </div>

          {/* Time Remaining Circle */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-700 px-4 py-1.5 rounded-2xl">
              <span className="text-xs text-slate-400 font-bold uppercase">Answers</span>
              <span className="text-lg font-black text-white font-fun">
                {gameState.answeredCount} / {gameState.playersCount}
              </span>
            </div>

            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black font-fun text-2xl shadow-lg border-2 transition-colors ${
                gameState.timeRemaining <= 5
                  ? 'bg-rose-600/30 border-rose-500 text-rose-300 animate-pulse'
                  : 'bg-purple-600/20 border-purple-500 text-white'
              }`}
            >
              {gameState.timeRemaining}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden mb-6">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${
              gameState.timeRemaining <= 5 ? 'bg-rose-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Question Text & Media */}
        <div className="my-auto text-center max-w-5xl mx-auto w-full px-4">
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white font-fun leading-tight mb-6">
            {q?.text}
          </h1>

          {q?.imageUrl && (
            <div className="max-w-md mx-auto h-48 sm:h-64 rounded-2xl overflow-hidden border-2 border-slate-800 shadow-2xl mb-6">
              <img src={q.imageUrl} alt="Question media" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {/* 4 Answer Choice Blocks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-5xl mx-auto w-full mt-6">
          {q?.choices.map((choice, idx) => {
            const color = QUESTION_COLORS[idx % QUESTION_COLORS.length];
            return (
              <div
                key={idx}
                className={`p-4 sm:p-5 rounded-2xl text-white font-bold text-lg sm:text-xl flex items-center space-x-4 shadow-xl border-2 ${color.bg} ${color.border}`}
              >
                <div className="w-10 h-10 rounded-xl bg-black/25 flex items-center justify-center font-black text-xl flex-shrink-0">
                  {color.shapeSymbol}
                </div>
                <span className="flex-1 truncate">{choice}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------
  // 4. QUESTION RESULT / DISTRIBUTION VIEW
  // -----------------------------------------------------------
  if (gameState.status === 'question_result') {
    const q = gameState.question;
    const totalAnswers = gameState.answerDistribution.reduce((a, b) => a + b, 0);

    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-between p-4 sm:p-8">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-800 flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>Question Complete</span>
          </span>

          <button
            onClick={handleShowLeaderboard}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-extrabold text-sm shadow-lg shadow-purple-600/30 transition-all hover:scale-105"
          >
            <span>Next: Leaderboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Question Text */}
        <div className="text-center max-w-4xl mx-auto my-2">
          <h2 className="text-xl sm:text-3xl font-black text-white font-fun">{q?.text}</h2>
          {q?.explanation && (
            <p className="mt-2 text-xs sm:text-sm text-purple-300 font-medium bg-purple-950/40 inline-block px-4 py-1.5 rounded-full border border-purple-800">
              💡 {q.explanation}
            </p>
          )}
        </div>

        {/* Answer Distribution Bars */}
        <div className="max-w-4xl mx-auto w-full my-auto py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 h-64 items-end mb-6">
            {q?.choices.map((choice, idx) => {
              const color = QUESTION_COLORS[idx % QUESTION_COLORS.length];
              const count = gameState.answerDistribution[idx] || 0;
              const isCorrect = q.correctAnswers.includes(idx);
              const heightPercent = totalAnswers > 0 ? Math.max(10, (count / totalAnswers) * 100) : 10;

              return (
                <div key={idx} className="flex flex-col items-center h-full justify-end">
                  {/* Count tag */}
                  <span className="text-xl font-black text-white font-fun mb-2">{count}</span>

                  {/* Bar */}
                  <div
                    className={`w-full rounded-2xl relative transition-all duration-700 flex flex-col justify-between p-3 border-2 ${
                      isCorrect ? `${color.bg} ${color.border} ring-4 ring-emerald-400/50` : 'bg-slate-800/80 border-slate-700 opacity-60'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-black">{color.shapeSymbol}</span>
                      {isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-300 fill-emerald-600" />}
                    </div>
                  </div>

                  {/* Choice text underneath */}
                  <span className={`text-xs font-bold mt-2 text-center truncate max-w-full ${isCorrect ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {choice}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------
  // 5. LEADERBOARD VIEW
  // -----------------------------------------------------------
  if (gameState.status === 'leaderboard') {
    const isLastQuestion = gameState.currentQuestionIndex + 1 >= gameState.totalQuestions;

    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-between p-4 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2 text-amber-400 font-bold font-fun text-xl">
            <Trophy className="w-6 h-6" />
            <span>Leaderboard</span>
          </div>

          <button
            onClick={handleNextQuestion}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-extrabold text-sm shadow-lg shadow-purple-600/30 transition-all hover:scale-105"
          >
            <span>{isLastQuestion ? 'View Final Podium 🏆' : 'Next Question'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Top 5 list */}
        <div className="max-w-2xl mx-auto w-full my-auto space-y-3">
          {gameState.leaderboard.map((player, idx) => (
            <div
              key={player.id}
              className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                idx === 0
                  ? 'bg-amber-500/15 border-amber-400/60 shadow-lg shadow-amber-500/10'
                  : idx === 1
                  ? 'bg-slate-300/10 border-slate-300/40'
                  : idx === 2
                  ? 'bg-amber-700/10 border-amber-600/40'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex items-center space-x-4">
                <span className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center font-black font-fun text-base text-white">
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                </span>
                <span className="text-2xl">{player.avatar}</span>
                <div>
                  <span className="font-extrabold text-lg text-white block">{player.nickname}</span>
                  {player.streak >= 3 && (
                    <span className="inline-flex items-center space-x-1 text-[11px] text-amber-400 font-bold">
                      <Flame className="w-3.5 h-3.5 fill-current" />
                      <span>{player.streak} streak!</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span className="text-2xl font-black font-fun text-purple-300 block">
                  {player.score.toLocaleString()}
                </span>
                {player.lastPoints > 0 && (
                  <span className="text-xs text-emerald-400 font-bold">+{player.lastPoints}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------
  // 6. FINAL PODIUM VIEW (1ST, 2ND, 3RD ANIMATED)
  // -----------------------------------------------------------
  if (gameState.status === 'podium') {
    const podiumPlayers = gameState.podium || [];
    const first = podiumPlayers[0];
    const second = podiumPlayers[1];
    const third = podiumPlayers[2];

    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-between p-4 sm:p-8 text-center relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 z-10">
          <span className="text-xl sm:text-2xl font-black font-fun text-white">
            🎉 Championship Podium!
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportPodiumCSV}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all hover:scale-105"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onExitGame}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
            >
              Finish & Return
            </button>
          </div>
        </div>

        {/* 3 Olympic Columns */}
        <div className="my-auto max-w-4xl mx-auto w-full grid grid-cols-3 gap-3 sm:gap-6 items-end pt-12 pb-6 z-10">
          {/* 2nd place (Silver) */}
          <div className="flex flex-col items-center">
            {second ? (
              <>
                <span className="text-3xl sm:text-4xl mb-1">{second.avatar}</span>
                <span className="text-sm sm:text-lg font-black text-slate-200 truncate max-w-full">
                  {second.nickname}
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-400 mb-2">
                  {second.score.toLocaleString()} pts
                </span>
                <div className="w-full h-44 sm:h-56 rounded-t-3xl bg-gradient-to-t from-slate-700 to-slate-500 flex flex-col items-center justify-center p-4 border-2 border-slate-400 shadow-xl">
                  <span className="text-3xl sm:text-5xl font-black font-fun text-white">2</span>
                  <span className="text-xs uppercase font-extrabold text-slate-200 mt-1">Silver</span>
                </div>
              </>
            ) : (
              <div className="w-full h-32 rounded-t-3xl bg-slate-900 border border-slate-800" />
            )}
          </div>

          {/* 1st place (Gold) */}
          <div className="flex flex-col items-center">
            {first ? (
              <>
                <div className="text-4xl sm:text-5xl mb-1 animate-bounce-gentle">👑 {first.avatar}</div>
                <span className="text-base sm:text-2xl font-black text-amber-300 truncate max-w-full font-fun">
                  {first.nickname}
                </span>
                <span className="text-sm sm:text-base font-extrabold text-amber-200 mb-2">
                  {first.score.toLocaleString()} pts
                </span>
                <div className="w-full h-56 sm:h-72 rounded-t-3xl bg-gradient-to-t from-amber-600 via-amber-500 to-amber-400 flex flex-col items-center justify-center p-4 border-2 border-amber-300 shadow-2xl shadow-amber-500/30">
                  <span className="text-4xl sm:text-6xl font-black font-fun text-white">1</span>
                  <span className="text-xs sm:text-sm uppercase font-extrabold text-amber-950 mt-1 tracking-wider">
                    Champion
                  </span>
                </div>
              </>
            ) : null}
          </div>

          {/* 3rd place (Bronze) */}
          <div className="flex flex-col items-center">
            {third ? (
              <>
                <span className="text-3xl sm:text-4xl mb-1">{third.avatar}</span>
                <span className="text-sm sm:text-lg font-black text-amber-200 truncate max-w-full">
                  {third.nickname}
                </span>
                <span className="text-xs sm:text-sm font-bold text-amber-300/80 mb-2">
                  {third.score.toLocaleString()} pts
                </span>
                <div className="w-full h-36 sm:h-44 rounded-t-3xl bg-gradient-to-t from-amber-900 to-amber-700 flex flex-col items-center justify-center p-4 border-2 border-amber-600 shadow-xl">
                  <span className="text-3xl sm:text-5xl font-black font-fun text-white">3</span>
                  <span className="text-xs uppercase font-extrabold text-amber-200 mt-1">Bronze</span>
                </div>
              </>
            ) : (
              <div className="w-full h-24 rounded-t-3xl bg-slate-900 border border-slate-800" />
            )}
          </div>
        </div>

        {/* Runner ups table if more than 3 players */}
        {podiumPlayers.length > 3 && (
          <div className="max-w-xl mx-auto w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-left z-10">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Honor Roll & Runners-Up
            </h4>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {podiumPlayers.slice(3).map((p) => (
                <div key={p.rank} className="flex items-center justify-between text-xs text-slate-300 py-1 border-b border-slate-800/60 last:border-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-500">#{p.rank}</span>
                    <span>{p.avatar} {p.nickname}</span>
                  </div>
                  <span className="font-mono text-purple-300 font-bold">{p.score} pts</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

    return null;
  };

  return (
    <div className="relative min-h-screen bg-slate-950">
      {renderScreenContent()}

      {/* Floating Phone Simulator Drawer */}
      {showPhoneSimulator && (
        <div className="fixed bottom-4 right-4 z-50 w-80 sm:w-96 h-[580px] max-h-[85vh] bg-slate-950 border-4 border-purple-500/60 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden ring-4 ring-black/70 animate-in fade-in slide-in-from-bottom-6">
          <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-400">
              <Smartphone className="w-4 h-4" />
              <span>Player Buzzer Simulator</span>
            </div>
            <button
              onClick={() => setShowPhoneSimulator(false)}
              className="w-6 h-6 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-xs font-bold transition-colors"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <PlayerScreen initialPin={pin} onExit={() => setShowPhoneSimulator(false)} />
          </div>
        </div>
      )}
    </div>
  );
};
