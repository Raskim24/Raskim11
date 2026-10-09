import React, { useState } from 'react';
import {
  ArrowLeft,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Save,
  Clock,
  Award,
  CheckCircle,
  Image as ImageIcon,
  HelpCircle,
} from 'lucide-react';
import { Quiz, Question, QUESTION_COLORS, QuestionType } from '../types/quiz';

interface QuizEditorProps {
  initialQuiz?: Quiz | null;
  onSave: (quiz: Partial<Quiz>) => Promise<void>;
  onCancel: () => void;
  onOpenAIGenerator: () => void;
  generatedQuestions?: { questions: Question[]; topic: string } | null;
  onClearGeneratedQuestions?: () => void;
}

const DEFAULT_TIME_LIMITS: Array<Question['timeLimit']> = [5, 10, 15, 20, 30, 60];
const DEFAULT_POINTS: Array<Question['points']> = [0, 1000, 2000];

export const QuizEditor: React.FC<QuizEditorProps> = ({
  initialQuiz,
  onSave,
  onCancel,
  onOpenAIGenerator,
  generatedQuestions,
  onClearGeneratedQuestions,
}) => {
  const [title, setTitle] = useState(initialQuiz?.title || '');
  const [description, setDescription] = useState(initialQuiz?.description || '');
  const [coverImage, setCoverImage] = useState(initialQuiz?.coverImage || '');
  const [questions, setQuestions] = useState<Question[]>(
    initialQuiz?.questions && initialQuiz.questions.length > 0
      ? initialQuiz.questions
      : [
          {
            id: `q-${Date.now()}-1`,
            text: 'What is the capital of France?',
            type: 'multiple_choice',
            choices: ['Paris', 'London', 'Berlin', 'Madrid'],
            correctAnswers: [0],
            timeLimit: 20,
            points: 1000,
            explanation: 'Paris has been the capital of France since 508 AD.',
          },
        ]
  );
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Handle incoming AI questions if provided
  React.useEffect(() => {
    if (generatedQuestions && generatedQuestions.questions.length > 0) {
      if (!title || title.trim() === '') {
        setTitle(generatedQuestions.topic);
      }
      setQuestions(generatedQuestions.questions);
      setActiveQuestionIndex(0);
      if (onClearGeneratedQuestions) {
        onClearGeneratedQuestions();
      }
    }
  }, [generatedQuestions]);

  const activeQuestion = questions[activeQuestionIndex] || questions[0];

  const handleAddQuestion = (type: QuestionType = 'multiple_choice') => {
    const newQ: Question = {
      id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      text: type === 'true_false' ? 'True or False: ...' : 'New Question text here',
      type,
      choices: type === 'true_false' ? ['True', 'False'] : ['Answer 1', 'Answer 2', 'Answer 3', 'Answer 4'],
      correctAnswers: [0],
      timeLimit: 20,
      points: 1000,
    };
    setQuestions([...questions, newQ]);
    setActiveQuestionIndex(questions.length);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length <= 1) {
      alert('A quiz must have at least one question.');
      return;
    }
    const updated = questions.filter((_, i) => i !== idx);
    setQuestions(updated);
    setActiveQuestionIndex(Math.max(0, idx - 1));
  };

  const handleMoveQuestion = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= questions.length) return;
    const newQuestions = [...questions];
    const temp = newQuestions[idx];
    newQuestions[idx] = newQuestions[targetIdx];
    newQuestions[targetIdx] = temp;
    setQuestions(newQuestions);
    setActiveQuestionIndex(targetIdx);
  };

  const updateActiveQuestion = (patch: Partial<Question>) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === activeQuestionIndex ? { ...q, ...patch } : q))
    );
  };

  const handleChoiceChange = (choiceIdx: number, value: string) => {
    const newChoices = [...activeQuestion.choices];
    newChoices[choiceIdx] = value;
    updateActiveQuestion({ choices: newChoices });
  };

  const handleToggleCorrect = (choiceIdx: number) => {
    updateActiveQuestion({ correctAnswers: [choiceIdx] });
  };

  const handleTypeChange = (type: QuestionType) => {
    if (type === 'true_false') {
      updateActiveQuestion({
        type: 'true_false',
        choices: ['True', 'False'],
        correctAnswers: [0],
      });
    } else {
      updateActiveQuestion({
        type: 'multiple_choice',
        choices:
          activeQuestion.choices.length >= 4
            ? activeQuestion.choices
            : ['Answer 1', 'Answer 2', 'Answer 3', 'Answer 4'],
        correctAnswers: [0],
      });
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Quiz Title is required.');
      return;
    }
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].text.trim()) {
        setError(`Question #${i + 1} cannot have empty question text.`);
        setActiveQuestionIndex(i);
        return;
      }
      if (questions[i].choices.some((c) => !c.trim())) {
        setError(`Question #${i + 1} has empty answer choices.`);
        setActiveQuestionIndex(i);
        return;
      }
    }

    setSaving(true);
    setError('');
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        coverImage: coverImage.trim(),
        questions,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save quiz');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <button
            onClick={onCancel}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-white font-fun">
              {initialQuiz ? 'Edit Quiz' : 'Create New Quiz'}
            </h1>
            <p className="text-xs text-slate-400">Add questions, set timer rules, or generate with AI</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onOpenAIGenerator}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-purple-900/60 hover:bg-purple-900 border border-purple-500/50 text-purple-200 text-xs font-bold transition-all hover:scale-105"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>AI Quiz Generator</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs font-extrabold shadow-lg shadow-pink-600/30 transition-all hover:scale-105 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Quiz'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* Quiz Metadata (Title & Description) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Quiz Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. World Capitals & Geography Blitz"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-bold text-base focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Description (Optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short summary for your players"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Cover Image URL (Optional)
            </label>
            <input
              type="text"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-purple-500"
            />
            {coverImage && (
              <div className="mt-2 h-20 rounded-xl overflow-hidden border border-slate-800">
                <img
                  src={coverImage}
                  alt="Cover"
                  className="w-full h-full object-cover"
                  onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Questions Layout: Left Sidebar + Right Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Questions List / Thumbnails */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Questions ({questions.length})
            </span>
            <div className="flex space-x-1">
              <button
                type="button"
                onClick={() => handleAddQuestion('multiple_choice')}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-400 text-xs font-bold flex items-center space-x-1"
                title="Add Multiple Choice"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>MC</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddQuestion('true_false')}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-bold flex items-center space-x-1"
                title="Add True / False"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>T/F</span>
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {questions.map((q, idx) => (
              <div
                key={q.id || idx}
                onClick={() => setActiveQuestionIndex(idx)}
                className={`p-3 rounded-2xl cursor-pointer border transition-all relative group ${
                  activeQuestionIndex === idx
                    ? 'bg-purple-900/30 border-purple-500 shadow-md ring-1 ring-purple-500'
                    : 'bg-slate-900/80 border-slate-800 hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center justify-between mb-1 text-[11px]">
                  <span className="font-bold text-slate-300">#{idx + 1} {q.type === 'true_false' ? 'T/F' : 'Quiz'}</span>
                  <span className="text-slate-500">{q.timeLimit}s • {q.points}p</span>
                </div>
                <p className="text-xs font-medium text-white line-clamp-2">{q.text || 'Untitled question'}</p>

                {/* Move / Delete controls */}
                <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-end space-x-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveQuestion(idx, 'up');
                    }}
                    disabled={idx === 0}
                    className="p-1 hover:text-white text-slate-500 disabled:opacity-20"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveQuestion(idx, 'down');
                    }}
                    disabled={idx === questions.length - 1}
                    className="p-1 hover:text-white text-slate-500 disabled:opacity-20"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveQuestion(idx);
                    }}
                    className="p-1 hover:text-rose-400 text-slate-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Active Question Editor */}
        <div className="lg:col-span-3 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6">
          {/* Question Text */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Question #{activeQuestionIndex + 1} Text
              </label>
              <div className="flex items-center space-x-3 text-xs">
                {/* Type toggle */}
                <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleTypeChange('multiple_choice')}
                    className={`px-2.5 py-1 rounded-md font-semibold ${
                      activeQuestion.type === 'multiple_choice'
                        ? 'bg-purple-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    4 Choices
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeChange('true_false')}
                    className={`px-2.5 py-1 rounded-md font-semibold ${
                      activeQuestion.type === 'true_false'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    True / False
                  </button>
                </div>
              </div>
            </div>

            <textarea
              rows={3}
              value={activeQuestion.text}
              onChange={(e) => updateActiveQuestion({ text: e.target.value })}
              placeholder="Type your question here (e.g. Which planet is closest to the Sun?)"
              className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-white font-bold text-lg focus:outline-none focus:border-purple-500 resize-none shadow-inner"
            />
          </div>

          {/* Settings row: Image URL, Time limit, Points */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            {/* Image URL */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center space-x-1">
                <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                <span>Media Image URL</span>
              </label>
              <input
                type="text"
                value={activeQuestion.imageUrl || ''}
                onChange={(e) => updateActiveQuestion({ imageUrl: e.target.value })}
                placeholder="https://... (optional)"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Time limit */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Time Limit</span>
              </label>
              <select
                value={activeQuestion.timeLimit}
                onChange={(e) => updateActiveQuestion({ timeLimit: Number(e.target.value) as Question['timeLimit'] })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none focus:border-purple-500"
              >
                {DEFAULT_TIME_LIMITS.map((t) => (
                  <option key={t} value={t}>
                    {t} seconds
                  </option>
                ))}
              </select>
            </div>

            {/* Points */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center space-x-1">
                <Award className="w-3.5 h-3.5 text-pink-400" />
                <span>Points</span>
              </label>
              <select
                value={activeQuestion.points}
                onChange={(e) => updateActiveQuestion({ points: Number(e.target.value) as Question['points'] })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none focus:border-purple-500"
              >
                <option value={1000}>Standard (1,000 pts)</option>
                <option value={2000}>Double (2,000 pts)</option>
                <option value={0}>No Points (0 pts)</option>
              </select>
            </div>
          </div>

          {/* Answer Choices Grid with Kahoot Colors */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Answer Choices (Click checkmark to set correct answer)
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {activeQuestion.choices.map((choice, cIdx) => {
                const colorConfig = QUESTION_COLORS[cIdx % QUESTION_COLORS.length];
                const isCorrect = activeQuestion.correctAnswers.includes(cIdx);

                return (
                  <div
                    key={cIdx}
                    className={`relative rounded-2xl p-3 border-2 transition-all flex items-center space-x-3 ${
                      isCorrect
                        ? 'border-emerald-400 bg-slate-900 shadow-lg shadow-emerald-500/10'
                        : 'border-slate-800 bg-slate-950/80 hover:border-slate-700'
                    }`}
                  >
                    {/* Shape badge */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg text-white shadow-md ${colorConfig.bg}`}
                    >
                      {colorConfig.shapeSymbol}
                    </div>

                    {/* Answer text input */}
                    <input
                      type="text"
                      value={choice}
                      onChange={(e) => handleChoiceChange(cIdx, e.target.value)}
                      placeholder={`Answer Choice ${cIdx + 1}`}
                      className="flex-1 bg-transparent border-none text-white font-semibold text-sm focus:outline-none placeholder-slate-600"
                    />

                    {/* Correct answer toggle button */}
                    <button
                      type="button"
                      onClick={() => handleToggleCorrect(cIdx)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        isCorrect
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                          : 'border-2 border-slate-700 text-slate-600 hover:border-slate-500'
                      }`}
                      title={isCorrect ? 'Correct Answer' : 'Mark as Correct'}
                    >
                      <CheckCircle className={`w-5 h-5 ${isCorrect ? 'text-white' : 'text-slate-600'}`} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Explanation (shown after reveal) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center space-x-1">
              <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
              <span>Explanation / Fun Fact (Optional)</span>
            </label>
            <input
              type="text"
              value={activeQuestion.explanation || ''}
              onChange={(e) => updateActiveQuestion({ explanation: e.target.value })}
              placeholder="e.g. Venus is the hottest planet due to runaway greenhouse effect."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white text-xs focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
