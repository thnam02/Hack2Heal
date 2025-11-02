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

const EXERCISE_STORAGE_KEY = 'exercise_progress';

export const exerciseService = {
  // Get all exercises with their progress
  getExercises(): Exercise[] {
    const defaultExercises: Exercise[] = [
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
        reps: '12',
        difficulty: 'Beginner',
        tags: ['Shoulder', 'Chest', 'Strength'],
        description: 'Build shoulder and chest strength with controlled movement',
        instructions: [
          'Stand facing a wall, arms length away',
          'Place hands on wall at shoulder height',
          'Lower your body towards the wall, keeping core engaged',
          'Push back to starting position'
        ],
        progress: 50,
        completedSessions: 1,
        totalSessions: 2,
      },
      {
        id: 'ex-006',
        name: 'Upper Back Stretch',
        sets: '2',
        reps: '30s',
        difficulty: 'Beginner',
        tags: ['Back', 'Posture', 'Mobility'],
        description: 'Relieve tension in upper back and shoulders',
        instructions: [
          'Stand with feet shoulder-width apart',
          'Interlace fingers behind your head',
          'Gently pull elbows back to stretch upper back',
          'Hold for 30 seconds and breathe deeply'
        ],
        progress: 67,
        completedSessions: 2,
        totalSessions: 3,
      },
    ];

    try {
      const stored = localStorage.getItem(EXERCISE_STORAGE_KEY);
      if (stored) {
        const progressMap: Record<string, { completedSessions: number }> = JSON.parse(stored);
        // Merge stored progress with default exercises
        return defaultExercises.map(exercise => {
          const storedProgress = progressMap[exercise.id];
          if (storedProgress) {
            // Use stored value, not baseExercise default
            const completedSessions = storedProgress.completedSessions;
            const progress = Math.min(100, Math.round((completedSessions / exercise.totalSessions) * 100));
            return {
              ...exercise,
              completedSessions,
              progress,
            };
          }
          // If no stored progress, use 0 (not baseExercise default) for fresh start
          return {
            ...exercise,
            completedSessions: 0,
            progress: 0,
          };
        });
      }
    } catch (error) {
      // Ignore load errors
    }

    // If no stored data, return all exercises with 0 progress (not baseExercise defaults)
    // This ensures we always start fresh and use localStorage as the source of truth
    return defaultExercises.map(exercise => ({
      ...exercise,
      completedSessions: 0,
      progress: 0,
    }));
  },

  // Complete a session for an exercise
  completeSession(exerciseId: string): Exercise | null {
    try {
      // Get default exercises to find the base exercise (with default values)
      const defaultExercises: Exercise[] = [
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
          reps: '12',
          difficulty: 'Beginner',
          tags: ['Shoulder', 'Chest', 'Strength'],
          description: 'Build shoulder and chest strength with controlled movement',
          instructions: [
            'Stand facing a wall, arms length away',
            'Place hands on wall at shoulder height',
            'Lower your body towards the wall, keeping core engaged',
            'Push back to starting position'
          ],
          progress: 50,
          completedSessions: 1,
          totalSessions: 2,
        },
        {
          id: 'ex-006',
          name: 'Upper Back Stretch',
          sets: '2',
          reps: '30s',
          difficulty: 'Beginner',
          tags: ['Back', 'Posture', 'Mobility'],
          description: 'Relieve tension in upper back and shoulders',
          instructions: [
            'Stand with feet shoulder-width apart',
            'Interlace fingers behind your head',
            'Gently pull elbows back to stretch upper back',
            'Hold for 30 seconds and breathe deeply'
          ],
          progress: 67,
          completedSessions: 2,
          totalSessions: 3,
        },
      ];

      const baseExercise = defaultExercises.find(ex => ex.id === exerciseId);
      if (!baseExercise) {
        return null;
      }

      // Load current progress from localStorage
      const stored = localStorage.getItem(EXERCISE_STORAGE_KEY);
      const progressMap: Record<string, { completedSessions: number }> = stored
        ? JSON.parse(stored)
        : {};

      // Get current completed sessions (from stored progress ONLY - never use baseExercise default)
      // IMPORTANT: baseExercise defaults are for initial display only, not actual progress
      // When completing a session, we should always start from what's in localStorage (or 0 if not found)
      const storedCompletedSessions = progressMap[exerciseId]?.completedSessions;
      // If stored value exists, use it. Otherwise, start at 0 (not baseExercise.completedSessions)
      const currentCompletedSessions = storedCompletedSessions !== undefined 
        ? storedCompletedSessions 
        : 0; // Always start at 0 if no stored progress exists

      // Increment completed sessions (but don't exceed total)
      const newCompletedSessions = Math.min(
        currentCompletedSessions + 1,
        baseExercise.totalSessions
      );

      // Don't update if already at max
      if (newCompletedSessions === currentCompletedSessions && currentCompletedSessions >= baseExercise.totalSessions) {
        // Return the exercise with the CORRECT stored value, not baseExercise default
        // IMPORTANT: Don't spread baseExercise first because it has wrong default values
        // Create the exercise object directly with correct values from localStorage
        const progress = 100; // Already complete
        const storedExercise: Exercise = {
          id: baseExercise.id,
          name: baseExercise.name,
          sets: baseExercise.sets,
          reps: baseExercise.reps,
          difficulty: baseExercise.difficulty,
          tags: baseExercise.tags,
          description: baseExercise.description,
          instructions: baseExercise.instructions,
          completedSessions: currentCompletedSessions, // Use the actual stored value (e.g., 2) - DON'T use baseExercise.completedSessions!
          totalSessions: baseExercise.totalSessions,
          progress: progress,
        };
        return storedExercise;
      }

      // Calculate remaining sessions AFTER increment
      const remainingAfter = baseExercise.totalSessions - newCompletedSessions;

      // Calculate new progress
      const newProgress = Math.min(
        100,
        Math.round((newCompletedSessions / baseExercise.totalSessions) * 100)
      );

      // Save to localStorage
      progressMap[exerciseId] = { completedSessions: newCompletedSessions };
      localStorage.setItem(EXERCISE_STORAGE_KEY, JSON.stringify(progressMap));

      // Verify the save was successful
      const verifyStored = localStorage.getItem(EXERCISE_STORAGE_KEY);
      if (verifyStored) {
        const verifyMap = JSON.parse(verifyStored);
        const verifyCompleted = verifyMap[exerciseId]?.completedSessions;
        if (verifyCompleted !== newCompletedSessions) {
          // Log error silently - save verification failed
        }
      }

      // Create updated exercise object
      // IMPORTANT: Explicitly set completedSessions to avoid any spread operator issues
      const updatedExercise: Exercise = {
        id: baseExercise.id,
        name: baseExercise.name,
        sets: baseExercise.sets,
        reps: baseExercise.reps,
        difficulty: baseExercise.difficulty,
        tags: baseExercise.tags,
        description: baseExercise.description,
        instructions: baseExercise.instructions,
        completedSessions: newCompletedSessions, // Explicitly set from calculation
        totalSessions: baseExercise.totalSessions,
        progress: newProgress,
      };
      
      return updatedExercise;
    } catch (error) {
      return null;
    }
  },

  // Get a specific exercise by ID
  getExerciseById(exerciseId: string): Exercise | null {
    const exercises = this.getExercises();
    return exercises.find(ex => ex.id === exerciseId) || null;
  },
};

