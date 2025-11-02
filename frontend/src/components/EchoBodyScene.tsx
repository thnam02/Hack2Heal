import React, { useState, useRef, Suspense, forwardRef, useImperativeHandle, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Environment, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Slider } from './ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Sparkles, RotateCw, RotateCcw, ChevronUp, ChevronDown, MoveUp, MoveDown, Brain } from 'lucide-react';
import { AuraBar } from './AuraBar';
import { QuestList } from './QuestList';
import { useQuestProgress, Quest } from '../hooks/useQuestProgress';
import { useStats } from '../contexts/StatsContext';
import { useXPStore } from '../stores/useXPStore';
import { motion, AnimatePresence } from 'framer-motion';

// Type definitions
interface AvatarProps {
  animationName?: string;
}

// Mood color mapping function
const getMoodColor = (mood: number): THREE.Color => {
  // mood range: -1 (sad/tired) to +1 (happy/energetic)
  // Blue/purple for negative, warm colors for positive
  if (mood < 0) {
    // Interpolate from blue to purple as mood goes from -1 to 0
    const t = (mood + 1); // 0 to 1
    return new THREE.Color().lerpColors(
      new THREE.Color(0x1e40af), // Blue
      new THREE.Color(0x6f66ff), // Purple
      t
    );
  } else {
    // Interpolate from purple to yellow/orange as mood goes from 0 to +1
    const t = mood; // 0 to 1
    return new THREE.Color().lerpColors(
      new THREE.Color(0x6f66ff), // Purple
      new THREE.Color(0xfbbf24), // Amber/Yellow
      t
    );
  }
};

// Get emotional gradient class based on mood
const getMoodGradient = (mood: number): string => {
  if (mood < -0.3) {
    return 'from-blue-500 to-cyan-400'; // Calm
  } else if (mood < 0.3) {
    return 'from-indigo-500 to-violet-600'; // Neutral
  } else {
    return 'from-pink-500 to-orange-400'; // Energized
  }
};

// Get aura color based on XP level
const getAuraColor = (level: number): string => {
  const colors: Record<number, string> = {
    1: '#ff4b4b',
    2: '#ffae42',
    3: '#4bff85',
    4: '#42b4ff',
    5: '#b342ff',
  };
  return colors[level] || colors[5];
};

// Avatar component
function Avatar({ animationName = 'Idle Breathing' }: AvatarProps) {
  const groupRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  
  // Load the GLB model
  const gltf = useGLTF('/models/avatar3.glb');
  const scene = gltf.scene;
  const animations = gltf.animations || [];

  // Don't modify materials at all - let GLB materials render as-is
  React.useEffect(() => {
    if (!scene) return;

    // Only log material info for debugging - don't modify
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        
        // Just check if material exists - don't modify it
      }
    });
  }, [scene]);

  // Set up animation mixer
  React.useEffect(() => {
    if (!animations || animations.length === 0) {
      return;
    }
    if (!scene) {
      return;
    }

    // Clean up old mixer
    if (mixerRef.current) {
      mixerRef.current.stopAllAction();
      mixerRef.current = null;
    }

    // Create mixer targeting the scene directly
    // Important: The mixer needs to target the same object that's rendered
    mixerRef.current = new THREE.AnimationMixer(scene);
    
    // Find the animation by name (case-insensitive)
    
    const animation = animations.find((anim) => {
      const animNameLower = anim.name.toLowerCase();
      const targetNameLower = animationName.toLowerCase();
      return animNameLower.includes(targetNameLower) || targetNameLower.includes(animNameLower);
    });

    // Fallback to first animation if exact match not found
    const animToPlay = animation || animations[0];
    
    if (animToPlay && mixerRef.current) {
      const action = mixerRef.current.clipAction(animToPlay);
      if (action) {
        action.reset();
        action.setLoop(THREE.LoopRepeat, Infinity);
        action.play();
      }
    }
  }, [animations, animationName, scene]);

  // Animate - update mixer every frame
  useFrame((_, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
  });

  // Auto-scale and center the model
  React.useEffect(() => {
    if (!scene) return;

    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // Target height
    const targetHeight = 11;
    const scale = Math.min(targetHeight / size.y, 2.0);
    const clampedScale = Math.max(0.01, Math.min(scale, 2.0));

    scene.scale.setScalar(clampedScale);

    // Center the model
    const scaledCenter = center.multiplyScalar(clampedScale);
    scene.position.x = -scaledCenter.x;
    scene.position.y = -scaledCenter.y + 1.5;
    scene.position.z = -scaledCenter.z;
  }, [scene]);

  // Use the scene directly - don't clone as it breaks animations
  if (!scene) return null;

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

