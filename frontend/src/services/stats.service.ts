import api from './api';

export interface UserStats {
  id: number;
  userId: number;
  totalXp: number;
  currentStreak: number;
  lastCompletedDate: string | null;
  sessionsCompleted: number;
  questProgress: Record<string, { progress: number; total: number }>;
  createdAt: string;
  updatedAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: number;
  name: string;
  email: string;
  xp: number;
  streak: number;
  sessionsCompleted: number;
  level: number;
}

export const statsService = {
  async completeSession(): Promise<UserStats> {
    const response = await api.post<UserStats>('/stats/complete-session');
    return response.data;
  },

  async getStats(): Promise<UserStats> {
    const response = await api.get<UserStats>('/stats/me');
    return response.data;
  },

  async getLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
    const response = await api.get<LeaderboardEntry[]>('/stats/leaderboard', {
      params: { limit },
    });
    return response.data;
  },

  async addXP(amount: number): Promise<UserStats> {
    const response = await api.post<UserStats>('/stats/add-xp', { amount });
    return response.data;
  },
};

