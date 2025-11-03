import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Square, RefreshCcw, Video, VideoOff, ArrowLeft, Trophy, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Socket } from 'socket.io-client';
import { Pose, Results } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
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

  const socketRef = useRef<Socket | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const statusHandlerRef = useRef<((payload: StatusEvent) => void) | null>(null);
  const metricsHandlerRef = useRef<((payload: Record<string, unknown>) => void) | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const poseRef = useRef<Pose | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  
  // Pose analysis state
  const prevAnglesRef = useRef<number[]>([]);
  const baselineAngleRef = useRef<number | null>(null);
  const directionRef = useRef<'up' | 'down' | null>(null);
  const repsRef = useRef<number>(0);
  const baselineCalibrationFramesRef = useRef<number[]>([]); // Collect frames for baseline calibration
  const baselineCalibratedRef = useRef<boolean>(false);

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

  // Calculate angle between three points (in degrees)
  const calculateAngle = useCallback((a: [number, number], b: [number, number], c: [number, number]): number => {
    const vec1 = [a[0] - b[0], a[1] - b[1]];
    const vec2 = [c[0] - b[0], c[1] - b[1]];
    
    const dot = vec1[0] * vec2[0] + vec1[1] * vec2[1];
    const mag1 = Math.sqrt(vec1[0] * vec1[0] + vec1[1] * vec1[1]);
    const mag2 = Math.sqrt(vec2[0] * vec2[0] + vec2[1] * vec2[1]);
    
    const cosAngle = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
    return Math.acos(cosAngle) * (180 / Math.PI);
  }, []);

  // Analyze pose and return metrics
  const analyzePose = useCallback((results: Results, exerciseType: ExerciseOption) => {
    const landmarks = results.poseLandmarks;
    
    if (!landmarks || landmarks.length === 0) {
      // Return null to indicate no valid data (don't update metrics)
      return null;
    }

    // MediaPipe Pose landmarks indices
    const LEFT_SHOULDER = 11;
    const LEFT_ELBOW = 13;
    const LEFT_WRIST = 15;
    const RIGHT_SHOULDER = 12;
    const RIGHT_ELBOW = 14;
    const RIGHT_WRIST = 16;
    const LEFT_HIP = 23;
    const LEFT_KNEE = 25;
    const LEFT_ANKLE = 27;

    let angle = 0;
    let hasValidLandmarks = false;

    if (exerciseType === 'shoulder_rotation') {
      // Check both arms and use the one with better visibility and movement
      const leftShoulder = landmarks[LEFT_SHOULDER];
      const leftElbow = landmarks[LEFT_ELBOW];
      const leftWrist = landmarks[LEFT_WRIST];
      const rightShoulder = landmarks[RIGHT_SHOULDER];
      const rightElbow = landmarks[RIGHT_ELBOW];
      const rightWrist = landmarks[RIGHT_WRIST];
      
      let leftValid = false;
      let rightValid = false;
      let leftAngle = 0;
      let rightAngle = 0;
      
      // Check left arm
      if (leftShoulder && leftElbow && leftWrist && 
          (leftShoulder.visibility ?? 1) > 0.5 && 
          (leftElbow.visibility ?? 1) > 0.5 && 
          (leftWrist.visibility ?? 1) > 0.5) {
        leftAngle = calculateAngle(
          [leftShoulder.x, leftShoulder.y],
          [leftElbow.x, leftElbow.y],
          [leftWrist.x, leftWrist.y]
        );
        leftValid = leftAngle > 0;
      }
      
      // Check right arm
      if (rightShoulder && rightElbow && rightWrist && 
          (rightShoulder.visibility ?? 1) > 0.5 && 
          (rightElbow.visibility ?? 1) > 0.5 && 
          (rightWrist.visibility ?? 1) > 0.5) {
        rightAngle = calculateAngle(
          [rightShoulder.x, rightShoulder.y],
          [rightElbow.x, rightElbow.y],
          [rightWrist.x, rightWrist.y]
        );
        rightValid = rightAngle > 0;
      }
      
      // Choose the arm that is actively performing the exercise
      // Priority: arm with more movement (smaller angle = arm raised higher)
      if (leftValid && rightValid) {
        // If baseline is set, check which arm has more range of motion
        if (baselineAngleRef.current !== null) {
          const leftRange = baselineAngleRef.current - leftAngle;
          const rightRange = baselineAngleRef.current - rightAngle;
          
          // Use the arm with larger positive range (arm raised higher)
          // Or if both are raising, use the one with better visibility
          if (leftRange > 0 && rightRange > 0) {
            // Both arms are raised - use the one with larger range
            if (leftRange >= rightRange) {
              angle = leftAngle;
              hasValidLandmarks = true;
            } else {
              angle = rightAngle;
              hasValidLandmarks = true;
            }
          } else if (leftRange > 0) {
            // Only left arm is raised
            angle = leftAngle;
            hasValidLandmarks = true;
          } else if (rightRange > 0) {
            // Only right arm is raised
            angle = rightAngle;
            hasValidLandmarks = true;
          } else {
            // Neither arm is raised - use the one with better visibility
            const leftAvgVisibility = ((leftShoulder.visibility ?? 0) + (leftElbow.visibility ?? 0) + (leftWrist.visibility ?? 0)) / 3;
            const rightAvgVisibility = ((rightShoulder.visibility ?? 0) + (rightElbow.visibility ?? 0) + (rightWrist.visibility ?? 0)) / 3;
            
            if (leftAvgVisibility >= rightAvgVisibility) {
              angle = leftAngle;
              hasValidLandmarks = true;
            } else {
              angle = rightAngle;
              hasValidLandmarks = true;
            }
          }
        } else {
          // Baseline not set yet - use the arm with better visibility
          const leftAvgVisibility = ((leftShoulder.visibility ?? 0) + (leftElbow.visibility ?? 0) + (leftWrist.visibility ?? 0)) / 3;
          const rightAvgVisibility = ((rightShoulder.visibility ?? 0) + (rightElbow.visibility ?? 0) + (rightWrist.visibility ?? 0)) / 3;
          
          if (leftAvgVisibility >= rightAvgVisibility) {
            angle = leftAngle;
            hasValidLandmarks = true;
          } else {
            angle = rightAngle;
            hasValidLandmarks = true;
          }
        }
      } else if (leftValid) {
        angle = leftAngle;
        hasValidLandmarks = true;
      } else if (rightValid) {
        angle = rightAngle;
        hasValidLandmarks = true;
      }
    } else if (exerciseType === 'squat') {
      const hip = landmarks[LEFT_HIP];
      const knee = landmarks[LEFT_KNEE];
      const ankle = landmarks[LEFT_ANKLE];
      
      // Check if landmarks have valid visibility
      if (hip && knee && ankle && 
          (hip.visibility ?? 1) > 0.5 && 
          (knee.visibility ?? 1) > 0.5 && 
          (ankle.visibility ?? 1) > 0.5) {
        angle = calculateAngle(
          [hip.x, hip.y],
          [knee.x, knee.y],
          [ankle.x, ankle.y]
        );
        hasValidLandmarks = angle > 0;
      }
    }

    // If no valid landmarks, don't update metrics
    if (!hasValidLandmarks) {
      return null;
    }

    // Baseline calibration: collect first 15 frames to determine stable rest position
    const BASELINE_CALIBRATION_FRAMES = 15;
    
    if (!baselineCalibratedRef.current && angle > 0) {
      baselineCalibrationFramesRef.current.push(angle);
      
      // Once we have enough frames, calculate baseline as average (more stable)
      if (baselineCalibrationFramesRef.current.length >= BASELINE_CALIBRATION_FRAMES) {
        const baselineFrames = baselineCalibrationFramesRef.current;
        const baselineSum = baselineFrames.reduce((sum, a) => sum + a, 0);
        const baselineAvg = baselineSum / baselineFrames.length;
        
        // Validate baseline is reasonable for exercise type
        let isValidBaseline = true;
        if (exerciseType === 'shoulder_rotation') {
          // Shoulder rotation rest position: angle should be 140-180° (arm down)
          isValidBaseline = baselineAvg >= 140 && baselineAvg <= 180;
        } else if (exerciseType === 'squat') {
          // Squat standing position: angle should be 160-180° (straight leg)
          isValidBaseline = baselineAvg >= 160 && baselineAvg <= 180;
        }
        
        if (isValidBaseline) {
          baselineAngleRef.current = baselineAvg;
          baselineCalibratedRef.current = true;
        } else {
          // If baseline is invalid, use current angle as fallback but mark as calibrated
          baselineAngleRef.current = baselineAvg;
          baselineCalibratedRef.current = true;
        }
        
        // Clear calibration frames
        baselineCalibrationFramesRef.current = [];
      }
    }

    // If baseline not calibrated yet, don't process scoring (wait for calibration)
    if (!baselineCalibratedRef.current || baselineAngleRef.current === null) {
      return null;
    }

    // Temporal smoothing
    prevAnglesRef.current.push(angle);
    if (prevAnglesRef.current.length > 5) {
      prevAnglesRef.current.shift();
    }
    const smoothAngle = prevAnglesRef.current.reduce((sum, a) => sum + a, 0) / prevAnglesRef.current.length;

    // Rep counting: improved logic for each exercise type
    if (exerciseType === 'shoulder_rotation') {
      // For shoulder rotation:
      // - 'down' = arm raised (angle < baseline, performing exercise)
      // - 'up' = arm lowered (angle > baseline, returning to rest)
      // Rep counted when returning from raised to rest position
      if (directionRef.current === null) {
        directionRef.current = smoothAngle < baselineAngleRef.current ? 'down' : 'up';
      } else {
        const rangeOfMotion = baselineAngleRef.current - smoothAngle;
        const REP_THRESHOLD = 20; // Minimum range to count as performing exercise
        
        if (directionRef.current === 'down' && smoothAngle >= baselineAngleRef.current) {
          // Transitioned from performing exercise back to rest = 1 rep
          repsRef.current += 1;
          directionRef.current = 'up';
        } else if (directionRef.current === 'up' && rangeOfMotion >= REP_THRESHOLD) {
          // Started performing exercise (arm raised enough)
          directionRef.current = 'down';
        }
      }
    } else if (exerciseType === 'squat') {
      // For squat:
      // - 'down' = squatting (angle < baseline, performing exercise)
      // - 'up' = standing (angle > baseline, returning to rest)
      // Rep counted when returning from squat to standing
      if (directionRef.current === null) {
        directionRef.current = smoothAngle < baselineAngleRef.current ? 'down' : 'up';
      } else {
        const rangeOfMotion = baselineAngleRef.current - smoothAngle;
        const REP_THRESHOLD = 30; // Minimum range to count as performing exercise (deeper squat)
        
        if (directionRef.current === 'down' && smoothAngle >= baselineAngleRef.current) {
          // Transitioned from squatting back to standing = 1 rep
          repsRef.current += 1;
          directionRef.current = 'up';
        } else if (directionRef.current === 'up' && rangeOfMotion >= REP_THRESHOLD) {
          // Started squatting (deep enough)
          directionRef.current = 'down';
        }
      }
    }

    // Scoring based on exercise type and range of motion
    let postureScore = 0;
    let alignment = 'Off';
    let rangeOfMotion = 0;
    
    if (exerciseType === 'shoulder_rotation') {
      // For shoulder rotation:
      // Baseline = rest position (tay xuôi, angle lớn ~160-180°)
      // Good form = giơ tay lên (angle giảm ~90-120°)
      // Range of motion = baseline - currentAngle (positive when raising arm)
      rangeOfMotion = baselineAngleRef.current - smoothAngle;
      
      // Validate range is reasonable for shoulder rotation (0-80°)
      const MAX_RANGE = 80;
      if (rangeOfMotion < 0 || rangeOfMotion > MAX_RANGE) {
        // Invalid range - might be measurement error
        postureScore = 0;
        alignment = 'Off';
      } else {
        // Score is high when raising arm (positive range, typically 30-60°)
        if (rangeOfMotion > 0) {
          // Score based on range: 0-40° gives 0-80 points, 40-60° gives 80-100 points
          if (rangeOfMotion <= 40) {
            postureScore = (rangeOfMotion / 40) * 80; // 0-40° → 0-80 points
          } else if (rangeOfMotion <= 60) {
            postureScore = 80 + ((rangeOfMotion - 40) / 20) * 20; // 40-60° → 80-100 points
          } else {
            // 60-80°: still good but not optimal
            postureScore = 100 - ((rangeOfMotion - 60) / 20) * 10; // 60-80° → 100-90 points
          }
        } else {
          // No movement (range ~0) or negative range
          postureScore = 0;
        }
        
        // Alignment: correct if raising arm with good range (30-60°)
        alignment = rangeOfMotion >= 30 && rangeOfMotion <= 60 ? 'Correct' : 'Off';
      }
      
    } else if (exerciseType === 'squat') {
      // For squat:
      // Baseline = standing position (đứng thẳng, angle lớn ~170-180°)
      // Good form = squat down (angle giảm ~90-120°)
      // Range of motion = baseline - currentAngle (positive when squatting down)
      rangeOfMotion = baselineAngleRef.current - smoothAngle;
      
      // Validate range is reasonable for squat (0-90°)
      const MAX_RANGE = 90;
      if (rangeOfMotion < 0 || rangeOfMotion > MAX_RANGE) {
        // Invalid range - might be measurement error
        postureScore = 0;
        alignment = 'Off';
      } else {
        // Score is high when squatting down (positive range, typically 40-70°)
        if (rangeOfMotion > 0) {
          // Squat typically needs more range than shoulder rotation
          // Score based on range: 0-50° gives 0-80 points, 50-70° gives 80-100 points
          if (rangeOfMotion <= 50) {
            postureScore = (rangeOfMotion / 50) * 80; // 0-50° → 0-80 points
          } else if (rangeOfMotion <= 70) {
            postureScore = 80 + ((rangeOfMotion - 50) / 20) * 20; // 50-70° → 80-100 points
          } else {
            // 70-90°: very deep squat, might be too deep
            postureScore = 100 - ((rangeOfMotion - 70) / 20) * 10; // 70-90° → 100-90 points
          }
        } else {
          // No movement or negative range
          postureScore = 0;
        }
        
        // Alignment: correct if squatting with good depth (40-70°)
        alignment = rangeOfMotion >= 40 && rangeOfMotion <= 70 ? 'Correct' : 'Off';
      }
    }
    
    // Evaluate form quality based on stability
    const stability = prevAnglesRef.current.length > 1
      ? Math.sqrt(
          prevAnglesRef.current.reduce((sum, a) => sum + Math.pow(a - smoothAngle, 2), 0) /
          prevAnglesRef.current.length
        )
      : 0;
    
    let formQuality = '-';
    if (rangeOfMotion < 5) {
      formQuality = 'Needs Work'; // Not moving enough
    } else if (stability > 5) {
      formQuality = 'Shaky';
    } else if (postureScore > 85) {
      formQuality = 'Excellent';
    } else if (postureScore > 70) {
      formQuality = 'Good';
    } else {
      formQuality = 'Needs Work';
    }

    const result = {
      posture_score: Math.round(postureScore * 10) / 10,
      alignment,
      range_of_motion: Math.round(smoothAngle),
      form_quality: formQuality,
      reps: repsRef.current,
    };
    
    // Debug logging for posture_score and range_of_motion
    if (import.meta.env.DEV) {
      console.log(`[${exerciseType}] posture_score: ${result.posture_score}, range_of_motion: ${result.range_of_motion}, smoothAngle: ${Math.round(smoothAngle)}, baseline: ${Math.round(baselineAngleRef.current)}, range: ${Math.round(rangeOfMotion)}`);
    }
    
    return result;
  }, [calculateAngle]);

  const handleMetricsPayload = useCallback((payload: Record<string, unknown> | null) => {
    // Only update if we have valid payload data
    if (!payload) {
      return;
    }
    
    const postureScore = toNumber(payload['posture_score']);
    // Always update metrics if we have valid data from analyzePose
    // (analyzePose already validates landmarks before returning data)
    setMetrics({
      postureScore,
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

      // Filter out devices with empty deviceId
      const validDevices = videoInputs.filter((device) => device.deviceId && device.deviceId.trim() !== '');
      
      // If we have valid devices, use them; otherwise use all devices (they might not have deviceIds yet until permissions granted)
      const devicesToUse = validDevices.length > 0 ? validDevices : videoInputs;
      setDevices(devicesToUse);
      
      if (devicesToUse.length) {
        const firstDevice = devicesToUse[0];
        // Only set deviceId if it's not empty, otherwise use index-based fallback
        if (firstDevice.deviceId && firstDevice.deviceId.trim() !== '') {
          setSelectedDeviceId(firstDevice.deviceId);
        } else {
          // Use a placeholder that won't be empty string
          setSelectedDeviceId(`camera-${firstDevice.index}`);
        }
        setSelectedCameraIndex(String(firstDevice.index));
      } else {
        // No devices found at all
        setSelectedDeviceId('default');
        setSelectedCameraIndex('0');
      }
    } catch (error) {
      // Ignore device enumeration errors
    }
  };

  const startPreview = async () => {
    try {
      const videoConstraints: MediaTrackConstraints = { 
        width: { ideal: 1280 },
        height: { ideal: 720 },
      };

      // If we have a selected deviceId and it's not a fallback placeholder, use it
      // Fallback values start with "camera-" or are "default"
      if (selectedDeviceId && 
          selectedDeviceId.trim() !== '' && 
          !selectedDeviceId.startsWith('camera-') && 
          selectedDeviceId !== 'default') {
        videoConstraints.deviceId = { exact: selectedDeviceId };
      } else if (selectedCameraIndex && selectedCameraIndex !== '0') {
        // If we have a camera index, try to use it
        // Note: This won't work directly, but we'll fall back to default camera
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false,
      });
      setPreviewStream(stream);
      setIsPreviewActive(true);
      
      // After getting permission, refresh devices to get proper deviceIds
      refreshDevices();
      // Preview running
    } catch (error) {
      console.error('Failed to start camera preview:', error);
      // Show user-friendly error
      alert('Unable to access camera. Please check your permissions and try again.');
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

  const startSession = async () => {
    // Validation
    if (!selectedCameraIndex && !selectedDeviceId) {
      return;
    }

    if (!exerciseOption) {
      return;
    }

    const video = videoRef.current;
    if (!video) {
      console.error('Video element not available');
      return;
    }

    // Clean up previous session
    endSession();

    // Reset pose analysis state
    prevAnglesRef.current = [];
    baselineAngleRef.current = null;
    directionRef.current = null;
    repsRef.current = 0;
    baselineCalibrationFramesRef.current = [];
    baselineCalibratedRef.current = false;
    
    // Reset metrics BEFORE starting session (not after)
    setMetrics({ ...DEFAULT_METRICS });

    try {
      // Initialize MediaPipe Pose
      const pose = new Pose({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        },
      });

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      // Set up pose results handler
      pose.onResults((results) => {
        const metricsData = analyzePose(results, exerciseOption);
        // Only update metrics if we have valid data
        if (metricsData !== null) {
          handleMetricsPayload(metricsData);
        }
      });

      poseRef.current = pose;

      // Ensure video stream is ready
      if (!previewStream) {
        await startPreview();
        // Wait a bit for stream to be ready
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Initialize Camera
      const camera = new Camera(video, {
        onFrame: async () => {
          if (poseRef.current && video.readyState === 4) {
            await poseRef.current.send({ image: video });
          }
        },
        width: 640,
        height: 480,
      });

      cameraRef.current = camera;
      await camera.start();

      // Generate session ID locally
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionIdRef.current = sessionId;

      // Connect to socket (optional - for future features like saving sessions)
      const socket = socketService.connect();
      socketRef.current = socket;

      if (import.meta.env.DEV) {
        console.log('✅ [LiveSession] Session started with MediaPipe.js');
        console.log('✅ [LiveSession] Session ID:', sessionId);
      }

      setIsSessionActive(true);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error starting session:', error);
      }
      setIsSessionActive(false);
      alert('Failed to start session. Please check camera permissions and try again.');
    }
  };

  const endSession = () => {
    // Stop MediaPipe Camera
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }

    // Close MediaPipe Pose
    if (poseRef.current) {
      poseRef.current.close();
      poseRef.current = null;
    }

    // Reset pose analysis state
    prevAnglesRef.current = [];
    baselineAngleRef.current = null;
    directionRef.current = null;
    repsRef.current = 0;
    baselineCalibrationFramesRef.current = [];
    baselineCalibratedRef.current = false;

    // Clean up socket (optional - for future features)
    const socket = socketRef.current;
    const sessionId = sessionIdRef.current;

    if (socket && sessionId) {
      // Remove event listeners using stored handlers from refs
      if (statusHandlerRef.current) {
        socket.off('session:status', statusHandlerRef.current);
        statusHandlerRef.current = null;
      }
      if (metricsHandlerRef.current) {
        socket.off('session:metrics', metricsHandlerRef.current);
        metricsHandlerRef.current = null;
      }

      // Leave session room
      socket.emit('session:leave', { sessionId });
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
      completeSessionStats().catch((error) => {
        // Log error but don't block UI
        if (import.meta.env.DEV) {
          console.error('[LiveSession] Error completing session stats:', error);
        }
        // Optionally show user-friendly error (non-blocking)
        // toast.error('Failed to save session stats');
      });
      
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
    // Map devices, ensuring value is never empty string
    return devices.map((device) => {
      // Use deviceId if available, otherwise use index-based value
      const value = device.deviceId && device.deviceId.trim() !== '' 
        ? device.deviceId 
        : `camera-${device.index}`;
      
      return {
        value,
        label: `${device.label} (cv2 index ${device.index})`,
        indexValue: String(device.index),
      };
    });
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
                  value={selectedDeviceId || undefined}
                  onValueChange={(value) => {
                    if (value && value !== 'no-devices') {
                      setSelectedDeviceId(value);
                      const option = deviceOptions.find((item) => item.value === value);
                      if (option) {
                        setSelectedCameraIndex(option.indexValue);
                      }
                    }
                  }}
                >
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder="Select camera" />
                  </SelectTrigger>
                  <SelectContent>
                    {deviceOptions.length > 0 ? (
                      deviceOptions.map((device) => (
                        <SelectItem key={device.value} value={device.value}>
                          {device.label}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-devices" disabled>
                        No cameras available
                      </SelectItem>
                    )}
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