// Background color component - updates scene background
function MoodBackground({ mood }: { mood: number }) {
  const { scene } = useThree();
  
  useFrame(() => {
    // Use theme purple color with subtle mood influence
    const baseColor = new THREE.Color(0x6F66FF);
    const moodColor = getMoodColor(mood);
    
    // Blend base purple with mood color (20% mood influence)
    const targetColor = baseColor.clone().lerp(moodColor, 0.2);
    
    if (scene.background instanceof THREE.Color) {
      scene.background.lerp(targetColor, 0.05);
    } else {
      scene.background = targetColor.clone();
    }
  });

  return null;
}

// Camera Controls Component
interface CameraControlsRef {
  rotateLeft: () => void;
  rotateRight: () => void;
  rotateUp: () => void;
  rotateDown: () => void;
  moveCameraUp: () => void;
  moveCameraDown: () => void;
  resetCamera: () => void;
}

const CameraControls = forwardRef<CameraControlsRef>((_, ref) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const targetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 4.5, 0));
  const initialCameraPosition = useRef<THREE.Vector3>(new THREE.Vector3(0, 6, 10));

  useImperativeHandle(ref, () => ({
    rotateLeft: () => {
      if (controlsRef.current) {
        controlsRef.current.setAzimuthalAngle((controlsRef.current.getAzimuthalAngle() || 0) - Math.PI / 12);
      }
    },
    rotateRight: () => {
      if (controlsRef.current) {
        controlsRef.current.setAzimuthalAngle((controlsRef.current.getAzimuthalAngle() || 0) + Math.PI / 12);
      }
    },
    rotateUp: () => {
      if (controlsRef.current) {
        controlsRef.current.setPolarAngle((controlsRef.current.getPolarAngle() || Math.PI / 2) - Math.PI / 12);
      }
    },
    rotateDown: () => {
      if (controlsRef.current) {
        controlsRef.current.setPolarAngle((controlsRef.current.getPolarAngle() || Math.PI / 2) + Math.PI / 12);
      }
    },
    moveCameraUp: () => {
      camera.position.y += 0.5;
      targetRef.current.y += 0.5;
      if (controlsRef.current) {
        controlsRef.current.target.copy(targetRef.current);
      }
    },
    moveCameraDown: () => {
      camera.position.y -= 0.5;
      targetRef.current.y -= 0.5;
      if (controlsRef.current) {
        controlsRef.current.target.copy(targetRef.current);
      }
    },
    resetCamera: () => {
      camera.position.copy(initialCameraPosition.current);
      targetRef.current.set(0, 4.5, 0);
      if (controlsRef.current) {
        controlsRef.current.target.copy(targetRef.current);
      }
    },
  }));

  // Set initial position
  useEffect(() => {
    camera.position.copy(initialCameraPosition.current);
    if (controlsRef.current) {
      controlsRef.current.target.copy(targetRef.current);
    }
  }, [camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={4}
      maxDistance={25}
      autoRotate={false}
      target={targetRef.current}
    />
  );
});

CameraControls.displayName = 'CameraControls';

