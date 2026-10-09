import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import type { Quiz } from '../src/types/quiz';

export interface StoredUser {
  id: string;
  email: string;
  display_name: string;
  password_hash: string;
  password_salt: string;
  created_at: string;
}

const dataDirectory = path.resolve(process.env.QUIZBLAST_DATA_DIR || '.data');
fs.mkdirSync(dataDirectory, { recursive: true });

const database = new Database(path.join(dataDirectory, 'quizblast.sqlite'));
database.pragma('journal_mode = WAL');
database.pragma('foreign_keys = ON');
database.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL COLLATE NOCASE UNIQUE,
    display_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS quizzes (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    cover_image TEXT NOT NULL,
    questions_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS auth_sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL
  );
`);
database.prepare('DELETE FROM auth_sessions WHERE expires_at <= ?').run(new Date().toISOString());

const insertUser = database.prepare(`
  INSERT INTO users (id, email, display_name, password_hash, password_salt, created_at)
  VALUES (@id, @email, @display_name, @password_hash, @password_salt, @created_at)
  ON CONFLICT(email) DO NOTHING
`);

const insertQuiz = database.prepare(`
  INSERT INTO quizzes (id, owner_id, title, description, cover_image, questions_json, created_at, updated_at)
  VALUES (@id, @owner_id, @title, @description, @cover_image, @questions_json, @created_at, @updated_at)
`);

const serializeQuiz = (quiz: Quiz) => ({
  id: quiz.id,
  owner_id: quiz.owner_id,
  title: quiz.title,
  description: quiz.description,
  cover_image: quiz.coverImage || '',
  questions_json: JSON.stringify(quiz.questions),
  created_at: quiz.created_at,
  updated_at: quiz.updated_at,
});

const hydrateQuiz = (row: {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  cover_image: string;
  questions_json: string;
  created_at: string;
  updated_at: string;
}): Quiz => ({
  id: row.id,
  owner_id: row.owner_id,
  title: row.title,
  description: row.description,
  coverImage: row.cover_image,
  questions: JSON.parse(row.questions_json) as Quiz['questions'],
  created_at: row.created_at,
  updated_at: row.updated_at,
});

export const storage = {
  createAccount(user: StoredUser, quizzes: Quiz[]): boolean {
    return database.transaction(() => {
      if (insertUser.run(user).changes === 0) return false;
      for (const quiz of quizzes) {
        insertQuiz.run(serializeQuiz(quiz));
      }
      return true;
    })();
  },

  getUserByEmail(email: string): StoredUser | undefined {
    return database.prepare('SELECT * FROM users WHERE email = ?').get(email) as StoredUser | undefined;
  },

  getUserById(id: string): StoredUser | undefined {
    return database.prepare('SELECT * FROM users WHERE id = ?').get(id) as StoredUser | undefined;
  },

  updateProfile(id: string, displayName: string): void {
    database.prepare('UPDATE users SET display_name = ? WHERE id = ?').run(displayName, id);
  },

  updatePassword(id: string, hash: string, salt: string): void {
    database.prepare('UPDATE users SET password_hash = ?, password_salt = ? WHERE id = ?').run(hash, salt, id);
  },

  deleteUser(id: string): void {
    database.prepare('DELETE FROM users WHERE id = ?').run(id);
  },

  createSession(tokenHash: string, userId: string, expiresAt: string): void {
    database.prepare('INSERT INTO auth_sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').run(
      tokenHash,
      userId,
      expiresAt,
    );
  },

  getSessionUserId(tokenHash: string, now: string): string | undefined {
    const row = database
      .prepare('SELECT user_id FROM auth_sessions WHERE token_hash = ? AND expires_at > ?')
      .get(tokenHash, now) as { user_id: string } | undefined;
    if (!row) return undefined;
    return row.user_id;
  },

  deleteSession(tokenHash: string): void {
    database.prepare('DELETE FROM auth_sessions WHERE token_hash = ?').run(tokenHash);
  },

  listQuizzes(ownerId: string): Quiz[] {
    const rows = database
      .prepare('SELECT * FROM quizzes WHERE owner_id = ? ORDER BY updated_at DESC')
      .all(ownerId) as Parameters<typeof hydrateQuiz>[0][];
    return rows.map(hydrateQuiz);
  },

  getQuiz(id: string): Quiz | undefined {
    const row = database.prepare('SELECT * FROM quizzes WHERE id = ?').get(id) as
      | Parameters<typeof hydrateQuiz>[0]
      | undefined;
    return row ? hydrateQuiz(row) : undefined;
  },

  saveQuiz(quiz: Quiz): void {
    database
      .prepare(`
        INSERT INTO quizzes (id, owner_id, title, description, cover_image, questions_json, created_at, updated_at)
        VALUES (@id, @owner_id, @title, @description, @cover_image, @questions_json, @created_at, @updated_at)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          description = excluded.description,
          cover_image = excluded.cover_image,
          questions_json = excluded.questions_json,
          updated_at = excluded.updated_at
      `)
      .run(serializeQuiz(quiz));
  },

  deleteQuiz(id: string): void {
    database.prepare('DELETE FROM quizzes WHERE id = ?').run(id);
  },
};
