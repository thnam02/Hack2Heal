import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useXPStore } from '../stores/useXPStore';
import { Sparkles, TrendingUp } from 'lucide-react';

interface AuraBarProps {
  onAuraChange?: (intensity: number) => void;
}

// Get aura color based on level
const getAuraColor = (level: number): string => {
  const colors: Record<number, string> = {
    1: '#ff4b4b', // Red
    2: '#ffae42', // Orange
    3: '#4bff85', // Green
    4: '#42b4ff', // Blue
    5: '#b342ff', // Purple (Radiant)
  };
  return colors[level] || colors[5];
};

export function AuraBar({ onAuraChange }: AuraBarProps) {
  const { xp, level } = useXPStore();
  const [pulseIntensity, setPulseIntensity] = useState(0);
  const [justLeveledUp, setJustLeveledUp] = useState(false);
  
  // Calculate progress (0-200 XP for current level range)
  const xpInCurrentLevel = xp % 200;
  const fillPercentage = (xpInCurrentLevel / 200) * 100;
  
  const auraColor = getAuraColor(level);

  // Pulse animation based on XP
  useEffect(() => {
    if (xpInCurrentLevel < 50) {
      setPulseIntensity(0.3);
    } else if (xpInCurrentLevel >= 75) {
      setPulseIntensity(1.0);
    } else {
      setPulseIntensity(0.6);
    }
    
    onAuraChange?.(pulseIntensity);
  }, [xpInCurrentLevel, pulseIntensity, onAuraChange]);

  // Trigger level up ripple effect
  useEffect(() => {
    if (level > 1) {
      setJustLeveledUp(true);
      const timer = setTimeout(() => setJustLeveledUp(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [level]);

  return (
    <div className="space-y-3">
      {/* Level & XP Display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <motion.div
              animate={{
                scale: justLeveledUp ? [1, 1.2, 1] : 1,
              }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="flex items-center gap-2"
            >
              <Sparkles className="text-[#6F66FF]" size={20} />
              <div>
                <div className="text-2xl font-bold text-[#6F66FF]">
                  Level {level} {level === 5 && '🌟'}
                </div>
                <div className="text-xs text-gray-500">
                  {level === 5 ? 'Radiant' : `${xpInCurrentLevel}/200 XP`}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-gray-600">Total XP</div>
          <div className="text-xl font-bold text-[#6F66FF]">{xp}</div>
        </div>
      </div>

      {/* Horizontal XP Progress Bar */}
      <div className="relative h-6 bg-gray-200/50 rounded-full overflow-hidden backdrop-blur-sm">
        {/* XP Fill with Gradient */}
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: `linear-gradient(90deg, ${auraColor}, ${auraColor}dd)`,
            boxShadow: `0 0 ${15 + xpInCurrentLevel / 4}px ${auraColor}80`,
          }}
          initial={{ width: 0 }}
          animate={{ 
            width: `${fillPercentage}%`,
            boxShadow: `0 0 ${15 + xpInCurrentLevel / 4}px ${auraColor}80`,
          }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />

        {/* Pulse Effect */}
        <AnimatePresence>
          {pulseIntensity > 0 && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: `linear-gradient(90deg, ${auraColor}40, ${auraColor}20)`,
                boxShadow: `0 0 ${pulseIntensity * 30}px ${auraColor}60`,
              }}
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ 
                scaleX: [0, fillPercentage / 100, fillPercentage / 100],
                opacity: [0.3, 0.6, 0.3],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}
        </AnimatePresence>

        {/* Level Up Ripple Effect */}
        <AnimatePresence>
          {justLeveledUp && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: `radial-gradient(circle, ${auraColor}40, transparent 70%)`,
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: [0, 1, 0],
                scale: [0.8, 1.4, 1.4],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          )}
        </AnimatePresence>

        {/* XP Text Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-semibold text-white drop-shadow-md">
            {Math.round(fillPercentage)}%
          </span>
        </div>
      </div>

      {/* Encouragement Message */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <TrendingUp size={14} />
        <span>
          {fillPercentage >= 75 
            ? 'Almost there! Keep going! 💪' 
            : fillPercentage >= 50
            ? 'You\'re making great progress! 🌱'
            : 'Every session builds your strength ✨'}
        </span>
      </div>
    </div>
  );
}
