import { useEffect, useRef, useState, useCallback } from 'react';
import { Pose } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import { Howl } from 'howler';
import { Scan } from 'lucide-react';

interface CameraScanEffectProps {
  onScanComplete: () => void;
  onError?: (error: string) => void;
}

interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export function CameraScanEffect({ onScanComplete, onError }: CameraScanEffectProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseRef = useRef<Pose | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanBeamY, setScanBeamY] = useState(0);
  const scanSoundRef = useRef<Howl | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isInitializedRef = useRef(false);

  // Initialize scan sound (graceful fallback if file doesn't exist)
  useEffect(() => {
    try {
      scanSoundRef.current = new Howl({
        src: ['/sounds/scan-sound.mp3'],
        volume: 0.5,
        loop: true,
        onloaderror: () => {},
      });
    } catch (error) {
      // Ignore scan sound initialization errors
    }

    return () => {
      scanSoundRef.current?.unload();
    };
  }, []);

  // Draw pose keypoints on canvas
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const drawPose = useCallback((results: any) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !video.videoWidth || !video.videoHeight) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match video
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    // Clear and draw video frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (results.poseLandmarks && Array.isArray(results.poseLandmarks)) {
      const landmarks = results.poseLandmarks as PoseLandmark[];

      // Draw connections (skeleton) - key body connections
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 3;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00ffff';

      // Pose connections (MediaPipe Pose 33 keypoints)
      const connections = [
        // Face (basic)
        [0, 2], [2, 4], [0, 4], // nose to eyes
        // Torso
        [11, 12], // shoulders
        [11, 23], [12, 24], // shoulders to hips
        [23, 24], // hips
        // Left arm
        [11, 13], [13, 15], // shoulder to elbow to wrist
        // Right arm
        [12, 14], [14, 16], // shoulder to elbow to wrist
        // Left leg
        [23, 25], [25, 27], [27, 29], [29, 31], // hip to knee to ankle to foot
        // Right leg
        [24, 26], [26, 28], [28, 30], [30, 32], // hip to knee to ankle to foot
      ];

      connections.forEach(([start, end]) => {
        if (
          landmarks[start] &&
          landmarks[end] &&
          landmarks[start].visibility &&
          landmarks[start].visibility > 0.5 &&
          landmarks[end].visibility &&
          landmarks[end].visibility > 0.5
        ) {
          ctx.beginPath();
          ctx.moveTo(landmarks[start].x * canvas.width, landmarks[start].y * canvas.height);
          ctx.lineTo(landmarks[end].x * canvas.width, landmarks[end].y * canvas.height);
          ctx.stroke();
        }
      });

      // Draw keypoints
      landmarks.forEach((landmark) => {
        if (landmark.visibility && landmark.visibility > 0.5) {
          const x = landmark.x * canvas.width;
          const y = landmark.y * canvas.height;

          ctx.fillStyle = '#00ffff';
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, 2 * Math.PI);
          ctx.fill();
        }
      });
    }

    // Draw scanning beam
    if (scanBeamY > 0) {
      const gradient = ctx.createLinearGradient(0, scanBeamY - 50, 0, scanBeamY + 50);
      gradient.addColorStop(0, 'rgba(0, 255, 255, 0)');
      gradient.addColorStop(0.5, 'rgba(0, 255, 255, 0.6)');
      gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, scanBeamY - 50, canvas.width, 100);
    }
  }, [scanBeamY]);

  // Initialize MediaPipe Pose and Camera
  useEffect(() => {
    // Prevent multiple initializations - strict check
    if (isInitializedRef.current || !videoRef.current || !canvasRef.current) {
      return;
    }
    
    // Set flag immediately to prevent re-entry
    isInitializedRef.current = true;

    let cleanupCalled = false;
    let videoStream: MediaStream | null = null;
    let poseInstance: Pose | null = null;
    let cameraInstance: Camera | null = null;
    const activeTimeouts: ReturnType<typeof setTimeout>[] = [];

    // Helper to create timeout with cleanup tracking
    const createTimeout = (fn: () => void, delay: number): ReturnType<typeof setTimeout> => {
      const timeoutId = setTimeout(() => {
        if (!cleanupCalled) {
          fn();
        }
        // Remove from tracking array when executed
        const index = activeTimeouts.indexOf(timeoutId);
        if (index > -1) {
          activeTimeouts.splice(index, 1);
        }
      }, delay);
      activeTimeouts.push(timeoutId);
      return timeoutId;
    };

    // Helper to clear timeout with tracking
    const clearTrackedTimeout = (timeoutId: ReturnType<typeof setTimeout> | null) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        const index = activeTimeouts.indexOf(timeoutId);
        if (index > -1) {
          activeTimeouts.splice(index, 1);
        }
      }
    };

    const initializePose = async () => {
      try {
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

        pose.onResults(drawPose);

        // Request camera access with flexible constraints
        try {
          // Try to get user media with flexible constraints
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 },
              facingMode: 'user',
            },
            audio: false,
          });

          videoStream = stream;

          if (videoRef.current) {
            const video = videoRef.current;
            
            // Clear any existing srcObject first
            if (video.srcObject) {
              const oldStream = video.srcObject as MediaStream;
              oldStream.getTracks().forEach(track => track.stop());
              video.srcObject = null;
              // Wait a bit for cleanup
              await new Promise<void>((resolve) => {
                createTimeout(() => {
                  if (!cleanupCalled) {
                    resolve();
                  }
                }, 100);
                // Timeout will be tracked and cleaned up
              });
            }
            
            // Set new stream
            video.srcObject = stream;
            
            // Wait for video to be ready - don't call play() manually
            // Let autoplay handle it, just wait for the stream to be active
            await new Promise<void>((resolve, reject) => {
              if (cleanupCalled) {
                reject(new Error('Component unmounted'));
                return;
              }

              const timeout = createTimeout(() => {
                if (!cleanupCalled) {
                  video.removeEventListener('loadedmetadata', onLoadedMetadata);
                  video.removeEventListener('playing', onPlaying);
                  video.removeEventListener('error', onError);
                  reject(new Error('Video loading timeout'));
                }
              }, 5000);

              // Check if video tracks are already active
              const videoTrack = stream.getVideoTracks()[0];
              if (videoTrack && videoTrack.readyState === 'live') {
                clearTrackedTimeout(timeout);
                if (!cleanupCalled) {
                  // Stream is live, resolve after a short delay to ensure video element is ready
                  createTimeout(() => {
                    if (!cleanupCalled) {
                      resolve();
                    }
                  }, 200);
                  // Will be cleaned up in cleanup function
                }
                return;
              }

              const onLoadedMetadata = () => {
                if (cleanupCalled) return;
                clearTrackedTimeout(timeout);
                video.removeEventListener('loadedmetadata', onLoadedMetadata);
                video.removeEventListener('playing', onPlaying);
                video.removeEventListener('error', onError);
                
                // Don't call play() here - let autoplay handle it
                // Just wait for the playing event or resolve if autoplay works
                createTimeout(() => {
                  if (!cleanupCalled) {
                    resolve();
                  }
                }, 100);
              };

              const onPlaying = () => {
                if (cleanupCalled) return;
                clearTrackedTimeout(timeout);
                video.removeEventListener('loadedmetadata', onLoadedMetadata);
                video.removeEventListener('playing', onPlaying);
                video.removeEventListener('error', onError);
                resolve();
              };

              const onError = (error: Event) => {
                if (cleanupCalled) return;
                clearTrackedTimeout(timeout);
                video.removeEventListener('loadedmetadata', onLoadedMetadata);
                video.removeEventListener('playing', onPlaying);
                video.removeEventListener('error', onError);
                reject(error);
              };

              // Wait for metadata
              if (video.readyState >= 1) { // HAVE_METADATA or higher
                createTimeout(() => {
                  if (!cleanupCalled) {
                    onLoadedMetadata();
                  }
                }, 100);
              } else {
                video.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });
              }
              
              // Also listen for playing event in case autoplay works
              video.addEventListener('playing', onPlaying, { once: true });
              video.addEventListener('error', onError, { once: true });
            });

            // Wait for video to have valid dimensions (max 5 seconds)
            let attempts = 0;
            const maxAttempts = 50;
            while ((!video.videoWidth || !video.videoHeight) && attempts < maxAttempts && !cleanupCalled) {
              await new Promise<void>((resolve) => {
                createTimeout(() => {
                  if (!cleanupCalled) {
                    resolve();
                  }
                }, 100);
                // Timeout will be cleaned up automatically
              });
              attempts++;
              
              // Check if video element is still valid
              if (!videoRef.current || videoRef.current !== video) {
                throw new Error('Video element was removed');
              }
            }

            if (cleanupCalled || !video || !video.videoWidth || !video.videoHeight) {
              // Clean up stream if we failed
              if (videoStream) {
                videoStream.getTracks().forEach(track => track.stop());
              }
              throw new Error('Video did not load properly - no valid dimensions');
            }

            // Double-check we have valid dimensions before creating camera
            const videoWidth = video.videoWidth || 640;
            const videoHeight = video.videoHeight || 480;

            // Initialize camera wrapper for MediaPipe
            const camera = new Camera(video, {
              onFrame: async () => {
                if (!cleanupCalled && video && video.readyState === 4 && video.videoWidth && video.videoHeight) {
                  try {
                    await pose.send({ image: video });
                  } catch (frameError) {
                    // Ignore frame processing errors
                  }
                }
              },
              width: videoWidth,
              height: videoHeight,
            });

            await camera.start();
            poseInstance = pose;
            cameraInstance = camera;
            poseRef.current = pose;
            cameraRef.current = camera;

            // Start scan animation
            scanSoundRef.current?.play();
            const startTime = Date.now();
            const SCAN_DURATION = 3000; // 3 seconds

            const animate = () => {
              if (cleanupCalled) return;

              const elapsed = Date.now() - startTime;
              const progress = Math.min(elapsed / SCAN_DURATION, 1);

              setScanProgress(progress);
              const canvas = canvasRef.current;
              setScanBeamY(progress * (canvas?.height || 480) * 0.9);

              if (progress < 1) {
                animationFrameRef.current = requestAnimationFrame(animate);
              } else {
                // Scan complete
                scanSoundRef.current?.fade(0.5, 0, 500);
                createTimeout(() => {
                  if (!cleanupCalled) {
                    onScanComplete();
                  }
                }, 500);
              }
            };

            animate();
          }
        } catch (cameraError: unknown) {
          const err = cameraError as { message?: string; name?: string };
          let errorMessage = 'Failed to access camera. ';
          
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            errorMessage += 'Please allow camera permissions in your browser settings.';
          } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            errorMessage += 'No camera found. Please connect a camera device.';
          } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
            errorMessage += 'Camera is already in use by another application. Please close other apps using the camera.';
          } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
            errorMessage += 'Camera constraints not supported. Trying with basic constraints...';
            
            // Retry with minimal constraints
            try {
              const fallbackStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false,
              });
              videoStream = fallbackStream;
              if (videoRef.current) {
                videoRef.current.srcObject = fallbackStream;
                await videoRef.current.play();
                // Continue with fallback stream...
                onError?.(errorMessage);
              }
            } catch (fallbackError) {
              errorMessage = 'Unable to access camera. Please check your camera permissions and ensure no other app is using it.';
              onError?.(errorMessage);
            }
          } else {
            errorMessage += `Error: ${err.message || 'Unknown error'}`;
            onError?.(errorMessage);
          }
        }
      } catch (error: unknown) {
        onError?.('Failed to initialize pose detection.');
      }
    };

    // Initialize pose (don't await - let it run async)
    initializePose().catch(() => {
      isInitializedRef.current = false;
    });

    return () => {
      cleanupCalled = true;
      isInitializedRef.current = false;
      
      // Clear all active timeouts
      activeTimeouts.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      activeTimeouts.length = 0;
      
      // Stop animation
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // Stop camera
      if (cameraInstance) {
        try {
          cameraInstance.stop();
        } catch (e) {
          // Ignore errors during cleanup
        }
        cameraRef.current = null;
        cameraInstance = null;
      }
      
      // Close pose
      if (poseInstance) {
        try {
          poseInstance.close();
        } catch (e) {
          // Ignore errors during cleanup
        }
        poseRef.current = null;
        poseInstance = null;
      }
      
      // Stop video stream
      if (videoStream) {
        videoStream.getTracks().forEach(track => {
          track.stop();
          track.onended = null;
        });
        videoStream = null;
      }
      
      // Clear video element (copy ref to variable for cleanup)
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const videoElement = videoRef.current;
      if (videoElement) {
        videoElement.srcObject = null;
        videoElement.onloadedmetadata = null;
        videoElement.onplaying = null;
        videoElement.onerror = null;
      }
      
      // Stop sound
      if (scanSoundRef.current) {
        scanSoundRef.current.stop();
      }
    };
    // Only run once on mount - dependencies are stable functions
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
      {/* Hidden video element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="hidden"
        style={{ display: 'none' }}
      />

      {/* Canvas overlay */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Scan progress overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="bg-black/60 backdrop-blur-sm px-8 py-6 rounded-2xl border border-cyan-400/50 shadow-lg">
          <div className="flex items-center gap-4 mb-4">
            <Scan className="text-cyan-400 animate-pulse" size={32} />
            <h2 className="text-2xl font-bold text-cyan-400">SCANNING...</h2>
          </div>
          <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-100"
              style={{ width: `${scanProgress * 100}%` }}
            />
          </div>
          <p className="text-sm text-cyan-300 mt-2 text-center">
            {Math.round(scanProgress * 100)}% Complete
          </p>
        </div>
      </div>
    </div>
  );
}

