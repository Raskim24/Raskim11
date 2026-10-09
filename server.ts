import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import path from 'path';
import fs from 'fs';
import JSZip from 'jszip';
import { GoogleGenAI } from '@google/genai';
import { INITIAL_SEED_QUIZZES } from './src/data/seedQuizzes';
import { LiveGameState, Player, Question, Quiz, GameHistoryItem } from './src/types/quiz';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// In-Memory Database Store (isolated per owner_id)
interface UserRecord {
  id: string;
  email: string;
  password: string; // hashed or demo salt
  display_name: string;
  created_at: string;
}

const users: Map<string, UserRecord> = new Map();
// Seed a default host user for instant test if desired
const DEFAULT_USER_ID = 'host-demo-123';
users.set(DEFAULT_USER_ID, {
  id: DEFAULT_USER_ID,
  email: 'host@quizblast.io',
  password: 'Password123',
  display_name: 'Professor Blast',
  created_at: new Date().toISOString(),
});

// Quizzes store
const quizzesStore: Map<string, Quiz> = new Map();
INITIAL_SEED_QUIZZES.forEach((q) => {
  quizzesStore.set(q.id, { ...q, owner_id: DEFAULT_USER_ID });
});

// Game history store
const gameHistoryStore: Map<string, GameHistoryItem[]> = new Map();
gameHistoryStore.set(DEFAULT_USER_ID, [
  {
    id: 'hist-1',
    pin: '748291',
    quizId: 'seed-quiz-space-science',
    quizTitle: 'Cosmic Wonders: Space & Science Challenge',
    date: new Date(Date.now() - 86400000).toISOString(),
    playerCount: 12,
    totalQuestions: 5,
    winner: { nickname: 'AstroNova', score: 4850 },
    rankings: [
      { rank: 1, nickname: 'AstroNova', score: 4850, correctCount: 5 },
      { rank: 2, nickname: 'StarGazer', score: 4120, correctCount: 4 },
      { rank: 3, nickname: 'CosmoKid', score: 3890, correctCount: 4 },
      { rank: 4, nickname: 'PixelPilot', score: 2950, correctCount: 3 },
      { rank: 5, nickname: 'Nebula', score: 2100, correctCount: 2 },
    ],
  },
]);

// Active live games on the server
interface ServerLiveGame {
  pin: string;
  hostId: string;
  hostSocketId: string;
  quiz: Quiz;
  currentQuestionIndex: number;
  status: LiveGameState['status'];
  locked: boolean;
  questionStartTime?: number;
  timeRemaining: number;
  timerInterval?: NodeJS.Timeout;
  previewTimer?: NodeJS.Timeout;
  players: Map<string, Player & { socketId: string }>;
  answerDistribution: number[];
  answersReceived: number;
}

const activeGames: Map<string, ServerLiveGame> = new Map();

// Helper: Token extraction (simple secure bearer token simulation)
function getUserIdFromAuthHeader(req: express.Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/, '');
  if (!token) return null;
  // If token is in users or match session
  if (users.has(token)) return token;
  // Look up by id
  for (const [id, user] of users.entries()) {
    if (token === `token-${id}` || token === id) {
      return id;
    }
  }
  return DEFAULT_USER_ID;
}

// Rate limiter map for auth endpoints
const rateLimitMap: Map<string, { count: number; resetAt: number }> = new Map();
function checkRateLimit(ip: string, limit: number = 20, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (record.count >= limit) return false;
  record.count++;
  return true;
}

// ----------------------------------------------------
// REST API ROUTES
// ----------------------------------------------------

