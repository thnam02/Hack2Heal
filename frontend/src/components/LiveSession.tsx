import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Video, VideoOff, Pause, Play, StopCircle, RotateCw } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

export function LiveSession() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [reps, setReps] = useState(0);
  const [sets, setSets] = useState(1);
  const [sessionTime, setSessionTime] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSessionActive && !isPaused) {
      interval = setInterval(() => {
        setSessionTime((prev) => prev + 1);
        // Simulate rep counting
        if (Math.random() > 0.85) {
          setReps((prev) => {
            const newReps = prev + 1;
            if (newReps >= 10) {
              setSets((prevSets) => prevSets + 1);
              return 0;
            }
            return newReps;
          });
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSessionActive, isPaused]);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 }, 
        audio: false 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsStreaming(true);
      }
    } catch (err) {
      console.error('Error accessing webcam:', err);
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    setIsSessionActive(false);
  };

  const startSession = () => {
    setIsSessionActive(true);
    setIsPaused(false);
    setSessionTime(0);
    setReps(0);
    setSets(1);
  };

  const endSession = () => {
    setIsSessionActive(false);
    setShowSummary(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const postureScore = 87;
  const alignmentStatus = 'Correct';
  const rangeOfMotion = 78;
  const formQuality = 'Good';

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[#2C2E6F] mb-2">Live Exercise Session</h1>
          <p className="text-gray-600">Computer vision-powered form analysis</p>
        </div>
        <Badge className="bg-gradient-to-r from-[#2C2E6F] to-[#4DD2C1] text-white px-4 py-2">
          Shoulder Rotation Exercise
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Webcam Feed */}
        <Card className="lg:col-span-2 border-0 shadow-xl">
          <CardContent className="p-6 space-y-4">
            <div className="relative bg-slate-900 rounded-2xl overflow-hidden aspect-video">
              {isStreaming ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {/* Overlay skeleton ghost model */}
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Center guide lines */}
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <line x1="50" y1="0" x2="50" y2="100" stroke="rgba(77, 210, 193, 0.4)" strokeWidth="0.3" strokeDasharray="2,2" />
                      <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(77, 210, 193, 0.4)" strokeWidth="0.3" strokeDasharray="2,2" />
                      {/* Pose guide circles */}
                      <circle cx="50" cy="20" r="3" fill="rgba(77, 210, 193, 0.6)" />
                      <circle cx="45" cy="30" r="2" fill="rgba(77, 210, 193, 0.6)" />
                      <circle cx="55" cy="30" r="2" fill="rgba(77, 210, 193, 0.6)" />
                    </svg>
                  </div>
                  {/* Real-time feedback toast */}
                  {isSessionActive && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                      <div className="bg-[#4DD2C1] text-white px-6 py-3 rounded-full shadow-lg">
                        ✨ Nice! Keep shoulders level.
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center text-slate-400">
                    <VideoOff className="w-20 h-20 mx-auto mb-4 opacity-50" />
                    <p>Camera is off</p>
                    <p className="text-sm">Click "Start Camera" to begin</p>
                  </div>
                </div>
              )}
            </div>

            {/* Session Controls */}
            {isStreaming && (
              <div className="grid grid-cols-3 gap-4 p-6 bg-gradient-to-br from-[#E9E6F9] to-white rounded-xl">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Reps</p>
                  <p className="text-3xl text-[#2C2E6F]">{reps}/10</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Set</p>
                  <p className="text-3xl text-[#4DD2C1]">{sets}/3</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Time</p>
                  <p className="text-3xl text-[#FF8A73]">{formatTime(sessionTime)}</p>
                </div>
              </div>
            )}

            {/* Control Buttons */}
            <div className="flex gap-3">
              {!isStreaming ? (
                <Button 
                  onClick={startWebcam}
                  className="flex-1 bg-[#2C2E6F] hover:bg-[#1f2050] h-12"
                >
                  <Video className="w-5 h-5 mr-2" />
                  Start Camera
                </Button>
              ) : (
                <>
                  {!isSessionActive ? (
                    <Button 
                      onClick={startSession}
                      className="flex-1 bg-gradient-to-r from-[#4DD2C1] to-[#3bc1b0] hover:shadow-lg h-12"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Start Session
                    </Button>
                  ) : (
                    <>
                      <Button 
                        onClick={() => setIsPaused(!isPaused)}
                        variant="outline"
                        className="flex-1 h-12"
                      >
                        {isPaused ? <Play className="w-5 h-5 mr-2" /> : <Pause className="w-5 h-5 mr-2" />}
                        {isPaused ? 'Resume' : 'Pause'}
                      </Button>
                      <Button 
                        onClick={endSession}
                        className="flex-1 bg-[#FF8A73] hover:bg-[#ff7a5c] h-12"
                      >
                        <StopCircle className="w-5 h-5 mr-2" />
                        End Session
                      </Button>
                    </>
                  )}
                  <Button 
                    onClick={stopWebcam}
                    variant="outline"
                    className="h-12"
                  >
                    <VideoOff className="w-5 h-5" />
                  </Button>
                  <Button variant="outline" className="h-12">
                    <RotateCw className="w-5 h-5" />
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Posture Analysis Sidebar */}
        <div className="space-y-4">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-[#2C2E6F]">Posture Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Posture Score */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Posture Score</span>
                  <span className="text-[#4DD2C1]">{postureScore}%</span>
                </div>
                <Progress value={postureScore} className="h-3" />
              </div>

              {/* Alignment */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Alignment</span>
                  <Badge className="bg-green-100 text-green-700">{alignmentStatus}</Badge>
                </div>
                <div className="h-3 bg-green-100 rounded-full">
                  <div className="h-full w-full bg-green-500 rounded-full" />
                </div>
              </div>

              {/* Range of Motion */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Range of Motion</span>
                  <span className="text-orange-600">{rangeOfMotion}°</span>
                </div>
                <Progress value={rangeOfMotion} className="h-3" />
              </div>

              {/* Form Quality */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Form Quality</span>
                  <Badge className="bg-[#4DD2C1] text-white">{formQuality}</Badge>
                </div>
                <div className="h-3 bg-[#E9E6F9] rounded-full">
                  <div className="h-full w-[85%] bg-[#4DD2C1] rounded-full" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Exercise Instructions */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-[#E9E6F9] to-white">
            <CardHeader>
              <CardTitle className="text-[#2C2E6F]">Exercise Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-[#2C2E6F] text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm">1</div>
                  <p className="text-sm text-gray-700">Stand with feet shoulder-width apart</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-[#2C2E6F] text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm">2</div>
                  <p className="text-sm text-gray-700">Keep your back straight and core engaged</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-[#2C2E6F] text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm">3</div>
                  <p className="text-sm text-gray-700">Rotate shoulders slowly in circles</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-[#2C2E6F] text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm">4</div>
                  <p className="text-sm text-gray-700">Complete 3 sets of 10 repetitions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Session Summary Dialog */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#2C2E6F]">Session Complete! 🎉</DialogTitle>
            <DialogDescription>
              Great work on your shoulder rehabilitation
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-[#E9E6F9] rounded-xl">
                <p className="text-2xl text-[#2C2E6F] mb-1">94%</p>
                <p className="text-sm text-gray-600">Accuracy</p>
              </div>
              <div className="text-center p-4 bg-[#E9E6F9] rounded-xl">
                <p className="text-2xl text-[#4DD2C1] mb-1">{formatTime(sessionTime)}</p>
                <p className="text-sm text-gray-600">Duration</p>
              </div>
              <div className="text-center p-4 bg-[#E9E6F9] rounded-xl">
                <p className="text-2xl text-[#FF8A73] mb-1">+50</p>
                <p className="text-sm text-gray-600">XP Earned</p>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-[#2C2E6F] to-[#4DD2C1] rounded-xl text-white text-center">
              <p className="mb-2">Achievement Unlocked!</p>
              <p className="text-sm opacity-90">Perfect Form Master 🏆</p>
            </div>

            <Button 
              onClick={() => setShowSummary(false)}
              className="w-full bg-[#2C2E6F] hover:bg-[#1f2050]"
            >
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
