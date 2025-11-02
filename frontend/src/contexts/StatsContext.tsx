import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { statsService, UserStats, LeaderboardEntry } from '../services/stats.service';
import { useAuth } from './AuthContext';

interface StatsContextType {
  stats: UserStats | null;
  leaderboard: LeaderboardEntry[];
  isLoading: boolean;
  refreshStats: () => Promise<void>;
  refreshLeaderboard: () => Promise<void>;
  completeSession: () => Promise<void>;
  addXP: (amount: number) => Promise<void>;
}

const StatsContext = createContext<StatsContextType | undefined>(undefined);

export const useStats = () => {
  const context = useContext(StatsContext);
  if (context === undefined) {
    throw new Error('useStats must be used within a StatsProvider');
  }
  return context;
};

interface StatsProviderProps {
  children: ReactNode;
}

export const StatsProvider: React.FC<StatsProviderProps> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshStats = async () => {
    if (!isAuthenticated || !user) return;
    try {
      const userStats = await statsService.getStats();
      setStats(userStats);
    } catch (error: unknown) {
      // Keep existing stats if backend is unavailable
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _err = error;
    }
  };

  const refreshLeaderboard = async () => {
    if (!isAuthenticated) return;
    try {
      const leaderboardData = await statsService.getLeaderboard(10);
      setLeaderboard(leaderboardData);
    } catch (error: unknown) {
      // Keep existing leaderboard if backend is unavailable
    }
  };

  const completeSession = async () => {
    if (!isAuthenticated || !user) return;
    try {
      const updatedStats = await statsService.completeSession();
      setStats(updatedStats);
      // Refresh leaderboard after completing session
      await refreshLeaderboard();
    } catch (error: unknown) {
      // Still continue - session completion is tracked locally
    }
  };

  const addXP = async (amount: number) => {
    if (!isAuthenticated || !user) return;
    try {
      const updatedStats = await statsService.addXP(amount);
      setStats(updatedStats);
      // Refresh leaderboard after adding XP
      await refreshLeaderboard();
    } catch (error: unknown) {
      // Still continue - XP can be tracked locally as fallback
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      setIsLoading(true);
      Promise.all([refreshStats(), refreshLeaderboard()])
        .finally(() => setIsLoading(false));
    } else {
      setStats(null);
      setLeaderboard([]);
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id]);

  return (
    <StatsContext.Provider
      value={{
        stats,
        leaderboard,
        isLoading,
        refreshStats,
        refreshLeaderboard,
        completeSession,
        addXP,
      }}
    >
      {children}
    </StatsContext.Provider>
  );
};