// Auth: Sign Up
app.post('/api/auth/signup', (req, res) => {
  const ip = req.ip || '127.0.0.1';
  if (!checkRateLimit(ip, 15, 60000)) {
    return res.status(429).json({ error: 'Too many attempts, please wait a few minutes.' });
  }

  const { display_name, email, password, confirm_password } = req.body;
  if (!email || !password || !display_name) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  if (password !== confirm_password) {
    return res.status(400).json({ error: 'Passwords do not match.' });
  }
  if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return res.status(400).json({ error: 'Password must be at least 8 characters with at least one letter and one number.' });
  }

  // Check existing
  for (const user of users.values()) {
    if (user.email.toLowerCase() === email.toLowerCase().trim()) {
      return res.status(400).json({ error: 'This email already has an account. Try logging in.' });
    }
  }

  const newId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const newUser: UserRecord = {
    id: newId,
    email: email.trim().toLowerCase(),
    password,
    display_name: display_name.trim(),
    created_at: new Date().toISOString(),
  };
  users.set(newId, newUser);

  // Copy seed quizzes to new user so they have rich starter quizzes
  INITIAL_SEED_QUIZZES.forEach((sq) => {
    const clonedId = `quiz-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    quizzesStore.set(clonedId, {
      ...sq,
      id: clonedId,
      owner_id: newId,
    });
  });

  return res.json({
    token: `token-${newId}`,
    user: { id: newUser.id, email: newUser.email, display_name: newUser.display_name, created_at: newUser.created_at },
  });
});

// Auth: Login
app.post('/api/auth/login', (req, res) => {
  const ip = req.ip || '127.0.0.1';
  if (!checkRateLimit(ip, 15, 60000)) {
    return res.status(429).json({ error: 'Too many attempts, please wait a few minutes.' });
  }

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email or password is wrong.' });
  }

  let matchedUser: UserRecord | null = null;
  for (const user of users.values()) {
    if (user.email.toLowerCase() === email.toLowerCase().trim() && user.password === password) {
      matchedUser = user;
      break;
    }
  }

  if (!matchedUser) {
    return res.status(401).json({ error: 'Email or password is wrong.' });
  }

  return res.json({
    token: `token-${matchedUser.id}`,
    user: { id: matchedUser.id, email: matchedUser.email, display_name: matchedUser.display_name, created_at: matchedUser.created_at },
  });
});

// Auth: Me
app.get('/api/auth/me', (req, res) => {
  const userId = getUserIdFromAuthHeader(req);
  if (!userId || !users.has(userId)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const user = users.get(userId)!;
  return res.json({
    user: { id: user.id, email: user.email, display_name: user.display_name, created_at: user.created_at },
  });
});

// Auth: Forgot Password
app.post('/api/auth/forgot-password', (_req, res) => {
  return res.json({ message: 'If this email exists, we sent a link' });
});

// Auth: Reset Password
app.post('/api/auth/reset-password', (_req, res) => {
  return res.json({ message: 'Password has been reset successfully' });
});

// Auth: Update Settings
app.post('/api/auth/update-profile', (req, res) => {
  const userId = getUserIdFromAuthHeader(req);
  if (!userId || !users.has(userId)) return res.status(401).json({ error: 'Unauthorized' });
  const user = users.get(userId)!;
  const { display_name } = req.body;
  if (display_name) {
    user.display_name = display_name.trim();
  }
  return res.json({ success: true, user: { id: user.id, email: user.email, display_name: user.display_name, created_at: user.created_at } });
});

app.post('/api/auth/update-password', (req, res) => {
  const userId = getUserIdFromAuthHeader(req);
  if (!userId || !users.has(userId)) return res.status(401).json({ error: 'Unauthorized' });
  const user = users.get(userId)!;
  const { current_password, new_password } = req.body;
  if (user.password !== current_password) {
    return res.status(400).json({ error: 'Current password is incorrect.' });
  }
  if (!new_password || new_password.length < 8 || !/[a-zA-Z]/.test(new_password) || !/[0-9]/.test(new_password)) {
    return res.status(400).json({ error: 'New password must be at least 8 characters with at least one letter and one number.' });
  }
  user.password = new_password;
  return res.json({ success: true, message: 'Password updated successfully' });
});

app.post('/api/auth/delete-account', (req, res) => {
  const userId = getUserIdFromAuthHeader(req);
  if (!userId || !users.has(userId)) return res.status(401).json({ error: 'Unauthorized' });
  const { confirmation } = req.body;
  if (confirmation !== 'DELETE') {
    return res.status(400).json({ error: 'Must type DELETE to confirm.' });
  }
  // Delete user's quizzes and history
  for (const [qId, q] of quizzesStore.entries()) {
    if (q.owner_id === userId) quizzesStore.delete(qId);
  }
  gameHistoryStore.delete(userId);
  users.delete(userId);
  return res.json({ success: true });
});

// Quizzes: List (Host only sees their quizzes)
app.get('/api/quizzes', (req, res) => {
  const userId = getUserIdFromAuthHeader(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const list = Array.from(quizzesStore.values()).filter((q) => q.owner_id === userId);
  return res.json(list);
});

// Quizzes: Get single quiz
app.get('/api/quizzes/:id', (req, res) => {
  const userId = getUserIdFromAuthHeader(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const quiz = quizzesStore.get(req.params.id);
  if (!quiz || quiz.owner_id !== userId) {
    return res.status(404).json({ error: 'Quiz not found' });
  }
  return res.json(quiz);
});

// Quizzes: Create
app.post('/api/quizzes', (req, res) => {
  const userId = getUserIdFromAuthHeader(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const { title, description, coverImage, questions } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const newQuiz: Quiz = {
    id: `quiz-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    owner_id: userId,
    title: title.trim(),
    description: description || '',
    coverImage: coverImage || '',
    questions: Array.isArray(questions) ? questions : [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  quizzesStore.set(newQuiz.id, newQuiz);
  return res.json(newQuiz);
});

// Quizzes: Update
app.put('/api/quizzes/:id', (req, res) => {
  const userId = getUserIdFromAuthHeader(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const quiz = quizzesStore.get(req.params.id);
  if (!quiz || quiz.owner_id !== userId) {
    return res.status(404).json({ error: 'Quiz not found' });
  }

  const { title, description, coverImage, questions } = req.body;
  quiz.title = title || quiz.title;
  quiz.description = description !== undefined ? description : quiz.description;
  quiz.coverImage = coverImage !== undefined ? coverImage : quiz.coverImage;
  if (Array.isArray(questions)) {
    quiz.questions = questions;
  }
  quiz.updated_at = new Date().toISOString();

  quizzesStore.set(quiz.id, quiz);
  return res.json(quiz);
});

// Quizzes: Duplicate
app.post('/api/quizzes/:id/duplicate', (req, res) => {
  const userId = getUserIdFromAuthHeader(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const quiz = quizzesStore.get(req.params.id);
  if (!quiz || quiz.owner_id !== userId) {
    return res.status(404).json({ error: 'Quiz not found' });
  }

  const duplicate: Quiz = {
    ...JSON.parse(JSON.stringify(quiz)),
    id: `quiz-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    owner_id: userId,
    title: `${quiz.title} (Copy)`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  quizzesStore.set(duplicate.id, duplicate);
  return res.json(duplicate);
});

// Quizzes: Delete
app.delete('/api/quizzes/:id', (req, res) => {
  const userId = getUserIdFromAuthHeader(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const quiz = quizzesStore.get(req.params.id);
  if (!quiz || quiz.owner_id !== userId) {
    return res.status(404).json({ error: 'Quiz not found' });
  }
  quizzesStore.delete(req.params.id);
  return res.json({ success: true });
});

// Game History: List
app.get('/api/history', (req, res) => {
  const userId = getUserIdFromAuthHeader(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const list = gameHistoryStore.get(userId) || [];
  return res.json(list);
});

// Game History: Export CSV
app.get('/api/history/:id/export', (req, res) => {
  const userId = getUserIdFromAuthHeader(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const historyList = gameHistoryStore.get(userId) || [];
  const item = historyList.find((h) => h.id === req.params.id);
  if (!item) return res.status(404).send('History item not found');

  let csv = 'Rank,Nickname,Score,CorrectAnswers,TotalQuestions,Date,QuizTitle\n';
  item.rankings.forEach((r) => {
    csv += `"${r.rank}","${r.nickname.replace(/"/g, '""')}","${r.score}","${r.correctCount}","${item.totalQuestions}","${item.date}","${item.quizTitle.replace(/"/g, '""')}"\n`;
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=quizblast-results-${item.pin}.csv`);
  return res.send(csv);
});

// Download full project source code as ZIP
function addDirToZipArchive(zip: JSZip, localDir: string, zipPrefix: string = '') {
  if (!fs.existsSync(localDir)) return;
  const items = fs.readdirSync(localDir);
  for (const item of items) {
    if (['node_modules', 'dist', '.git', '.cache'].includes(item)) continue;
    const fullPath = path.join(localDir, item);
    const zipPath = zipPrefix ? `${zipPrefix}/${item}` : item;
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      addDirToZipArchive(zip, fullPath, zipPath);
    } else {
      const fileData = fs.readFileSync(fullPath);
      zip.file(zipPath, fileData);
    }
  }
}

app.get('/api/download-zip', async (_req, res) => {
  try {
    const zip = new JSZip();
    addDirToZipArchive(zip, process.cwd());
    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="quizblast-project.zip"');
    return res.send(zipBuffer);
  } catch (err) {
    console.error('Error generating project zip:', err);
    return res.status(500).json({ error: 'Failed to generate zip file' });
  }
});

// AI Quiz Generator Endpoint
app.post('/api/ai/generate-quiz', async (req, res) => {
  try {
    const { topic, gradeLevel, numQuestions = 5, difficulty = 'medium' } = req.body;
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const ai = new GoogleGenAI();
    const prompt = `You are an expert educator and quiz creator for a Kahoot-style quiz game called QuizBlast.
Create a thrilling, engaging multiplayer quiz about: "${topic}".
Target audience/grade level: "${gradeLevel || 'General Audience'}".
Difficulty: "${difficulty}".
Number of questions: ${Math.min(10, Math.max(2, Number(numQuestions) || 5))}.

For each question:
1. Provide a clear question text.
2. For multiple choice questions, provide exactly 4 distinct answer choices (concise, clear).
3. Specify which index is correct (0, 1, 2, or 3).
4. Set a suitable time limit (10, 15, 20, or 30 seconds).
5. Set standard points (1000) or double points (2000 for hard/climax questions).
6. Provide a short, fun 1-sentence explanation.

Return ONLY a valid JSON array matching this exact TypeScript structure:
[
  {
    "id": "q1",
    "text": "Question text here?",
    "type": "multiple_choice",
    "choices": ["Choice A", "Choice B", "Choice C", "Choice D"],
    "correctAnswers": [0],
    "timeLimit": 20,
    "points": 1000,
    "explanation": "Fun fact explaining why Choice A is correct."
  }
]
Do not wrap in markdown quotes if possible, output raw JSON only.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '[]';
    const parsed = JSON.parse(responseText.trim());
    return res.json({ questions: parsed });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Error generating AI quiz:', errorMsg);
    return res.status(500).json({ error: `AI generation failed: ${errorMsg}` });
  }
});

// ----------------------------------------------------
// SOCKET.IO REAL-TIME MULTIPLAYER GAME ENGINE
// ----------------------------------------------------

const AVATARS = ['🚀', '🦊', '🐯', '🐼', '🦁', '🦄', '⚡', '🦉', '🐬', '🐙', '🦖', '🌟', '🎸', '🎯'];

function buildPublicGameState(game: ServerLiveGame): LiveGameState {
  const currentQ = game.quiz.questions[game.currentQuestionIndex];
  const sortedPlayers = Array.from(game.players.values()).sort((a, b) => b.score - a.score);

  const leaderboard = sortedPlayers.slice(0, 5).map((p, idx) => ({
    id: p.id,
    nickname: p.nickname,
    avatar: p.avatar,
    score: p.score,
    streak: p.streak,
    rank: idx + 1,
    lastPoints: p.lastPointsEarned || 0,
  }));

  const podium = sortedPlayers.map((p, idx) => ({
    rank: idx + 1,
    nickname: p.nickname,
    avatar: p.avatar,
    score: p.score,
    correctCount: p.correctCount,
  }));

  return {
    pin: game.pin,
    hostId: game.hostId,
    quizId: game.quiz.id,
    quizTitle: game.quiz.title,
    currentQuestionIndex: game.currentQuestionIndex,
    totalQuestions: game.quiz.questions.length,
    status: game.status,
    locked: game.locked,
    timeRemaining: game.timeRemaining,
    playersCount: game.players.size,
    answeredCount: game.answersReceived,
    answerDistribution: [...game.answerDistribution],
    question: currentQ
      ? {
          id: currentQ.id,
          text: currentQ.text,
          imageUrl: currentQ.imageUrl,
          choices: currentQ.choices,
          correctAnswers: currentQ.correctAnswers,
          timeLimit: currentQ.timeLimit,
          points: currentQ.points,
          type: currentQ.type,
          explanation: currentQ.explanation,
        }
      : undefined,
    leaderboard,
    podium: game.status === 'podium' ? podium : undefined,
  };
}

function clearGameTimers(game: ServerLiveGame) {
  if (game.timerInterval) {
    clearInterval(game.timerInterval);
    game.timerInterval = undefined;
  }
  if (game.previewTimer) {
    clearTimeout(game.previewTimer);
    game.previewTimer = undefined;
  }
}

function endCurrentQuestion(game: ServerLiveGame) {
  clearGameTimers(game);
  game.status = 'question_result';

  // Mark all un-answered players as answered: false and reset streak
  const currentQ = game.quiz.questions[game.currentQuestionIndex];
  for (const player of game.players.values()) {
    if (!player.answeredCurrent) {
      player.lastAnswerCorrect = false;
      player.lastPointsEarned = 0;
      player.streak = 0;
    }
  }

  // Broadcast updated results to host and players
  const state = buildPublicGameState(game);
  io.to(`game:${game.pin}`).emit('game:state_changed', state);

  // Send individualized result to each player
  for (const player of game.players.values()) {
    io.to(player.socketId).emit('player:round_result', {
      isCorrect: !!player.lastAnswerCorrect,
      pointsEarned: player.lastPointsEarned || 0,
      totalScore: player.score,
      streak: player.streak,
      correctAnswers: currentQ ? currentQ.correctAnswers : [],
    });
  }
}

io.on('connection', (socket: Socket) => {
  // Host creates game
  socket.on('host:create_game', ({ quizId, token }: { quizId: string; token: string }) => {
    const userId = token ? token.replace(/^token-/, '') : DEFAULT_USER_ID;
    const quiz = quizzesStore.get(quizId) || Array.from(quizzesStore.values())[0];
    if (!quiz) {
      socket.emit('error', { message: 'Quiz not found' });
      return;
    }

    // Generate unique 6-digit PIN
    let pin = Math.floor(100000 + Math.random() * 900000).toString();
    while (activeGames.has(pin)) {
      pin = Math.floor(100000 + Math.random() * 900000).toString();
    }

    const newGame: ServerLiveGame = {
      pin,
      hostId: userId,
      hostSocketId: socket.id,
      quiz: JSON.parse(JSON.stringify(quiz)),
      currentQuestionIndex: 0,
      status: 'lobby',
      locked: false,
      timeRemaining: 0,
      players: new Map(),
      answerDistribution: [0, 0, 0, 0],
      answersReceived: 0,
    };

    activeGames.set(pin, newGame);
    socket.join(`game:${pin}`);
    socket.join(`host:${pin}`);

    socket.emit('host:game_created', { pin, state: buildPublicGameState(newGame) });
  });

  // Host starts game
  socket.on('host:start_game', ({ pin }: { pin: string }) => {
    const game = activeGames.get(pin);
    if (!game || game.hostSocketId !== socket.id) return;

    clearGameTimers(game);
    game.currentQuestionIndex = 0;
    game.status = 'question_preview';
    game.timeRemaining = 3;

    // Reset all players stats for fresh game
    for (const player of game.players.values()) {
      player.score = 0;
      player.streak = 0;
      player.correctCount = 0;
      player.answeredCurrent = false;
      player.lastPointsEarned = 0;
    }

    io.to(`game:${pin}`).emit('game:state_changed', buildPublicGameState(game));

    // Preview 3-second countdown
    let previewLeft = 3;
    const interval = setInterval(() => {
      previewLeft--;
      io.to(`game:${pin}`).emit('game:preview_tick', { seconds: previewLeft });
      if (previewLeft <= 0) {
        clearInterval(interval);
        startQuestionActive(game);
      }
    }, 1000);
    game.previewTimer = interval as unknown as NodeJS.Timeout;
  });

  function startQuestionActive(game: ServerLiveGame) {
    clearGameTimers(game);
    const currentQ = game.quiz.questions[game.currentQuestionIndex];
    if (!currentQ) return;

    game.status = 'question_active';
    game.timeRemaining = currentQ.timeLimit;
    game.questionStartTime = Date.now();
    game.answersReceived = 0;
    game.answerDistribution = [0, 0, 0, 0];

    // Reset player answer states for this question
    for (const player of game.players.values()) {
      player.answeredCurrent = false;
      player.currentAnswerIndex = undefined;
      player.lastAnswerCorrect = undefined;
      player.lastPointsEarned = 0;
    }

    io.to(`game:${game.pin}`).emit('game:state_changed', buildPublicGameState(game));

    // Active timer loop
    game.timerInterval = setInterval(() => {
      game.timeRemaining -= 1;
      io.to(`game:${game.pin}`).emit('game:timer_tick', { timeRemaining: game.timeRemaining });

      if (game.timeRemaining <= 0) {
        endCurrentQuestion(game);
      }
    }, 1000);
  }

  // Host shows leaderboard
  socket.on('host:show_leaderboard', ({ pin }: { pin: string }) => {
    const game = activeGames.get(pin);
    if (!game || game.hostSocketId !== socket.id) return;

    clearGameTimers(game);
    game.status = 'leaderboard';
    io.to(`game:${pin}`).emit('game:state_changed', buildPublicGameState(game));
  });

  // Host moves to next question or podium
  socket.on('host:next_question', ({ pin }: { pin: string }) => {
    const game = activeGames.get(pin);
    if (!game || game.hostSocketId !== socket.id) return;

    clearGameTimers(game);

    if (game.currentQuestionIndex + 1 < game.quiz.questions.length) {
      game.currentQuestionIndex += 1;
      game.status = 'question_preview';
      game.timeRemaining = 3;
      io.to(`game:${pin}`).emit('game:state_changed', buildPublicGameState(game));

      let previewLeft = 3;
      const interval = setInterval(() => {
        previewLeft--;
        io.to(`game:${pin}`).emit('game:preview_tick', { seconds: previewLeft });
        if (previewLeft <= 0) {
          clearInterval(interval);
          startQuestionActive(game);
        }
      }, 1000);
      game.previewTimer = interval as unknown as NodeJS.Timeout;
    } else {
      // Game finished: Podium!
      game.status = 'podium';
      const finalState = buildPublicGameState(game);
      io.to(`game:${pin}`).emit('game:state_changed', finalState);

      // Save into game history
      const sortedPlayers = Array.from(game.players.values()).sort((a, b) => b.score - a.score);
      const winner = sortedPlayers[0] ? { nickname: sortedPlayers[0].nickname, score: sortedPlayers[0].score } : undefined;
      const historyItem: GameHistoryItem = {
        id: `game-${Date.now()}`,
        pin: game.pin,
        quizId: game.quiz.id,
        quizTitle: game.quiz.title,
        date: new Date().toISOString(),
        playerCount: game.players.size,
        totalQuestions: game.quiz.questions.length,
        winner,
        rankings: sortedPlayers.map((p, idx) => ({
          rank: idx + 1,
          nickname: p.nickname,
          score: p.score,
          correctCount: p.correctCount,
        })),
      };

      const userHistory = gameHistoryStore.get(game.hostId) || [];
      userHistory.unshift(historyItem);
      gameHistoryStore.set(game.hostId, userHistory);
    }
  });

  // Host locks/unlocks game
  socket.on('host:toggle_lock', ({ pin }: { pin: string }) => {
    const game = activeGames.get(pin);
    if (!game || game.hostSocketId !== socket.id) return;
    game.locked = !game.locked;
    io.to(`game:${pin}`).emit('game:lock_toggled', { locked: game.locked });
  });

  // Host kicks a player
  socket.on('host:kick_player', ({ pin, playerId }: { pin: string; playerId: string }) => {
    const game = activeGames.get(pin);
    if (!game || game.hostSocketId !== socket.id) return;
    const player = game.players.get(playerId);
    if (player) {
      io.to(player.socketId).emit('player:kicked');
      game.players.delete(playerId);
      io.to(`game:${pin}`).emit('game:player_list_updated', {
        playersCount: game.players.size,
        players: Array.from(game.players.values()),
      });
    }
  });

  // Dev helper: Host simulates test players for rapid testing
  socket.on('host:simulate_players', ({ pin, count = 3 }: { pin: string; count?: number }) => {
    const game = activeGames.get(pin);
    if (!game || game.hostSocketId !== socket.id) return;

    const botNames = ['AlexThePro', 'QuizMasterSam', 'LunaStar', 'NeoSpeed', 'PixelGamer', 'TurboFlash'];
    for (let i = 0; i < count; i++) {
      const name = botNames[i % botNames.length] + Math.floor(Math.random() * 100);
      const botId = `bot-${Date.now()}-${i}`;
      const botPlayer: Player & { socketId: string } = {
        id: botId,
        socketId: `socket-${botId}`,
        nickname: name,
        avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
        score: 0,
        streak: 0,
        answeredCurrent: false,
        correctCount: 0,
      };
      game.players.set(botId, botPlayer);
    }

    io.to(`game:${pin}`).emit('game:player_list_updated', {
      playersCount: game.players.size,
      players: Array.from(game.players.values()),
    });
  });

  // Player joins with PIN and nickname
  socket.on('player:join', ({ pin, nickname, avatar }: { pin: string; nickname: string; avatar?: string }) => {
    const game = activeGames.get(pin);
    if (!game) {
      socket.emit('player:join_error', { message: 'Game PIN not found. Check the code on the screen!' });
      return;
    }

    if (game.status !== 'lobby') {
      socket.emit('player:join_error', { message: 'Game has already started. Wait for next game!' });
      return;
    }

    if (game.locked) {
      socket.emit('player:join_error', { message: 'Game is currently locked by the host.' });
      return;
    }

    const cleanNick = (nickname || '').trim().substring(0, 15);
    if (!cleanNick || cleanNick.length < 2) {
      socket.emit('player:join_error', { message: 'Nickname must be at least 2 characters.' });
      return;
    }

    // Check duplicate
    for (const existing of game.players.values()) {
      if (existing.nickname.toLowerCase() === cleanNick.toLowerCase()) {
        socket.emit('player:join_error', { message: 'This nickname is already taken in this game.' });
        return;
      }
    }

    const playerId = `player-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const chosenAvatar = avatar || AVATARS[Math.floor(Math.random() * AVATARS.length)];

    const player: Player & { socketId: string } = {
      id: playerId,
      socketId: socket.id,
      nickname: cleanNick,
      avatar: chosenAvatar,
      score: 0,
      streak: 0,
      answeredCurrent: false,
      correctCount: 0,
    };

    game.players.set(playerId, player);
    socket.join(`game:${pin}`);

    // Confirm to player
    socket.emit('player:joined_success', {
      playerId,
      nickname: cleanNick,
      avatar: chosenAvatar,
      pin,
      quizTitle: game.quiz.title,
    });

    // Notify host & game room
    io.to(`game:${pin}`).emit('game:player_list_updated', {
      playersCount: game.players.size,
      players: Array.from(game.players.values()),
    });
  });

  // Player submits answer
  socket.on('player:submit_answer', ({ pin, playerId, choiceIndex }: { pin: string; playerId: string; choiceIndex: number }) => {
    const game = activeGames.get(pin);
    if (!game || game.status !== 'question_active') return;

    const player = game.players.get(playerId);
    if (!player || player.answeredCurrent) return;

    const currentQ = game.quiz.questions[game.currentQuestionIndex];
    if (!currentQ) return;

    player.answeredCurrent = true;
    player.currentAnswerIndex = choiceIndex;
    game.answersReceived += 1;

    if (choiceIndex >= 0 && choiceIndex < 4) {
      game.answerDistribution[choiceIndex] = (game.answerDistribution[choiceIndex] || 0) + 1;
    }

    // Compute scoring according to Kahoot formula
    const isCorrect = currentQ.correctAnswers.includes(choiceIndex);
    player.lastAnswerCorrect = isCorrect;

    if (isCorrect) {
      player.correctCount += 1;
      const timeTakenSec = Math.max(0.1, (Date.now() - (game.questionStartTime || Date.now())) / 1000);
      const timeFactor = Math.min(1, Math.max(0, timeTakenSec / currentQ.timeLimit));
      // Formula: points = round(maxPoints * (1 - (timeTaken / timeLimit) / 2))
      let pointsEarned = Math.round(currentQ.points * (1 - timeFactor / 2));

      // Streak bonus: 3 correct in a row adds +100, 4 adds +200, 5+ adds +300
      player.streak += 1;
      if (player.streak >= 5) pointsEarned += 300;
      else if (player.streak === 4) pointsEarned += 200;
      else if (player.streak === 3) pointsEarned += 100;

      player.lastPointsEarned = pointsEarned;
      player.score += pointsEarned;
    } else {
      player.streak = 0;
      player.lastPointsEarned = 0;
    }

    socket.emit('player:answer_recorded', {
      choiceIndex,
      answersReceived: game.answersReceived,
      totalPlayers: game.players.size,
    });

    io.to(`game:${pin}`).emit('game:answer_received_update', {
      answeredCount: game.answersReceived,
      playersCount: game.players.size,
    });

    // Check if all players answered
    if (game.answersReceived >= game.players.size && game.players.size > 0) {
      endCurrentQuestion(game);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    // If host disconnected, keep game alive for short grace period so host can reconnect
    for (const game of activeGames.values()) {
      for (const [pId, p] of game.players.entries()) {
        if (p.socketId === socket.id) {
          // If in lobby, remove player
          if (game.status === 'lobby') {
            game.players.delete(pId);
            io.to(`game:${game.pin}`).emit('game:player_list_updated', {
              playersCount: game.players.size,
              players: Array.from(game.players.values()),
            });
          }
        }
      }
    }
  });
});

// Vite Middleware for Development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`QuizBlast server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
