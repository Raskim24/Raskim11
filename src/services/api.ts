import { Quiz, GameHistoryItem, Question } from '../types/quiz';

const TOKEN_KEY = 'quizblast_auth_token';
const USER_KEY = 'quizblast_auth_user';

export interface AuthUser {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
}

export const api = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setAuth(token: string, user: AuthUser) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  getUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(endpoint, {
      ...options,
      headers,
    });

    if (!res.ok) {
      let errorMsg = 'An error occurred';
      try {
        const data = await res.json();
        errorMsg = data.error || errorMsg;
      } catch {
        errorMsg = res.statusText || errorMsg;
      }
      throw new Error(errorMsg);
    }

    return res.json();
  },

  // Auth methods
  async signup(display_name: string, email: string, password: string, confirm_password: string) {
    const data = await this.request<{ token: string; user: AuthUser }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ display_name, email, password, confirm_password }),
    });
    this.setAuth(data.token, data.user);
    return data.user;
  },

  async login(email: string, password: string) {
    const data = await this.request<{ token: string; user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setAuth(data.token, data.user);
    return data.user;
  },

  async logout(): Promise<void> {
    try {
      await this.request<{ success: boolean }>('/api/auth/logout', { method: 'POST' });
    } finally {
      this.clearAuth();
    }
  },

  async getMe(): Promise<AuthUser | null> {
    try {
      const data = await this.request<{ user: AuthUser }>('/api/auth/me');
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      return data.user;
    } catch {
      return null;
    }
  },

  async forgotPassword(email: string) {
    return this.request<{ message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(newPassword: string) {
    return this.request<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });
  },

  async updateProfile(display_name: string) {
    const data = await this.request<{ success: boolean; user: AuthUser }>('/api/auth/update-profile', {
      method: 'POST',
      body: JSON.stringify({ display_name }),
    });
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data.user;
  },

  async updatePassword(current_password: string, new_password: string) {
    return this.request<{ success: boolean; message: string }>('/api/auth/update-password', {
      method: 'POST',
      body: JSON.stringify({ current_password, new_password }),
    });
  },

  async deleteAccount(confirmation: string) {
    const res = await this.request<{ success: boolean }>('/api/auth/delete-account', {
      method: 'POST',
      body: JSON.stringify({ confirmation }),
    });
    this.clearAuth();
    return res;
  },

  // Quizzes methods
  async getQuizzes(): Promise<Quiz[]> {
    return this.request<Quiz[]>('/api/quizzes');
  },

  async getQuiz(id: string): Promise<Quiz> {
    return this.request<Quiz>(`/api/quizzes/${id}`);
  },

  async createQuiz(quiz: Partial<Quiz>): Promise<Quiz> {
    return this.request<Quiz>('/api/quizzes', {
      method: 'POST',
      body: JSON.stringify(quiz),
    });
  },

  async updateQuiz(id: string, quiz: Partial<Quiz>): Promise<Quiz> {
    return this.request<Quiz>(`/api/quizzes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(quiz),
    });
  },

  async duplicateQuiz(id: string): Promise<Quiz> {
    return this.request<Quiz>(`/api/quizzes/${id}/duplicate`, {
      method: 'POST',
    });
  },

  async deleteQuiz(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/quizzes/${id}`, {
      method: 'DELETE',
    });
  },

  // Game History
  async getHistory(): Promise<GameHistoryItem[]> {
    return this.request<GameHistoryItem[]>('/api/history');
  },

  // AI Quiz Generator
  async generateAIQuiz(params: {
    topic: string;
    gradeLevel: string;
    numQuestions: number;
    difficulty: string;
  }): Promise<{ questions: Question[] }> {
    return this.request<{ questions: Question[] }>('/api/ai/generate-quiz', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },
};
