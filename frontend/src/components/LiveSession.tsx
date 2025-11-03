import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Square, RefreshCcw, Video, VideoOff, ArrowLeft, Trophy, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/constants';
import { useStats } from '../contexts/StatsContext';
import { exerciseService } from '../services/exercise.service';
import { socketService } from '../services/socket.service';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const DEFAULT_METRICS = {
  postureScore: 0,
  alignment: '-',
  rangeOfMotion: 0,
  formQuality: '-',
};

const EXERCISE_OPTIONS = [
  { value: 'shoulder_rotation', label: 'Shoulder Rotation' },
  { value: 'squat', label: 'Squat' },
] as const;

type Metrics = typeof DEFAULT_METRICS;
type ExerciseOption = (typeof EXERCISE_OPTIONS)[number]['value'];

interface ExerciseFromLibrary {
  id: string;
  name: string;
  sets: string;
  reps: string;
  difficulty: string;
  description: string;
  tags: string[];
  instructions: string[];
  progress: number;
  completedSessions: number;
  totalSessions: number;
}

type StatusEvent = {
  message?: string;
  level?: 'error' | 'info';
  code?: number;
};

type VideoDevice = {
  deviceId: string;
  label: string;
  index: number;
};

const toNumber = (value: unknown, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

export function LiveSession() {
  const navigate = useNavigate();
  const { completeSession: completeSessionStats } = useStats();
  const [metrics, setMetrics] = useState<Metrics>({ ...DEFAULT_METRICS });
  const [exerciseOption, setExerciseOption] = useState<ExerciseOption>('shoulder_rotation');
  const [selectedExercise, setSelectedExercise] = useState<ExerciseFromLibrary | null>(null);
  // Status message removed - using enhanced UI feedback instead
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isPreviewActive, setIsPreviewActive] = useState(false);
  const [devices, setDevices] = useState<VideoDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [selectedCameraIndex, setSelectedCameraIndex] = useState<string>('0');
  
  // Set tracking state (for exercise library mode)
  const [currentSet, setCurrentSet] = useState(0); // Start at 0, first click = Set 1
  const [sessionComplete, setSessionComplete] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const socketRef = useRef<any>(null);
  const sessionIdRef = useRef<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);

  // Check for exercise from ExerciseLibrary on mount
  useEffect(() => {
    const storedExercise = sessionStorage.getItem('selectedExercise');
    const storedExerciseId = sessionStorage.getItem('selectedExerciseId');
    
    if (storedExercise) {
      try {
        const exercise = JSON.parse(storedExercise) as ExerciseFromLibrary;
        
        // Get fresh exercise data from service to ensure we have latest progress
        const freshExercise = exerciseService.getExerciseById(exercise.id);
        if (freshExercise) {
          setSelectedExercise(freshExercise);
          // Map exercise name to backend exercise type
          if (freshExercise.name.toLowerCase().includes('shoulder')) {
            setExerciseOption('shoulder_rotation');
          } else if (freshExercise.name.toLowerCase().includes('squat')) {
            setExerciseOption('squat');
          }
        } else {
          // Fallback to stored exercise if service doesn't have it
          setSelectedExercise(exercise);
          if (exercise.name.toLowerCase().includes('shoulder')) {
            setExerciseOption('shoulder_rotation');
          } else if (exercise.name.toLowerCase().includes('squat')) {
            setExerciseOption('squat');
          }
        }
        
        // Clear sessionStorage after use
        sessionStorage.removeItem('selectedExercise');
        sessionStorage.removeItem('selectedExerciseId');
      } catch (error) {
        // Ignore parse errors
      }
    } else if (storedExerciseId) {
      // If only ID is stored, get exercise from service
      const exercise = exerciseService.getExerciseById(storedExerciseId);
      if (exercise) {
        setSelectedExercise(exercise);
        if (exercise.name.toLowerCase().includes('shoulder')) {
          setExerciseOption('shoulder_rotation');
        } else if (exercise.name.toLowerCase().includes('squat')) {
          setExerciseOption('squat');
        }
      }
      sessionStorage.removeItem('selectedExerciseId');
    }
  }, []);

  const handleMetricsPayload = useCallback((payload: Record<string, unknown>) => {
    setMetrics({
      postureScore: toNumber(payload['posture_score']),
      alignment: (payload['alignment'] as string) ?? '-',
      rangeOfMotion: toNumber(payload['range_of_motion']),
      formQuality: (payload['form_quality'] as string) ?? '-',
    });
  }, []);

  useEffect(() => {
    refreshDevices();
  }, []);

  useEffect(() => {
    return () => {
      endSession();
      stopPreview();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (previewStream) {
      video.srcObject = previewStream;
      video.muted = true;
      video.playsInline = true;
      const playPromise = video.play();
      if (playPromise) {
        playPromise.catch(() => {
          /* autoplay may require user gesture */
        });
      }
    } else {
      video.srcObject = null;
    }
  }, [previewStream]);

  // Reset set tracking only when exercise ID changes (not when exercise data is updated)
  const prevExerciseIdRef = useRef<string | null>(null);
  useEffect(() => {
    const currentExerciseId = selectedExercise?.id || null;
    // Only reset if the exercise ID actually changed (new exercise selected)
    // Don't reset if we're just updating the exercise data after completion
    if (currentExerciseId && currentExerciseId !== prevExerciseIdRef.current) {
      setCurrentSet(0); // Start at 0, first click = Set 1
      setSessionComplete(false);
      setShowCelebration(false);
      prevExerciseIdRef.current = currentExerciseId;
    } else if (!currentExerciseId) {
      // No exercise selected - reset ref
      prevExerciseIdRef.current = null;
    }
    // Note: If currentExerciseId === prevExerciseIdRef.current, it's the same exercise
    // just with updated data, so we don't reset the counters
  }, [selectedExercise?.id]); // Only depend on the ID, not the whole object

  const refreshDevices = async () => {
    try {
      const devicesList = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devicesList
        .filter((device) => device.kind === 'videoinput')
        .map((device, index) => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${index + 1}`,
          index,
        }));

      setDevices(videoInputs);
      if (videoInputs.length) {
        setSelectedDeviceId(videoInputs[0].deviceId);
        setSelectedCameraIndex(String(videoInputs[0].index));
      }
    } catch (error) {
      // Ignore device enumeration errors
    }
  };

  const startPreview = async () => {
    if (!selectedDeviceId) {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: selectedDeviceId } },
        audio: false,
      });
      setPreviewStream(stream);
      setIsPreviewActive(true);
      // Preview running
    } catch (error) {
      // Ignore preview errors
    }
  };

  const stopPreview = () => {
    if (previewStream) {
      previewStream.getTracks().forEach((track) => track.stop());
    }
    setPreviewStream(null);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsPreviewActive(false);
  };

  const startSession = () => {
    // Validation
    if (!selectedCameraIndex && !selectedDeviceId) {
      return;
    }

    if (!exerciseOption) {
      return;
    }

    // Clean up previous session
    endSession();

    // Connect to socket if not already connected
    const socket = socketService.connect();
    socketRef.current = socket;

    // Make API call to start session
    const url = new URL(`${API_BASE_URL}/sessions/start`);
    url.searchParams.set('exercise', exerciseOption);
    url.searchParams.set('camera', selectedCameraIndex || '0');

    fetch(url.toString())
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.sessionId) {
          sessionIdRef.current = data.sessionId;

          // Join session room
          socket.emit('session:join', { sessionId: data.sessionId });

          // Listen for session status
          const handleStatus = (payload: StatusEvent) => {
            if (payload.level === 'error') {
              setIsSessionActive(false);
              return;
            }
            if (payload.code !== undefined) {
              setIsSessionActive(false);
            }
          };

          // Listen for metrics
          const handleMetrics = (payload: Record<string, unknown>) => {
            handleMetricsPayload(payload);
          };

          socket.on('session:status', handleStatus);
          socket.on('session:metrics', handleMetrics);

          // Store handlers for cleanup
          socket._sessionStatusHandler = handleStatus;
          socket._sessionMetricsHandler = handleMetrics;

          setMetrics({ ...DEFAULT_METRICS });
          setIsSessionActive(true);
        } else {
          console.error('Failed to start session:', data);
          setIsSessionActive(false);
        }
      })
      .catch((error) => {
        console.error('Error starting session:', error);
        setIsSessionActive(false);
      });
  };

  const endSession = () => {
    const socket = socketRef.current;
    const sessionId = sessionIdRef.current;

    if (socket && sessionId) {
      // Remove event listeners
      if (socket._sessionStatusHandler) {
        socket.off('session:status', socket._sessionStatusHandler);
        delete socket._sessionStatusHandler;
      }
      if (socket._sessionMetricsHandler) {
        socket.off('session:metrics', socket._sessionMetricsHandler);
        delete socket._sessionMetricsHandler;
      }

      // Leave session room
      socket.emit('session:leave', { sessionId });

      // Optionally call the end endpoint to clean up backend
      fetch(`${API_BASE_URL}/sessions/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      }).catch((error) => {
        console.error('Error ending session:', error);
      });
    }

    sessionIdRef.current = null;
    socketRef.current = null;
    setIsSessionActive(false);
  };

  // Calculate exercise data early so handleRepComplete can use it
  // Default exercise if none selected
  const defaultExercise: ExerciseFromLibrary = {
    id: 'ex-default',
    name: 'Shoulder Rotation',
    sets: '3',
    reps: '10',
    difficulty: 'Intermediate',
    description: 'Improve shoulder range of motion and rotator cuff strength',
    tags: ['Shoulder', 'Mobility'],
    instructions: [
      'Stand with feet shoulder-width apart, arms at your sides',
      'Raise your arms to shoulder height, keeping elbows bent at 90°',
      'Slowly rotate your shoulders forward, then backward',
      'Maintain controlled movement throughout the exercise'
    ],
    progress: 0,
    completedSessions: 0,
    totalSessions: 3,
  };

  // Get current exercise data (from selectedExercise or default)
  const currentExercise = useMemo(() => {
    const exerciseSource = selectedExercise || defaultExercise;
    return {
      ...exerciseSource,
      instructions: exerciseSource.instructions && Array.isArray(exerciseSource.instructions) && exerciseSource.instructions.length > 0
        ? exerciseSource.instructions
        : defaultExercise.instructions,
      tags: exerciseSource.tags && Array.isArray(exerciseSource.tags) && exerciseSource.tags.length > 0
        ? exerciseSource.tags
        : defaultExercise.tags,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedExercise]); // defaultExercise is a constant, no need to include

  // Calculate sets from current exercise
  const totalSets = useMemo(() => parseInt(currentExercise.sets) || 3, [currentExercise.sets]);

  const handleSetComplete = useCallback(() => {
    // Calculate the new set count (currentSet starts at 0, so first click = Set 1)
    const newSet = currentSet + 1;
    
    // Check if this completes all sets
    if (newSet >= totalSets) {
      // All sets complete!
      // Set completion flags IMMEDIATELY to prevent any resets
      setCurrentSet(newSet);
      setSessionComplete(true);
      setShowCelebration(true);
      
      // End the session
      endSession();
      
      // Complete session stats (+20 XP, increment session, update streak, quest progress)
      completeSessionStats().catch(() => {});
      
      // Update exercise session count if exercise was selected from library
      // Do this AFTER setting sessionComplete to prevent reset loops
      if (selectedExercise?.id) {
        try {
          const updatedExercise = exerciseService.completeSession(selectedExercise.id);
          if (updatedExercise) {
            // Update the selectedExercise state with fresh data
            // The useEffect won't reset because:
            // 1. It only depends on selectedExercise?.id (not the whole object)
            // 2. The ref (prevExerciseIdRef) tracks if the ID actually changed
            // 3. Since the ID is the same, it won't trigger a reset
            setSelectedExercise(updatedExercise);
            
            // Dispatch custom event to update ExerciseLibrary if open (for same tab)
            // IMPORTANT: Use a longer delay to ensure ExerciseLibrary has time to set up listeners
            // ExerciseLibrary might be unmounting/remounting during navigation
            setTimeout(() => {
              // Dispatch simple event (triggers ExerciseLibrary reload)
              const event = new Event('exerciseProgressUpdated', { bubbles: true });
              window.dispatchEvent(event);
              
              // Also dispatch custom event with details
              const detailEvent = new CustomEvent('exerciseProgressUpdated', {
                detail: { exerciseId: updatedExercise.id, updatedExercise },
                bubbles: true,
              });
              window.dispatchEvent(detailEvent);
              
              // Retry dispatch after a longer delay to catch ExerciseLibrary if it wasn't ready
              setTimeout(() => {
                const retryEvent = new CustomEvent('exerciseProgressUpdated', {
                  detail: { exerciseId: updatedExercise.id, updatedExercise, retry: true },
                  bubbles: true,
                });
                window.dispatchEvent(retryEvent);
              }, 300); // Retry after 300ms for late-mounted components
            }, 250); // Initial delay: 250ms to ensure localStorage write + listener setup
          }
        } catch (error) {
          // Ignore exercise session update errors
        }
      }
    } else {
      // Move to next set
      setCurrentSet(newSet);
    }
  }, [currentSet, totalSets, selectedExercise, completeSessionStats]);

  const handleEndSession = () => {
    if (selectedExercise) {
      setSessionComplete(true);
      setShowCelebration(true);
    }
    endSession();
  };

  const deviceOptions = useMemo(() => {
    return devices.map((device) => ({
      value: device.deviceId,
      label: `${device.label} (cv2 index ${device.index})`,
      indexValue: String(device.index),
    }));
  }, [devices]);

  // Calculate progress percentage (based on sets only)
  const progressPercent = useMemo(() => {
    // currentSet starts at 0, so progress = currentSet / totalSets * 100
    // Example: Set 1 of 3 = 1/3 * 100 = 33.33%
    //          Set 2 of 3 = 2/3 * 100 = 66.67%
    //          Set 3 of 3 = 3/3 * 100 = 100%
    return (currentSet / totalSets) * 100;
  }, [currentSet, totalSets]);

  // Always show enhanced UI (unified experience)
  return (
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          {selectedExercise ? (
            <Button variant="ghost" onClick={() => navigate('/exercises')} className="mb-4 hover:bg-[#6F66FF]/10">
              <ArrowLeft className="mr-2" size={18} />
              Back to Library
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => navigate('/exercises')} className="mb-4 hover:bg-[#6F66FF]/10">
              <ArrowLeft className="mr-2" size={18} />
              Browse Exercise Library
            </Button>
          )}
          <h1 className="text-3xl mb-2 text-[#2C2E6F]">Live Exercise Monitor</h1>
          <p className="text-[#1B1E3D]/60">Let's practice your <span className="text-[#6F66FF]">{currentExercise.name}</span> together!</p>
          {!selectedExercise && (
            <p className="text-xs text-gray-500 mt-2">
              💡 Currently showing default exercise. Go to <strong>Exercise Library</strong> to select a specific exercise.
            </p>
          )}
        </div>

        {/* Celebration Overlay */}
        {showCelebration && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <Card className="rounded-2xl shadow-2xl max-w-md mx-4 border-2 border-[#3ECF8E]">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#3ECF8E] to-[#6F66FF] mx-auto mb-6 flex items-center justify-center animate-bounce">
                  <Trophy className="text-white" size={40} />
                </div>
                <h2 className="text-2xl mb-3">Great job! 🎉</h2>
                <p className="text-[#1B1E3D]/70 mb-2">You completed all {totalSets} sets!</p>
                <p className="text-sm text-[#1B1E3D]/60 mb-6">
                  Your form was excellent. Keep up the amazing work!
                </p>
                
                <div className="bg-[#6F66FF]/10 rounded-xl p-4 mb-6">
                  <p className="text-sm text-[#1B1E3D]/60 mb-2">XP Earned</p>
                  <p className="text-3xl text-[#6F66FF]">+20 XP</p>
                  <p className="text-xs text-[#1B1E3D]/60 mt-1">Perfect Form ×3 Quest Progress: 3/3 ✓</p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      setShowCelebration(false);
                      setCurrentSet(0);
                      setSessionComplete(false);
                    }}
                    variant="outline"
                    className="flex-1 rounded-xl"
                  >
                    Practice Again
                  </Button>
                  <Button
                    onClick={() => navigate('/exercises')}
                    className="flex-1 bg-gradient-to-r from-[#6F66FF] to-[#8C7BFF] hover:opacity-90 rounded-xl"
                  >
                    Back to Library
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Video Feed */}
          <Card className="rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#2C2E6F]">
                <Video className="text-[#6F66FF]" />
                Camera Feed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative bg-[#1B1E3D] rounded-xl overflow-hidden aspect-video flex items-center justify-center">
                {!isPreviewActive ? (
                  <div className="text-center">
                    <VideoOff className="text-white/30 mx-auto mb-4" size={64} />
                    <p className="text-white/60 mb-4">Camera is off</p>
                    <Button
                      onClick={startPreview}
                      className="bg-gradient-to-r from-[#6F66FF] to-[#8C7BFF] hover:opacity-90"
                    >
                      Start Camera
                    </Button>
                  </div>
                ) : (
                  <>
                    {previewStream && (
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    )}
                    
                  {/* Real-time Feedback Bubble */}
                  <div className="absolute top-4 left-4 right-4 bg-white backdrop-blur rounded-xl p-4 shadow-lg z-10">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="text-[#3ECF8E] flex-shrink-0 mt-0.5" size={20} />
                      <p className="text-sm text-[#1B1E3D]">
                        {currentSet === 0 && "Ready to start? Let's go!"}
                        {currentSet > 0 && currentSet < totalSets && "Great set! Rest 10s before next set."}
                        {currentSet === totalSets && "All sets complete! Amazing work!"}
                      </p>
                    </div>
                  </div>

                    {/* Progress Bar */}
                    <div className="absolute bottom-4 left-4 right-4 bg-white backdrop-blur rounded-xl p-3 z-10">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-[#1B1E3D]">Set {currentSet > 0 ? currentSet : '0'} of {totalSets}</span>
                        <span className="text-[#6F66FF]">{Math.round(progressPercent)}%</span>
                      </div>
                      <Progress value={progressPercent} className="h-2" />
                    </div>

                    {/* Camera Active Indicator */}
                    <div className="absolute top-4 right-4 z-10">
                      <div className="bg-red-500 rounded-full px-3 py-1 flex items-center gap-2">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <span className="text-white text-sm">Recording</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Camera Controls */}
              <div className="grid gap-4 md:grid-cols-2 mt-4">
                <Select
                  value={selectedDeviceId}
                  onValueChange={(value) => {
                    setSelectedDeviceId(value);
                    const option = deviceOptions.find((item) => item.value === value);
                    if (option) {
                      setSelectedCameraIndex(option.indexValue);
                    }
                  }}
                >
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder="Select camera" />
                  </SelectTrigger>
                  <SelectContent>
                    {deviceOptions.map((device) => (
                      <SelectItem key={device.value} value={device.value}>
                        {device.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Button onClick={isPreviewActive ? stopPreview : startPreview} variant="outline" className="flex-1">
                    {isPreviewActive ? <VideoOff className="w-4 h-4 mr-2" /> : <Video className="w-4 h-4 mr-2" />}
                    {isPreviewActive ? 'Stop Preview' : 'Start Preview'}
                  </Button>
                  <Button variant="secondary" onClick={refreshDevices}>
                    <RefreshCcw className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {isPreviewActive && !sessionComplete && (
                <div className="flex gap-3 mt-4">
                  <Button
                    onClick={handleSetComplete}
                    className="flex-1 bg-gradient-to-r from-[#3ECF8E] to-[#3ECF8E]/80 hover:opacity-90"
                    disabled={currentSet >= totalSets}
                  >
                    {currentSet >= totalSets ? 'All Sets Complete ✓' : `Set ${currentSet > 0 ? currentSet + 1 : 1} Complete`}
                  </Button>
                  {!isSessionActive ? (
                    <Button onClick={startSession} className="flex-1 bg-gradient-to-r from-[#6F66FF] to-[#8C7BFF]">
                      <Play className="w-4 h-4 mr-2" /> Start Analysis
                    </Button>
                  ) : (
                    <Button onClick={handleEndSession} variant="outline" className="rounded-xl">
                      End Session
                    </Button>
                  )}
                </div>
              )}

              {isSessionActive && (
                <div className="mt-4">
                  <Button onClick={endSession} variant="destructive" className="w-full">
                    <Square className="w-4 h-4 mr-2" /> Stop Analysis
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right Panel - Analysis & Instructions */}
          <div className="space-y-6">
            {/* Posture Analysis */}
            <Card className="rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
              <CardHeader>
                <CardTitle className="text-[#2C2E6F]">Posture Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[#1B1E3D]/60">Posture Score</span>
                    <span className="text-xl text-[#6F66FF]">{isSessionActive ? `${Math.round(metrics.postureScore)}%` : '--'}</span>
                  </div>
                  <Progress value={isSessionActive ? metrics.postureScore : 0} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className={`${isSessionActive && metrics.alignment === 'Correct' ? 'bg-[#3ECF8E]/10 border-[#3ECF8E]/30' : 'bg-[#F9F9FB] border-[#E5E7EB]'} border rounded-xl p-3`}>
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className={`${isSessionActive && metrics.alignment === 'Correct' ? 'text-[#3ECF8E]' : 'text-[#1B1E3D]/40'}`} size={16} />
                      <span className="text-sm">Alignment</span>
                    </div>
                    <p className={`text-xs ${isSessionActive && metrics.alignment === 'Correct' ? 'text-[#3ECF8E] font-medium' : 'text-[#1B1E3D]/60'}`}>
                      {isSessionActive ? metrics.alignment : 'Start camera'}
                    </p>
                  </div>

                  <div className={`${isSessionActive ? 'bg-red-50 border-red-200' : 'bg-[#F9F9FB] border-[#E5E7EB]'} border rounded-xl p-3`}>
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className={`${isSessionActive ? 'text-red-500' : 'text-[#1B1E3D]/40'}`} size={16} />
                      <span className="text-sm">Range of Motion</span>
                    </div>
                    <p className={`text-xs ${isSessionActive ? 'text-red-600 font-medium' : 'text-[#1B1E3D]/60'}`}>
                      {isSessionActive ? `${Math.round(metrics.rangeOfMotion)}°` : '--'}
                    </p>
                  </div>
                </div>

                <div className={`${isSessionActive ? 'bg-[#3ECF8E]/10 border-[#3ECF8E]/30' : 'bg-[#F9F9FB] border-[#E5E7EB]'} border rounded-xl p-3`}>
                  <p className="text-sm text-[#1B1E3D]">
                    <span className={isSessionActive ? 'text-[#3ECF8E] font-medium' : 'text-[#1B1E3D]/60'}>Form Quality:</span>{' '}
                    <span className={isSessionActive ? 'text-[#3ECF8E]' : 'text-[#1B1E3D]/60'}>
                      {isSessionActive ? metrics.formQuality : 'Waiting...'}
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Exercise Instructions */}
            <Card className="rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
              <CardHeader>
                <CardTitle className="text-[#2C2E6F]">Exercise Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <h3 className="text-xl mb-2 text-[#6F66FF]">{currentExercise.name}</h3>
                <p className="text-sm text-[#1B1E3D]/60 mb-4">{currentExercise.sets} sets × {currentExercise.reps} reps</p>

                <div className="space-y-3">
                  {currentExercise.instructions.map((instruction, index) => (
                    <div key={index} className="flex gap-3 items-start">
                      <div 
                        className="w-6 h-6 rounded-full text-white flex items-center justify-center flex-shrink-0 text-sm font-semibold" 
                        style={{ backgroundColor: '#6F66FF', color: '#FFFFFF' }}
                      >
                        {index + 1}
                      </div>
                      <p className="text-sm text-[#1B1E3D]/70 flex-1 leading-relaxed">
                        {instruction}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Exercise Tags */}
                {currentExercise.tags && currentExercise.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[#1B1E3D]/10">
                    {currentExercise.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="text-xs px-3 py-1 bg-[#6F66FF]/10 text-[#6F66FF] rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-[#1B1E3D]/60">
          <p>
            All movements analyzed on-device for privacy. Powered by <span className="text-[#6F66FF]">RehabMax AI+ Vision Coach</span>.
          </p>
        </div>
      </div>
    );
}
