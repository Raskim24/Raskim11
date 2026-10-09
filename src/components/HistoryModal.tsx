import React, { useState, useEffect } from 'react';
import { X, Trophy, Download, Calendar, Users, HelpCircle, FileText } from 'lucide-react';
import { api } from '../services/api';
import { GameHistoryItem } from '../types/quiz';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose }) => {
  const [history, setHistory] = useState<GameHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<GameHistoryItem | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const items = await api.getHistory();
      setHistory(items);
      if (items.length > 0) {
        setSelectedGame(items[0]);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = (item: GameHistoryItem) => {
    let csv = 'Rank,Nickname,Score,CorrectAnswers,TotalQuestions,Date,QuizTitle\n';
    item.rankings.forEach((r) => {
      csv += `"${r.rank}","${r.nickname.replace(/"/g, '""')}","${r.score}","${r.correctCount}","${item.totalQuestions}","${item.date}","${item.quizTitle.replace(/"/g, '""')}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `quizblast-results-${item.pin}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-6">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Live Games History & Results</h2>
              <p className="text-xs text-slate-400">View past sessions, student rankings, and export CSV reports</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-800">
          {/* Game sessions list */}
          <div className="overflow-y-auto p-4 space-y-2.5 bg-slate-950/40">
            {loading ? (
              <div className="p-8 text-center text-slate-500 text-sm">Loading history...</div>
            ) : history.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No games played yet. Host a live game to see results here!
              </div>
            ) : (
              history.map((game) => (
                <div
                  key={game.id}
                  onClick={() => setSelectedGame(game)}
                  className={`p-3.5 rounded-2xl cursor-pointer border transition-all ${
                    selectedGame?.id === game.id
                      ? 'bg-purple-900/40 border-purple-500/80 shadow-md'
                      : 'bg-slate-900/80 border-slate-800 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono text-purple-400 font-bold">PIN: {game.pin}</span>
                    <span className="text-slate-400 text-[11px]">
                      {new Date(game.date).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white truncate mb-1">{game.quizTitle}</h4>
                  <div className="flex items-center space-x-3 text-xs text-slate-400">
                    <span className="flex items-center space-x-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>{game.playerCount} players</span>
                    </span>
                    {game.winner && (
                      <span className="text-amber-400 font-semibold truncate">
                        👑 {game.winner.nickname}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Details / Leaderboard */}
          <div className="md:col-span-2 overflow-y-auto p-6 bg-slate-900 flex flex-col">
            {selectedGame ? (
              <>
                <div className="flex items-start justify-between mb-6 pb-4 border-b border-slate-800">
                  <div>
                    <span className="text-xs font-mono text-purple-400 uppercase tracking-widest font-bold">
                      Session Code: {selectedGame.pin}
                    </span>
                    <h3 className="text-xl font-bold text-white mt-1">{selectedGame.quizTitle}</h3>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-slate-400">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(selectedGame.date).toLocaleString()}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Users className="w-3.5 h-3.5" />
                        <span>{selectedGame.playerCount} participants</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>{selectedGame.totalQuestions} questions</span>
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleExportCSV(selectedGame)}
                    className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all hover:scale-105"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export CSV</span>
                  </button>
                </div>

                {/* Rankings Table */}
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Final Student Standings
                </h4>
                <div className="space-y-2 flex-1">
                  {selectedGame.rankings.map((r) => (
                    <div
                      key={r.rank + r.nickname}
                      className={`flex items-center justify-between p-3 rounded-xl border ${
                        r.rank === 1
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                          : r.rank === 2
                          ? 'bg-slate-300/10 border-slate-400/40 text-slate-200'
                          : r.rank === 3
                          ? 'bg-amber-700/10 border-amber-700/40 text-amber-200'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-xs">
                          {r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : `#${r.rank}`}
                        </span>
                        <span className="font-bold text-sm text-white">{r.nickname}</span>
                      </div>
                      <div className="flex items-center space-x-4 text-xs">
                        <span className="text-slate-400">
                          {r.correctCount} / {selectedGame.totalQuestions} correct
                        </span>
                        <span className="font-extrabold font-mono text-purple-300 text-sm">
                          {r.score.toLocaleString()} pts
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="m-auto text-center text-slate-500 text-sm">
                Select a game session on the left to see the leaderboard.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
