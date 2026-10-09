import React, { useState } from 'react';
import { X, Sparkles, Wand2, Loader2, BookOpen, Layers, CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import { Question } from '../types/quiz';

interface AIGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuestionsGenerated: (generatedQuestions: Question[], topic: string) => void;
}

const PRESET_TOPICS = [
  'Solar System & Black Holes',
  'World Geography & Landmarks',
  'Ancient Egypt & Rome',
  'Computer Science & Internet History',
  'Music, Pop Culture & Cinema',
  'Animal Kingdom & Ocean Mysteries',
];

export const AIGeneratorModal: React.FC<AIGeneratorModalProps> = ({
  isOpen,
  onClose,
  onQuestionsGenerated,
}) => {
  const [topic, setTopic] = useState('');
  const [gradeLevel, setGradeLevel] = useState('High School / General');
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [difficulty, setDifficulty] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError('Please provide a quiz topic.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await api.generateAIQuiz({
        topic: topic.trim(),
        gradeLevel,
        numQuestions,
        difficulty,
      });

      if (!result.questions || result.questions.length === 0) {
        throw new Error('AI could not generate questions for this topic. Please try another prompt.');
      }

      onQuestionsGenerated(result.questions, topic.trim());
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'AI Generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-purple-500/40 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-pink-600/20 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white font-fun">AI Quiz Generator</h2>
            <p className="text-xs text-purple-300">Generate a complete Kahoot-style quiz in seconds</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Quiz Topic or Curriculum Standard
            </label>
            <input
              type="text"
              placeholder="e.g. Photosynthesis, World War II, Python loops..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
            />

            {/* Quick Inspiration Pills */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PRESET_TOPICS.map((pt) => (
                <button
                  type="button"
                  key={pt}
                  onClick={() => setTopic(pt)}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800 hover:bg-purple-900/50 text-slate-300 hover:text-purple-200 border border-slate-700 transition-colors"
                >
                  {pt}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Target Audience / Grade
              </label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500"
              >
                <option value="Elementary School">Elementary (Ages 7-10)</option>
                <option value="Middle School">Middle School (Ages 11-13)</option>
                <option value="High School / General">High School (Ages 14-18)</option>
                <option value="College & Professional">College / Professional</option>
                <option value="Trivia Night Fans">Trivia Night / All Ages</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Questions Count
              </label>
              <select
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500"
              >
                <option value={3}>3 Questions (Quick Sprint)</option>
                <option value={5}>5 Questions (Standard)</option>
                <option value={8}>8 Questions (Extended)</option>
                <option value={10}>10 Questions (Championship)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Difficulty Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'easy', label: 'Easy 😊' },
                { key: 'medium', label: 'Medium ⚡' },
                { key: 'hard', label: 'Hard 🔥' },
              ].map((item) => (
                <button
                  type="button"
                  key={item.key}
                  onClick={() => setDifficulty(item.key)}
                  className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                    difficulty === item.key
                      ? 'bg-purple-600/30 border-purple-500 text-purple-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !topic.trim()}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white font-extrabold text-sm shadow-xl shadow-purple-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Drafting Questions with Gemini...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  <span>Generate Quiz & Load into Editor</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
