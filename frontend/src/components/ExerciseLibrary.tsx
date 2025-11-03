import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dumbbell, Clock, ArrowRight, Search } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Progress } from './ui/progress';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { exerciseService } from '../services/exercise.service';

interface Exercise {
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

// Default exercises (initial template - now managed by exerciseService)
// Removed unused constant for linting
/*
const _defaultExercises: Exercise[] = [
  {
    id: 'ex-001',
    name: 'Shoulder Rotation',
    sets: '3',
    reps: '10',
    difficulty: 'Intermediate',
    tags: ['Shoulder', 'Mobility'],
    description: 'Improve shoulder range of motion and rotator cuff strength',
    instructions: [
      'Stand with feet shoulder-width apart, arms at your sides',
      'Raise your arms to shoulder height, keeping elbows bent at 90°',
      'Slowly rotate your shoulders forward, then backward',
      'Maintain controlled movement throughout the exercise'
    ],
    progress: 67,
    completedSessions: 2,
    totalSessions: 3,
  },
  {
    id: 'ex-002',
    name: 'Pec Stretch',
    sets: '3',
    reps: '30s',
    difficulty: 'Beginner',
    tags: ['Shoulder', 'Chest', 'Posture'],
    description: 'Open chest and improve rounded shoulder posture',
    instructions: [
      'Stand in a doorway with your arm raised to 90 degrees',
      'Place your forearm against the door frame',
      'Gently lean forward until you feel a stretch in your chest',
      'Hold for 30 seconds and breathe deeply'
    ],
    progress: 100,
    completedSessions: 3,
    totalSessions: 3,
  },
  {
    id: 'ex-003',
    name: 'Neck Retraction',
    sets: '3',
    reps: '10',
    difficulty: 'Beginner',
    tags: ['Neck', 'Posture'],
    description: 'Improve cervical alignment and reduce neck strain',
    instructions: [
      'Sit or stand with good posture, looking straight ahead',
      'Gently draw your chin straight back, creating a double chin',
      'Hold for 5 seconds, keeping your eyes level',
      'Return to starting position and repeat'
    ],
    progress: 33,
    completedSessions: 1,
    totalSessions: 3,
  },
  {
    id: 'ex-004',
    name: 'Scapular Squeeze',
    sets: '3',
    reps: '15',
    difficulty: 'Intermediate',
    tags: ['Shoulder', 'Back', 'Strength'],
    description: 'Strengthen upper back muscles for better posture',
    instructions: [
      'Sit or stand with arms at your sides',
      'Squeeze your shoulder blades together',
      'Hold for 3 seconds while keeping shoulders down',
      'Release slowly and repeat'
    ],
    progress: 0,
    completedSessions: 0,
    totalSessions: 5,
  },
  {
    id: 'ex-005',
    name: 'Wall Push-Up',
    sets: '2',
    reps: '15',
    difficulty: 'Beginner',
    tags: ['Shoulder', 'Core', 'Upper Body'],
    description: 'Gentle upper body strengthening with minimal joint stress',
    instructions: [
      'Stand arm\'s length from a wall',
      'Place hands flat against wall at shoulder height',
      'Bend elbows to bring chest toward wall',
      'Push back to starting position with control'
    ],
    progress: 50,
    completedSessions: 1,
    totalSessions: 2,
  },
  {
    id: 'ex-006',
    name: 'Hip Flexor Stretch',
    sets: '3',
    reps: '30s',
    difficulty: 'Beginner',
    tags: ['Hip', 'Flexibility'],
    description: 'Release tight hip flexors and improve posture',
    instructions: [
      'Kneel on one knee with the other foot flat in front',
      'Keep your back straight and core engaged',
      'Gently push hips forward until you feel a stretch',
      'Hold for 30 seconds, then switch sides'
    ],
    progress: 67,
    completedSessions: 2,
    totalSessions: 3,
  },
];
*/

const getLevelColor = (level: string) => {
  switch (level) {
    case 'Beginner':
      return 'bg-[#3ECF8E]/10 text-[#3ECF8E]';
    case 'Intermediate':
      return 'bg-[#6F66FF]/10 text-[#6F66FF]';
    case 'Advanced':
      return 'bg-[#F87171]/10 text-[#F87171]';
    default:
      return 'bg-[#1B1E3D]/10 text-[#1B1E3D]';
  }
};

export function ExerciseLibrary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  // Load exercises from service (which handles localStorage)
  // Reload when navigating back to this page
  // IMPORTANT: Always reload when component mounts or path changes to get latest data
  useEffect(() => {
    const loadExercises = () => {
      const loadedExercises = exerciseService.getExercises();
      setExercises(loadedExercises);
    };
    loadExercises();
  }, [location.pathname]); // Reload when route changes (user navigates back)
  
