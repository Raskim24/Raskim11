import React, { useState } from 'react';
import {
  PlusCircle,
  Sparkles,
  Play,
  Edit,
  Copy,
  Trash2,
  Calendar,
  HelpCircle,
  ExternalLink,
  Smartphone,
  Share2,
} from 'lucide-react';
import { Quiz } from '../types/quiz';
import { HostRecommendations } from './HostRecommendations';

interface DashboardProps {
  quizzes: Quiz[];
  onHostGame: (quizId: string) => void;
  onEditQuiz: (quiz: Quiz) => void;
  onDuplicateQuiz: (quizId: string) => void;
  onDeleteQuiz: (quizId: string) => void;
  onCreateNewQuiz: () => void;
  onOpenAIGenerator: () => void;
  onOpenPlayerTester: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  quizzes,
  onHostGame,
  onEditQuiz,
  onDuplicateQuiz,
  onDeleteQuiz,
  onCreateNewQuiz,
  onOpenAIGenerator,
  onOpenPlayerTester,
}) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Action Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-900/60 via-slate-900 to-pink-900/40 border border-purple-500/30 p-6 sm:p-10 mb-8 shadow-2xl">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/40 mb-3">
            <span>⚡ Host Dashboard</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white font-fun leading-tight mb-3">
            Host live multiplayer quizzes in seconds
          </h1>
          <p className="text-slate-300 text-sm sm:text-base mb-6 leading-relaxed">
            Players join effortlessly from their phones with a Game PIN. Project questions on your main screen, let participants buzz in, and award points in real-time!
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={onCreateNewQuiz}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-extrabold text-sm shadow-lg shadow-pink-600/30 transition-all hover:scale-105"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Quiz</span>
            </button>

            <button
              onClick={onOpenAIGenerator}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-purple-500/50 text-purple-200 font-extrabold text-sm shadow-md transition-all hover:scale-105"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>AI Quiz Generator</span>
            </button>

            <button
              onClick={onOpenPlayerTester}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-sm transition-all hover:scale-105"
            >
              <Smartphone className="w-4 h-4" />
              <span>Open Player Buzzer</span>
            </button>
          </div>
        </div>

        {/* Ambient decorative blob */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-purple-500/10 to-transparent pointer-events-none" />
      </div>

      {/* Host Recommendations & Best Practices */}
      <div className="mb-8">
        <HostRecommendations onOpenPlayerTester={onOpenPlayerTester} />
      </div>

      {/* Quizzes List Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <span>Your Quizzes</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {quizzes.length}
            </span>
          </h2>
          <p className="text-xs text-slate-400">Launch a live game session or edit quiz questions</p>
        </div>
      </div>

      {/* Quizzes Grid */}
      {quizzes.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-900/50 rounded-3xl border border-slate-800">
          <HelpCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No quizzes created yet</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
            Get started by creating your first quiz manually or generate one instantly using the AI generator!
          </p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={onCreateNewQuiz}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
            >
              Create Quiz
            </button>
            <button
              onClick={onOpenAIGenerator}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold text-xs border border-purple-500/40"
            >
              Generate with AI
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-3xl overflow-hidden shadow-xl transition-all hover:-translate-y-1 flex flex-col group"
            >
              {/* Cover image or decorative gradient */}
              <div className="h-44 bg-slate-800 relative overflow-hidden">
                {quiz.coverImage ? (
                  <img
                    src={quiz.coverImage}
                    alt={quiz.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-purple-900/50 via-slate-900 to-pink-900/30 flex items-center justify-center">
                    <span className="text-5xl font-fun text-purple-500/30 font-bold">⚡</span>
                  </div>
                )}

                <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white border border-white/10 flex items-center space-x-1">
                  <span>{quiz.questions?.length || 0} Questions</span>
                </div>
              </div>

              {/* Quiz Info */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white line-clamp-1 group-hover:text-purple-300 transition-colors">
                    {quiz.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1 mb-4">
                    {quiz.description || 'No description provided.'}
                  </p>
                </div>

                <div>
                  <div className="text-[11px] text-slate-500 flex items-center space-x-1 mb-4">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Created {new Date(quiz.created_at).toLocaleDateString()}</span>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <button
                      onClick={() => onHostGame(quiz.id)}
                      className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-md shadow-emerald-600/30 transition-all hover:scale-105"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Host Live</span>
                    </button>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => onEditQuiz(quiz)}
                        title="Edit Quiz"
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDuplicateQuiz(quiz.id)}
                        title="Duplicate Quiz"
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(quiz.id)}
                        title="Delete Quiz"
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Delete this quiz?</h3>
            <p className="text-xs text-slate-400 mb-6">
              This action cannot be undone. Are you sure you want to remove it?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteQuiz(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
