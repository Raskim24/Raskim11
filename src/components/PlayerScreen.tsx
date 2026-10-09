import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  CheckCircle2,
  XCircle,
  Flame,
  Trophy,
  ArrowRight,
  Loader2,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getSocket } from '../services/socket';
import { QUESTION_COLORS, LiveGameState } from '../types/quiz';
import { sound } from '../utils/sound';

interface PlayerScreenProps {
  initialPin?: string;
  onExit?: () => void;
}

const AVATARS = ['🚀', '🦊', '🐯', '🐼', '🦁', '🦄', '⚡', '🦉', '🐬', '🐙', '🦖', '🌟', '🎸', '🎯'];

export const PlayerScreen: React.FC<PlayerScreenProps> = ({ initialPin = '', onExit }) => {
  const socket = getSocket();

  // Join state
  const [pin, setPin] = useState(initialPin);
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState('🚀');
  const [joinStep, setJoinStep] = useState<'pin' | 'nickname' | 'in_game'>('pin');
  const [joinError, setJoinError] = useState('');
  const [loading, setLoading] = useState(false);

  // Player session state
  const [playerId, setPlayerId] = useState('');
  const [playerNickname, setPlayerNickname] = useState('');
  const [playerAvatar, setPlayerAvatar] = useState('🚀');
  const [currentScore, setCurrentScore] = useState(0);
  const [streak, setStreak] = useState(0);

  // Game state
  const [gameState, setGameState] = useState<LiveGameState | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [hasAnsweredCurrent, setHasAnsweredCurrent] = useState(false);

  // Round result state
  const [roundResult, setRoundResult] = useState<{
    isCorrect: boolean;
    pointsEarned: number;
    totalScore: number;
    streak: number;
  } | null>(null);

  useEffect(() => {
    // Socket event listeners
    const handleJoinSuccess = (data: { playerId: string; nickname: string; avatar: string; pin: string }) => {
      setPlayerId(data.playerId);
      setPlayerNickname(data.nickname);
      setPlayerAvatar(data.avatar);
      setJoinStep('in_game');
      setLoading(false);
      sound.playClick();
    };

    const handleJoinError = (data: { message: string }) => {
      setJoinError(data.message);
      setLoading(false);
    };

    const handleGameStateChanged = (state: LiveGameState) => {
      setGameState(state);

      if (state.status === 'question_active') {
        setSelectedChoice(null);
        setHasAnsweredCurrent(false);
        setRoundResult(null);
        sound.playClick();
      } else if (state.status === 'podium') {
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
      }
    };

    const handleAnswerRecorded = () => {
      setHasAnsweredCurrent(true);
      sound.playClick();
    };

    const handleRoundResult = (res: { isCorrect: boolean; pointsEarned: number; totalScore: number; streak: number }) => {
      setRoundResult(res);
      setCurrentScore(res.totalScore);
      setStreak(res.streak);
      if (res.isCorrect) {
        sound.playCorrect();
      } else {
        sound.playWrong();
      }
    };

    const handleKicked = () => {
      alert('You have been kicked from the game by the host.');
      setJoinStep('pin');
      setGameState(null);
    };

    socket.on('player:joined_success', handleJoinSuccess);
    socket.on('player:join_error', handleJoinError);
    socket.on('game:state_changed', handleGameStateChanged);
    socket.on('player:answer_recorded', handleAnswerRecorded);
    socket.on('player:round_result', handleRoundResult);
    socket.on('player:kicked', handleKicked);

    return () => {
      socket.off('player:joined_success', handleJoinSuccess);
      socket.off('player:join_error', handleJoinError);
      socket.off('game:state_changed', handleGameStateChanged);
      socket.off('player:answer_recorded', handleAnswerRecorded);
      socket.off('player:round_result', handleRoundResult);
      socket.off('player:kicked', handleKicked);
    };
  }, [socket]);

  // Handle PIN submission
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError('');
    const cleanPin = pin.replace(/\s+/g, '');
    if (cleanPin.length !== 6) {
      setJoinError('Game PIN must be a 6-digit number.');
      return;
    }
    setPin(cleanPin);
    setJoinStep('nickname');
  };

  // Handle Nickname submission & Join
  const handleJoinGame = (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError('');
    if (!nickname.trim()) {
      setJoinError('Please enter a nickname.');
      return;
    }
    if (nickname.trim().length > 15) {
      setJoinError('Nickname must be 15 characters or less.');
      return;
    }

    setLoading(true);
    socket.emit('player:join', {
      pin: pin.trim(),
      nickname: nickname.trim(),
      avatar,
    });
  };

  // Submit Answer Choice
  const handleAnswerChoice = (choiceIndex: number) => {
    if (hasAnsweredCurrent || !gameState || gameState.status !== 'question_active') return;
    setSelectedChoice(choiceIndex);
    setHasAnsweredCurrent(true);
    socket.emit('player:submit_answer', {
      pin,
      playerId,
      choiceIndex,
    });
  };

  // -----------------------------------------------------------
  // STEP 1: ENTER PIN SCREEN
  // -----------------------------------------------------------
  if (joinStep === 'pin') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
        <div className="max-w-xs sm:max-w-sm w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/30">
            <span className="text-white font-fun text-3xl font-bold">⚡</span>
          </div>

          <h1 className="text-2xl font-black text-white font-fun mb-1">QuizBlast</h1>
          <p className="text-xs text-slate-400 mb-6">Enter the 6-digit PIN on the host screen</p>

          {joinError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {joinError}
            </div>
          )}

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Game PIN"
                className="w-full text-center tracking-widest bg-slate-950 border-2 border-slate-700 focus:border-purple-500 rounded-2xl py-3.5 text-white font-black text-2xl focus:outline-none placeholder-slate-600 shadow-inner"
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-base shadow-lg shadow-purple-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Enter
            </button>
          </form>

          {onExit && (
            <button
              onClick={onExit}
              className="mt-6 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Switch back to Host View
            </button>
          )}
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------
  // STEP 2: NICKNAME & AVATAR PICKER
  // -----------------------------------------------------------
  if (joinStep === 'nickname') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
        <div className="max-w-xs sm:max-w-sm w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center">
          <span className="text-xs uppercase font-extrabold tracking-wider text-purple-400 bg-purple-950/60 px-3 py-1 rounded-full border border-purple-800 mb-3 inline-block">
            PIN: {pin}
          </span>
          <h2 className="text-2xl font-black text-white font-fun mb-1">Pick a Nickname</h2>
          <p className="text-xs text-slate-400 mb-4">Choose your display name and character</p>

          {joinError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {joinError}
            </div>
          )}

          {/* Avatar selector */}
          <div className="flex flex-wrap justify-center gap-2 mb-4 p-2 bg-slate-950 rounded-2xl border border-slate-800">
            {AVATARS.slice(0, 8).map((av) => (
              <button
                type="button"
                key={av}
                onClick={() => setAvatar(av)}
                className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${
                  avatar === av ? 'bg-purple-600 scale-110 shadow-md ring-2 ring-purple-400' : 'hover:bg-slate-800'
                }`}
              >
                {av}
              </button>
            ))}
          </div>

          <form onSubmit={handleJoinGame} className="space-y-4">
            <div>
              <input
                type="text"
                maxLength={15}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Nickname"
                className="w-full text-center bg-slate-950 border-2 border-slate-700 focus:border-purple-500 rounded-2xl py-3 text-white font-bold text-lg focus:outline-none placeholder-slate-600 shadow-inner"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-base shadow-lg shadow-purple-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Joining...</span>
                </>
              ) : (
                <span>OK, Go!</span>
              )}
            </button>
          </form>

          <button
            onClick={() => setJoinStep('pin')}
            className="mt-4 text-xs text-slate-500 hover:text-slate-300"
          >
            ← Change PIN
          </button>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------
  // STEP 3: IN GAME LOBBY
  // -----------------------------------------------------------
  if (!gameState || gameState.status === 'lobby') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-between items-center p-6 text-center">
        <div className="w-full max-w-sm flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-3">
          <span>PIN: {pin}</span>
          <span className="text-purple-400 font-bold">{playerAvatar} {playerNickname}</span>
        </div>

        <div className="my-auto max-w-sm">
          <div className="w-20 h-20 rounded-3xl bg-purple-600/20 border-2 border-purple-500/40 flex items-center justify-center text-4xl mx-auto mb-4 animate-bounce-gentle">
            {playerAvatar}
          </div>
          <h2 className="text-3xl font-black text-white font-fun mb-2">You're in!</h2>
          <p className="text-slate-300 text-sm font-medium mb-4">
            See your nickname <strong className="text-purple-400">{playerNickname}</strong> on the host's big screen?
          </p>
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center justify-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
            <span>Waiting for the host to start the game...</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-600">QuizBlast Live Mobile Buzzer</div>
      </div>
    );
  }

  // -----------------------------------------------------------
  // STEP 4: QUESTION PREVIEW
  // -----------------------------------------------------------
  if (gameState.status === 'question_preview') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <span className="text-xs uppercase font-extrabold tracking-widest text-purple-400 mb-2">
          Question {gameState.currentQuestionIndex + 1}
        </span>
        <h2 className="text-2xl font-black text-white font-fun mb-4 animate-pulse">
          Look at the screen!
        </h2>
        <div className="w-16 h-16 rounded-full border-2 border-purple-500 flex items-center justify-center text-2xl font-bold font-fun text-purple-300">
          👀
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------
  // STEP 5: ACTIVE QUESTION - 4 BIG VIBRANT COLOR BUTTONS!
  // -----------------------------------------------------------
  if (gameState.status === 'question_active') {
    if (hasAnsweredCurrent) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-purple-600/20 border-2 border-purple-500 flex items-center justify-center mb-4 animate-pulse-ring">
            <CheckCircle2 className="w-10 h-10 text-purple-400" />
          </div>
          <h2 className="text-2xl font-black text-white font-fun mb-2">Answer Locked In!</h2>
          <p className="text-slate-400 text-sm">Waiting for other players to finish...</p>
        </div>
      );
    }

    const isTrueFalse = gameState.question?.type === 'true_false';
    const buttonCount = isTrueFalse ? 2 : (gameState.question?.choices.length || 4);

    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-between p-3 sm:p-4">
        {/* Top header */}
        <div className="flex items-center justify-between text-xs text-slate-400 px-2 py-1">
          <span className="font-bold text-white">Q{gameState.currentQuestionIndex + 1}</span>
          <span className="font-mono text-purple-300 font-bold">{gameState.timeRemaining}s left</span>
          <span>{playerAvatar} {playerNickname}</span>
        </div>

        {/* The 4 Kahoot tactile color buttons */}
        <div
          className={`my-auto w-full max-w-md mx-auto grid gap-3 sm:gap-4 flex-1 py-2 ${
            buttonCount === 2 ? 'grid-rows-2 h-full' : 'grid-cols-2 grid-rows-2 h-[80vh]'
          }`}
        >
          {Array.from({ length: buttonCount }).map((_, idx) => {
            const color = QUESTION_COLORS[idx % QUESTION_COLORS.length];
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleAnswerChoice(idx)}
                className={`w-full h-full rounded-3xl flex items-center justify-center text-white shadow-2xl transition-all transform active:scale-95 border-2 ${color.bg} ${color.border}`}
              >
                <span className="text-5xl sm:text-7xl drop-shadow-md select-none">
                  {color.shapeSymbol}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------
  // STEP 6: ROUND RESULT FEEDBACK
  // -----------------------------------------------------------
  if (gameState.status === 'question_result') {
    const isCorrect = roundResult?.isCorrect;
    const points = roundResult?.pointsEarned || 0;

    return (
      <div
        className={`min-h-screen flex flex-col justify-between items-center p-6 text-center ${
          isCorrect ? 'bg-emerald-950' : 'bg-rose-950'
        }`}
      >
        <div className="text-xs text-slate-300 w-full flex justify-between border-b border-white/10 pb-3">
          <span>Q{gameState.currentQuestionIndex + 1} Complete</span>
          <span className="font-bold">{playerNickname}</span>
        </div>

        <div className="my-auto max-w-sm">
          <div className="text-6xl mb-4">{isCorrect ? '🎉' : '❌'}</div>
          <h2 className="text-4xl font-black text-white font-fun mb-2">
            {isCorrect ? 'Correct!' : 'Incorrect'}
          </h2>

          {isCorrect && (
            <div className="text-2xl font-black text-emerald-300 font-fun mb-2">
              +{points.toLocaleString()} pts
            </div>
          )}

          {streak >= 3 && (
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/40 mt-2">
              <Flame className="w-4 h-4 fill-current text-amber-400" />
              <span>{streak} Answer Streak Bonus!</span>
            </div>
          )}

          <div className="mt-6 p-4 rounded-2xl bg-black/30 border border-white/10">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-300 block mb-1">
              Your Total Score
            </span>
            <span className="text-3xl font-black font-fun text-white">
              {currentScore.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="text-xs text-slate-300">Look up at the big screen for standings!</div>
      </div>
    );
  }

  // -----------------------------------------------------------
  // STEP 7: LEADERBOARD WAIT STATE
  // -----------------------------------------------------------
  if (gameState.status === 'leaderboard') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-between items-center p-6 text-center">
        <div className="text-xs text-slate-400 w-full flex justify-between border-b border-slate-800 pb-3">
          <span>Score: {currentScore.toLocaleString()}</span>
          <span>{playerAvatar} {playerNickname}</span>
        </div>

        <div className="my-auto max-w-sm">
          <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-3 animate-bounce-gentle" />
          <h2 className="text-2xl font-black text-white font-fun mb-2">Leaderboard Displayed</h2>
          <p className="text-slate-400 text-sm">
            Check the host's screen to see if you climbed into the Top 5!
          </p>
        </div>

        <div className="text-xs text-slate-500">Next question coming up shortly...</div>
      </div>
    );
  }

  // -----------------------------------------------------------
  // STEP 8: FINAL PODIUM PLACEMENT
  // -----------------------------------------------------------
  if (gameState.status === 'podium') {
    const myPlacement = gameState.podium?.find((p) => p.nickname === playerNickname);

    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-between items-center p-6 text-center">
        <div className="text-xs text-slate-400">Game Over</div>

        <div className="my-auto max-w-sm">
          <div className="text-6xl mb-3">
            {myPlacement?.rank === 1 ? '🥇' : myPlacement?.rank === 2 ? '🥈' : myPlacement?.rank === 3 ? '🥉' : '🎖️'}
          </div>
          <h2 className="text-3xl font-black text-white font-fun mb-1">
            {myPlacement ? `You placed #${myPlacement.rank}!` : 'Game Finished!'}
          </h2>
          <p className="text-xl font-black text-purple-300 font-fun mb-4">
            {currentScore.toLocaleString()} Points
          </p>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
            {myPlacement?.correctCount} / {gameState.totalQuestions} questions answered correctly.
          </div>
        </div>

        <button
          onClick={() => {
            setJoinStep('pin');
            setGameState(null);
          }}
          className="w-full max-w-xs py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition-colors"
        >
          Play Another Game
        </button>
      </div>
    );
  }

  return null;
};
