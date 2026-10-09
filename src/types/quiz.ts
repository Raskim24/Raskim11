export type QuestionType = 'multiple_choice' | 'true_false';

export interface Question {
  id: string;
  text: string;
  imageUrl?: string;
  choices: string[];
  correctAnswers: number[]; // indices of correct choices (usually single, or multiple)
  timeLimit: 5 | 10 | 15 | 20 | 30 | 60; // in seconds
  points: 0 | 1000 | 2000;
  type: QuestionType;
  explanation?: string;
}

export interface Quiz {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  coverImage?: string;
  questions: Question[];
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
}

export interface Player {
  id: string;
  nickname: string;
  avatar: string;
  score: number;
  streak: number;
  lastAnswerCorrect?: boolean;
  lastPointsEarned?: number;
  answeredCurrent: boolean;
  currentAnswerIndex?: number;
  answerTime?: number;
  correctCount: number;
}

export type GameStatus =
  | 'lobby'
  | 'question_preview'
  | 'question_active'
  | 'question_result'
  | 'leaderboard'
  | 'podium'
  | 'finished';

export interface LiveGameState {
  pin: string;
  hostId: string;
  quizId: string;
  quizTitle: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  status: GameStatus;
  locked: boolean;
  question?: {
    id: string;
    text: string;
    imageUrl?: string;
    choices: string[];
    correctAnswers: number[];
    timeLimit: number;
    points: number;
    type: QuestionType;
    explanation?: string;
  };
  timeRemaining: number;
  playersCount: number;
  answeredCount: number;
  answerDistribution: number[]; // counts for choice 0, 1, 2, 3
  leaderboard: Array<{
    id: string;
    nickname: string;
    avatar: string;
    score: number;
    streak: number;
    rank: number;
    lastPoints: number;
  }>;
  podium?: Array<{
    rank: number;
    nickname: string;
    avatar: string;
    score: number;
    correctCount: number;
  }>;
}

export interface GameHistoryItem {
  id: string;
  pin: string;
  quizId: string;
  quizTitle: string;
  date: string;
  playerCount: number;
  totalQuestions: number;
  winner?: {
    nickname: string;
    score: number;
  };
  rankings: Array<{
    rank: number;
    nickname: string;
    score: number;
    correctCount: number;
  }>;
}

export const QUESTION_COLORS = [
  { bg: 'bg-red-600 hover:bg-red-500 active:bg-red-700', text: 'text-white', border: 'border-red-400', name: 'Red', shape: 'triangle', shapeSymbol: '▲', colorHex: '#dc2626' },
  { bg: 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700', text: 'text-white', border: 'border-blue-400', name: 'Blue', shape: 'diamond', shapeSymbol: '◆', colorHex: '#2563eb' },
  { bg: 'bg-amber-500 hover:bg-amber-400 active:bg-amber-600', text: 'text-white', border: 'border-amber-300', name: 'Yellow', shape: 'circle', shapeSymbol: '●', colorHex: '#f59e0b' },
  { bg: 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700', text: 'text-white', border: 'border-emerald-400', name: 'Green', shape: 'square', shapeSymbol: '■', colorHex: '#059669' },
];
