import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CheckCircle2, Target, Trophy } from 'lucide-react';
import { Quest } from '../hooks/useQuestProgress';
import { motion, AnimatePresence } from 'framer-motion';

interface QuestListProps {
  quests: Quest[];
  onCompleteQuest: (questId: string) => void;
}

// Get gradient border class based on XP reward tier
const getQuestBorderClass = (rewardXP: number): string => {
  if (rewardXP < 20) {
    return 'border-green-400/50 bg-green-400/5'; // Small - green
  } else if (rewardXP < 50) {
    return 'border-blue-400/50 bg-blue-400/5'; // Medium - blue
  } else {
    return 'border-orange-400/50 bg-orange-400/5'; // Large - orange/pink
  }
};

// Get gradient for progress bar
const getProgressGradient = (rewardXP: number): string => {
  if (rewardXP < 20) {
    return 'from-green-400 to-emerald-500';
  } else if (rewardXP < 50) {
    return 'from-indigo-400 to-violet-500';
  } else {
    return 'from-pink-400 to-orange-500';
  }
};

// Get XP badge color
const getXPBadgeClass = (rewardXP: number): string => {
  if (rewardXP < 20) {
    return 'bg-green-500/20 text-green-300 border-green-400/30';
  } else if (rewardXP < 50) {
    return 'bg-blue-500/20 text-blue-300 border-blue-400/30';
  } else {
    return 'bg-orange-500/20 text-orange-300 border-orange-400/30';
  }
};

export function QuestList({ quests, onCompleteQuest }: QuestListProps) {
  const activeQuests = quests.filter(q => q.status !== 'completed');

  if (activeQuests.length === 0) {
    return (
      <Card className="border-0 shadow-lg bg-white/10 backdrop-blur-lg">
        <CardContent className="p-6 text-center text-gray-400">
          <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No active quests</p>
          <p className="text-xs mt-2 text-gray-500">Keep healing strong! 💪</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg bg-white/10 backdrop-blur-lg">
      <CardHeader>
        <CardTitle className="text-[#6F66FF] flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Keep Healing Strong 💪
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <AnimatePresence>
          {activeQuests.map((quest, index) => {
            const progressPercent = (quest.progress / quest.total) * 100;
            const canComplete = quest.progress >= quest.total;

            return (
              <motion.div
                key={quest.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-xl border-2 transition-all backdrop-blur-sm ${getQuestBorderClass(quest.rewardXP)} ${
                  canComplete ? 'ring-2 ring-[#6F66FF] ring-opacity-50' : ''
                }`}
                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              >
                <div className="flex items-start gap-3">
                  <motion.div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      canComplete
                        ? 'bg-gradient-to-br from-[#6F66FF] to-[#8C7BFF]'
                        : 'bg-gradient-to-br from-gray-400 to-gray-500'
                    }`}
                    animate={canComplete ? {
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0],
                    } : {}}
                    transition={{ duration: 0.5 }}
                  >
                    {canComplete ? (
                      <Trophy className="w-5 h-5 text-white" />
                    ) : (
                      <Target className="w-5 h-5 text-white" />
                    )}
                  </motion.div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2 gap-2">
                      <h4 className="text-[#2C2E6F] font-semibold text-sm leading-tight">
                        {quest.title}
                      </h4>
                      <Badge className={`rounded-full px-2 py-0.5 text-xs font-semibold border ${getXPBadgeClass(quest.rewardXP)}`}>
                        +{quest.rewardXP} XP
                      </Badge>
                    </div>

                    <div className="space-y-1 mb-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">
                          {quest.progress} / {quest.total}
                        </span>
                        <span className="text-[#6F66FF] font-semibold">
                          {Math.round(progressPercent)}%
                        </span>
                      </div>
                      <div className="relative h-2 bg-gray-200/30 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full bg-gradient-to-r ${getProgressGradient(quest.rewardXP)}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercent}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                      </div>
                    </div>

                    {canComplete && (
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        <Button
                          onClick={() => onCompleteQuest(quest.id)}
                          className="w-full bg-gradient-to-r from-[#6F66FF] to-[#8C7BFF] hover:opacity-90 text-white"
                          size="sm"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Claim Your Reward
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
