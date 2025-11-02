import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface XPState {
  xp: number;
  level: number;
  addXP: (amount: number) => boolean; // Returns true if leveled up
  setXP: (xp: number) => void; // Sync XP from backend
  reset: () => void;
}

// Calculate level based on XP thresholds
const calculateLevel = (xp: number): number => {
  if (xp < 200) return 1;
  if (xp < 400) return 2;
  if (xp < 700) return 3;
  if (xp < 1000) return 4;
  return 5; // Radiant
};

export const useXPStore = create<XPState>()(
  persist(
    (set, get) => ({
      xp: 0,
      level: 1,
      
      addXP: (amount: number) => {
        const currentXP = get().xp;
        const currentLevel = get().level;
        const newXP = currentXP + amount;
        const newLevel = calculateLevel(newXP);
        
        const leveledUp = newLevel > currentLevel;
        
        set({ xp: newXP, level: newLevel });
        
        // Return whether leveled up for toast notification
        return leveledUp;
      },
      
      setXP: (xp: number) => {
        const newLevel = calculateLevel(xp);
        set({ xp, level: newLevel });
      },
      
      reset: () => set({ xp: 0, level: 1 }),
    }),
    {
      name: 'xp-storage',
    }
  )
);