  // Also reload when component becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const loadedExercises = exerciseService.getExercises();
        setExercises(loadedExercises);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Listen for storage events to update when exercises are completed
  useEffect(() => {
    let storageTimeoutId: ReturnType<typeof setTimeout> | null = null;

    const handleStorageChange = () => {
      // Clear any pending timeout
      if (storageTimeoutId) {
        clearTimeout(storageTimeoutId);
      }
      
      // Use a slightly longer delay to ensure localStorage is fully updated
      storageTimeoutId = setTimeout(() => {
        const loadedExercises = exerciseService.getExercises();
        setExercises(loadedExercises);
        storageTimeoutId = null;
      }, 150); // Slightly longer delay to ensure localStorage write is complete
    };

    // Listen for storage events (cross-tab)
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for custom events (same-tab)
    window.addEventListener('exerciseProgressUpdated', handleStorageChange);
    
    // Also listen for focus to reload when user comes back to the tab
    const handleFocus = () => {
      const loadedExercises = exerciseService.getExercises();
      setExercises(loadedExercises);
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      // Clear any pending timeout
      if (storageTimeoutId) {
        clearTimeout(storageTimeoutId);
        storageTimeoutId = null;
      }
      
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('exerciseProgressUpdated', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleStartExercise = (exercise: Exercise) => {
    // Store exercise ID in sessionStorage (we'll get fresh data in LiveSession)
    // Store both the full exercise and just the ID for safety
    sessionStorage.setItem('selectedExercise', JSON.stringify(exercise));
    sessionStorage.setItem('selectedExerciseId', exercise.id);
    navigate('/live-session');
  };

  const filteredExercises = exercises.filter(ex =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ex.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const completedToday = exercises.filter(ex => ex.progress === 100).length;
  const totalExercises = exercises.length;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl mb-2 text-[#2C2E6F]">My Exercise Library</h1>
        <p className="text-[#1B1E3D]/60">Your personalized exercises prescribed by your physiotherapist.</p>
        <div 
          className="mt-4 text-white rounded-2xl p-6 shadow-lg"
          style={{
            background: 'linear-gradient(to right, #6F66FF, #8C7BFF)',
            backgroundColor: '#6F66FF',
            backgroundImage: 'linear-gradient(to right, #6F66FF, #8C7BFF)',
          }}
        >
          <p className="text-center">Let's continue your recovery journey 🧠💪</p>
          <p className="text-center text-sm opacity-80 mt-1">
            These exercises are automatically generated from your treatment plan.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <label htmlFor="search-exercises" className="sr-only">Search your prescribed exercises</label>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1B1E3D]/40" size={20} />
          <Input
            id="search-exercises"
            name="searchExercises"
            type="search"
            autoComplete="off"
            placeholder="Search your prescribed exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-xl pl-12"
          />
        </div>
        <Button variant="outline" className="rounded-xl">
          Sort by Body Area
        </Button>
        <Button variant="outline" className="rounded-xl">
          Sort by Difficulty
        </Button>
      </div>

      {/* Exercise Grid */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {filteredExercises.map((exercise) => (
          <Card
            key={exercise.id}
            className="rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-200"
          >
            <CardHeader>
              <div className="flex items-start justify-between mb-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6F66FF] to-[#8C7BFF] flex items-center justify-center">
                  <Dumbbell className="text-white" size={24} />
                </div>
                <Badge className={getLevelColor(exercise.difficulty)}>
                  {exercise.difficulty}
                </Badge>
              </div>
              <CardTitle className="text-lg">{exercise.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-[#1B1E3D]/60">
                  <Clock size={16} />
                  <span>{exercise.sets} sets × {exercise.reps} reps</span>
                </div>

                <p className="text-sm text-[#1B1E3D]/70 leading-relaxed">
                  {exercise.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  {exercise.tags.map((tag, tagIndex) => (
                    <Badge
                      key={tagIndex}
                      variant="outline"
                      className="text-xs border-[#1B1E3D]/20"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Progress Indicator */}
                <div className="pt-2">
                  <div className="flex items-center justify-between text-sm text-[#1B1E3D]/60 mb-2">
                    <span>Progress this week</span>
                    <span>{exercise.totalSessions - exercise.completedSessions} of {exercise.totalSessions} sessions remaining</span>
                  </div>
                  {/* Progress bar shows remaining work percentage (inverse of completion) */}
                  <Progress value={100 - exercise.progress} className="h-2" />
                </div>

                {/* Action Button */}
                <Button
                  onClick={() => handleStartExercise(exercise)}
                  className="w-full bg-gradient-to-r from-[#6F66FF] to-[#8C7BFF] hover:opacity-90 rounded-xl group"
                >
                  {exercise.progress === 100 ? 'Practice Again' : 'Let\'s Go'}
                  <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress Summary Bar */}
      <Card className="rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] bg-gradient-to-br from-[#3ECF8E]/10 to-[#3ECF8E]/5 border-2 border-[#3ECF8E]/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#3ECF8E] flex items-center justify-center text-white text-xl">
                {completedToday === totalExercises ? '🎉' : '💪'}
              </div>
              <div>
                <p className="text-lg">
                  {completedToday === totalExercises ? (
                    <>Amazing work! You've completed all exercises today! 🎉</>
                  ) : (
                    <>You've completed {completedToday} of {totalExercises} exercises today!</>
                  )}
                </p>
                <p className="text-sm text-[#1B1E3D]/60 mt-1">
                  Keep up the great work on your recovery journey
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl text-[#3ECF8E]">
                {Math.round((completedToday / totalExercises) * 100)}%
              </div>
              <p className="text-sm text-[#1B1E3D]/60">Complete</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="mt-6 text-center text-sm text-[#1B1E3D]/60">
        <p>
          Exercises are automatically generated from your latest rehab plan — prescribed by your clinician and powered by AI Plan Reader.
        </p>
      </div>
    </div>
  );
}