// Floating Particles Component
function FloatingParticles({ count = 15 }: { count?: number }) {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 3 + Math.random() * 2,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-2 h-2 rounded-full bg-white/30 blur-sm"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.sin(particle.id) * 20, 0],
            opacity: [0.3, 0.8, 0.3],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// Main scene component
export function EchoBodyScene() {
  const controlsRef = useRef<CameraControlsRef>(null);
  const [mood, setMood] = useState<number>(0); // Default neutral mood
  const { stats } = useStats();
  const auraPulseRef = useRef<() => void>(null);
  const { setXP, xp, level } = useXPStore();
  const [showLevelUpRipple, setShowLevelUpRipple] = useState(false);

  // Sync XP store with backend stats when stats are loaded or updated
  useEffect(() => {
    if (stats?.totalXp !== undefined) {
      const currentStoreXP = useXPStore.getState().xp;
      // Only sync if backend XP is different (to avoid unnecessary updates)
      if (Math.abs(currentStoreXP - stats.totalXp) > 0.1) {
        const wasLevel = useXPStore.getState().level;
        setXP(stats.totalXp);
        const newLevel = useXPStore.getState().level;
        if (newLevel > wasLevel) {
          setShowLevelUpRipple(true);
          setTimeout(() => setShowLevelUpRipple(false), 1000);
        }
      }
    }
  }, [stats?.totalXp, setXP]);

  // Build quests from stats
  const questDefinitions: Quest[] = [
    { 
      id: 'complete_3_sessions_week', 
      title: 'Complete 3 sessions this week', 
      total: 3, 
      rewardXP: 50,
      progress: stats?.questProgress?.['complete_3_sessions_week']?.progress || 0,
    },
    { 
      id: 'perfect_form_x3', 
      title: 'Perfect Form x3', 
      total: 3, 
      rewardXP: 10,
      progress: stats?.questProgress?.['perfect_form_x3']?.progress || 0,
    },
    { 
      id: 'maintain_7_day_streak', 
      title: 'Maintain 7-day streak', 
      total: 7, 
      rewardXP: 100,
      progress: Math.min(stats?.currentStreak || 0, 7),
    },
    { 
      id: 'complete_full_exercise_plan', 
      title: 'Complete full exercise plan', 
      total: 10, 
      rewardXP: 75,
      progress: stats?.questProgress?.['complete_full_exercise_plan']?.progress || 0,
    },
  ];

  const { completeQuest } = useQuestProgress({
    quests: questDefinitions,
    onAuraPulse: () => {
      // Trigger aura pulse animation
      auraPulseRef.current?.();
    },
  });
  
  // Determine animation based on mood
  const getAnimationName = (moodValue: number): string => {
    if (moodValue < -0.5) {
      return 'TiredIdle';
    } else if (moodValue > 0.5) {
      return 'VictoryPose';
    }
    return 'Idle Breathing';
  };

  const currentAnimation = getAnimationName(mood);
  const moodGradient = getMoodGradient(mood);
  const auraColor = getAuraColor(level);

  return (
    <div className="w-full min-h-screen relative overflow-hidden" style={{ height: 'calc(100vh - 8rem)' }}>
      {/* Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${moodGradient} opacity-20`} />
      
      {/* Floating Particles */}
      <FloatingParticles count={20} />

      <div className="relative z-10 flex gap-6 h-full p-6">
        {/* Left Panel - Emotional Controls */}
        <motion.div 
          className="w-56 flex-shrink-0"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-white/95 backdrop-blur-lg shadow-xl border-2 border-[#6F66FF]/30 h-fit" style={{
            boxShadow: `0 0 30px ${auraColor}30`,
          }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#2C2E6F] font-semibold">
                <Brain className="text-[#6F66FF]" size={20} />
                Emotional & Camera Controls 🧠
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="emotional-state-slider" className="text-sm text-[#2C2E6F] font-medium mb-2 block">
                  Your Emotional State: {mood.toFixed(2)}
                </label>
                <div className="mb-1 text-xs text-[#6F66FF] font-semibold">
                  {mood < -0.5 ? '😴 Calm & Resting' : mood > 0.5 ? '⚡ Energized & Strong' : '😊 Balanced & Ready'}
                </div>
                <Slider
                  id="emotional-state-slider"
                  name="emotionalState"
                  value={[mood]}
                  onValueChange={(value) => setMood(value[0])}
                  min={-1}
                  max={1}
                  step={0.01}
                  className="w-full"
                  aria-label="Your Emotional State"
                />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>Calm</span>
                  <span>Neutral</span>
                  <span>Energized</span>
                </div>
              </div>
              <div className="text-xs text-gray-700 mb-4 p-2 bg-[#6F66FF]/10 rounded-lg border border-[#6F66FF]/20">
                Animation: <span className="font-semibold text-[#6F66FF]">{currentAnimation}</span>
              </div>
              
              {/* Camera Controls */}
              <div className="space-y-3 pt-4 border-t border-gray-300">
                <label className="text-sm font-semibold text-[#2C2E6F] block">
                  Camera View
                </label>
                
                {/* Rotation Controls */}
                <div className="space-y-2">
                  <div className="text-xs text-gray-600 mb-1 font-medium">Rotation</div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => controlsRef.current?.rotateLeft()}
                      className="flex items-center justify-center gap-2 bg-white border-gray-300 text-[#2C2E6F] hover:bg-[#6F66FF]/10 hover:border-[#6F66FF]"
                    >
                      <RotateCcw size={16} />
                      Left
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => controlsRef.current?.rotateRight()}
                      className="flex items-center justify-center gap-2 bg-white border-gray-300 text-[#2C2E6F] hover:bg-[#6F66FF]/10 hover:border-[#6F66FF]"
                    >
                      <RotateCw size={16} />
                      Right
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => controlsRef.current?.rotateUp()}
                      className="flex items-center justify-center gap-2 bg-white border-gray-300 text-[#2C2E6F] hover:bg-[#6F66FF]/10 hover:border-[#6F66FF]"
                    >
                      <ChevronUp size={16} />
                      Up
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => controlsRef.current?.rotateDown()}
                      className="flex items-center justify-center gap-2 bg-white border-gray-300 text-[#2C2E6F] hover:bg-[#6F66FF]/10 hover:border-[#6F66FF]"
                    >
                      <ChevronDown size={16} />
                      Down
                    </Button>
                  </div>
                </div>
                
                {/* Camera Position Controls */}
                <div className="space-y-2">
                  <div className="text-xs text-gray-600 mb-1 font-medium">Position</div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => controlsRef.current?.moveCameraUp()}
                      className="flex items-center justify-center gap-2 bg-white border-gray-300 text-[#2C2E6F] hover:bg-[#6F66FF]/10 hover:border-[#6F66FF]"
                    >
                      <MoveUp size={16} />
                      Up
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => controlsRef.current?.moveCameraDown()}
                      className="flex items-center justify-center gap-2 bg-white border-gray-300 text-[#2C2E6F] hover:bg-[#6F66FF]/10 hover:border-[#6F66FF]"
                    >
                      <MoveDown size={16} />
                      Down
                    </Button>
                  </div>
                </div>
                
                {/* Reset Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => controlsRef.current?.resetCamera()}
                  className="w-full mt-2 bg-white border-gray-300 text-[#2C2E6F] hover:bg-[#6F66FF]/10 hover:border-[#6F66FF]"
                >
                  Reset View
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Center Stage - EchoBody Avatar */}
        <div className="flex-1 relative flex items-center justify-center" style={{ height: 'calc(100vh - 12rem)' }}>
          {/* Radial Gradient Background */}
          <motion.div
            className="absolute inset-0 rounded-3xl"
            style={{
              background: `radial-gradient(circle at center, ${auraColor}20, transparent 70%)`,
            }}
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Level Up Ripple Effect */}
          <AnimatePresence>
            {showLevelUpRipple && (
              <motion.div
                className="absolute inset-0 rounded-3xl"
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

          {/* Aura Glow Ring */}
          <motion.div
            className="absolute inset-0 rounded-3xl border-2 pointer-events-none"
            style={{
              borderColor: auraColor,
              boxShadow: `0 0 ${30 + xp / 10}px ${auraColor}60`,
            }}
            animate={{
              boxShadow: [
                `0 0 ${30 + xp / 10}px ${auraColor}60`,
                `0 0 ${40 + xp / 10}px ${auraColor}80`,
                `0 0 ${30 + xp / 10}px ${auraColor}60`,
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* 3D Canvas */}
          <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl">
            <Canvas
              gl={{ antialias: true, alpha: true }}
              dpr={[1, 2]}
              camera={{ position: [0, 6, 10], fov: 70 }}
              style={{ width: '100%', height: '100%', background: 'transparent' }}
              onCreated={({ gl, scene }) => {
                gl.toneMapping = THREE.ACESFilmicToneMapping;
                gl.toneMappingExposure = 1.5;
                scene.background = new THREE.Color(0x6F66FF);
              }}
            >
              <Suspense fallback={null}>
                {/* Lighting */}
                <ambientLight intensity={0.5} />
                <directionalLight position={[5, 5, 5]} intensity={1.2} />
                <pointLight position={[-5, 0, 5]} intensity={0.6} color={getMoodColor(mood)} />
                <pointLight position={[5, 0, -5]} intensity={0.6} color={getMoodColor(mood)} />

                {/* Environment */}
                <Environment preset="sunset" />

                {/* Avatar */}
                <Avatar animationName={currentAnimation} />

                {/* Background color animator */}
                <MoodBackground mood={mood} />

                {/* Camera controls */}
                <CameraControls ref={controlsRef} />
              </Suspense>
            </Canvas>
          </div>
        </div>

        {/* Right Panel - XP and Quests */}
        <motion.div 
          className="w-80 flex-shrink-0 flex flex-col gap-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* XP Progress Card */}
          <Card className="border-0 shadow-lg bg-white/10 backdrop-blur-lg">
            <CardHeader>
              <CardTitle className="text-[#6F66FF] flex items-center gap-2 text-sm">
                <Sparkles className="w-5 h-5" />
                Your Progress So Far ✨
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AuraBar onAuraChange={() => {
                // Update aura intensity if needed
              }} />
            </CardContent>
          </Card>

          {/* Quests Card */}
          <div className="flex-1 overflow-y-auto">
            <QuestList 
              quests={questDefinitions}
              onCompleteQuest={completeQuest}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// Preload the model
useGLTF.preload('/models/avatar3.glb');
