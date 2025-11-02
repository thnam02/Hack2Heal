import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useXPStore } from '../stores/useXPStore';
import { useStats } from '../contexts/StatsContext';

export interface Quest {
  id: string;
  title: string;
  total: number;
  rewardXP: number;
  progress: number;
  status?: 'active' | 'completed';
}

interface UseQuestProgressProps {
  quests: Quest[];
  onAuraPulse?: () => void;
}

export function useQuestProgress({ quests, onAuraPulse }: UseQuestProgressProps) {
  const { addXP: addXPLocal, xp, setXP } = useXPStore();
  const { addXP: addXPBackend, stats } = useStats();
  const completedQuestsRef = useRef<Set<string>>(new Set());

  const completeQuest = async (questId: string) => {
    const quest = quests.find(q => q.id === questId);
    if (!quest) return;

    // Prevent duplicate completions
    if (completedQuestsRef.current.has(questId)) return;

    if (quest.progress >= quest.total && quest.status !== 'completed') {
      // Mark as completed
      quest.status = 'completed';
      completedQuestsRef.current.add(questId);
      
      // Get current level before adding XP
      const currentLevel = useXPStore.getState().level;
      const currentXP = stats?.totalXp || useXPStore.getState().xp;
      
      try {
        // Add XP to backend first - this will update stats.totalXp in StatsContext
        await addXPBackend(quest.rewardXP);
        
        // Sync local store with backend XP
        // Since addXPBackend updates stats in StatsContext, we'll get the new value
        // But we need to wait for stats to update, so we calculate it
        const newXP = currentXP + quest.rewardXP;
        setXP(newXP);
        
        // Check if leveled up
        const newLevel = useXPStore.getState().level;
        const leveledUp = newLevel > currentLevel;
        
        // Show toast with encouraging message
        toast.success(
          `✅ ${quest.title} complete! +${quest.rewardXP} XP 🌟`,
          {
            duration: 3000,
            description: 'Your EchoBody glows brighter!',
          }
        );
        
        // Level up toast
        if (leveledUp) {
          toast.success(
            `🎉 Level Up! You're now Level ${newLevel}!`,
            {
              duration: 4000,
            }
          );
        }
      } catch (error) {
        // Fallback: add locally if backend fails
        const leveledUp = addXPLocal(quest.rewardXP);
        
        toast.success(
          `✅ ${quest.title} complete! +${quest.rewardXP} XP 🌟`,
          {
            duration: 3000,
          }
        );
        
        if (leveledUp) {
          const { level } = useXPStore.getState();
          toast.success(
            `🎉 Level Up! You're now Level ${level}!`,
            {
              duration: 4000,
            }
          );
        }
      }
      
      // Trigger aura pulse
      onAuraPulse?.();
    }
  };

  // Auto-complete quests when they reach target
  useEffect(() => {
    quests.forEach(quest => {
      if (quest.progress >= quest.total && quest.status !== 'completed' && !completedQuestsRef.current.has(quest.id)) {
        // Small delay for better UX
        setTimeout(() => {
          completeQuest(quest.id);
        }, 500);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quests]);

  // Show toast on XP gain (triggered from outside)
  const showXPToast = (amount: number) => {
    toast.success(`+${amount} XP`, {
      duration: 2000,
    });
  };

  return { completeQuest, xp, showXPToast };
}

