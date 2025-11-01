import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Search, Clock, Target, TrendingUp } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

const exercises = [
  {
    id: 1,
    name: 'Shoulder Rotation',
    category: 'Upper Body',
    difficulty: 'Beginner',
    duration: '10 min',
    sets: 3,
    reps: 10,
    description: 'Gentle shoulder rotations to improve mobility and reduce stiffness.',
    targetAreas: ['Shoulders', 'Upper Back']
  },
  {
    id: 2,
    name: 'Knee Extension',
    category: 'Lower Body',
    difficulty: 'Intermediate',
    duration: '15 min',
    sets: 3,
    reps: 12,
    description: 'Strengthen quadriceps and improve knee stability.',
    targetAreas: ['Quadriceps', 'Knees']
  },
  {
    id: 3,
    name: 'Spinal Twist',
    category: 'Core',
    difficulty: 'Beginner',
    duration: '8 min',
    sets: 2,
    reps: 8,
    description: 'Improve spinal mobility and reduce lower back tension.',
    targetAreas: ['Lower Back', 'Core']
  },
  {
    id: 4,
    name: 'Hip Flexor Stretch',
    category: 'Lower Body',
    difficulty: 'Beginner',
    duration: '12 min',
    sets: 3,
    reps: 10,
    description: 'Release tight hip flexors and improve hip mobility.',
    targetAreas: ['Hip Flexors', 'Glutes']
  },
  {
    id: 5,
    name: 'Neck Mobility',
    category: 'Upper Body',
    difficulty: 'Beginner',
    duration: '6 min',
    sets: 2,
    reps: 10,
    description: 'Gentle neck movements to reduce tension and improve range of motion.',
    targetAreas: ['Neck', 'Shoulders']
  },
  {
    id: 6,
    name: 'Wall Push-up',
    category: 'Upper Body',
    difficulty: 'Intermediate',
    duration: '10 min',
    sets: 3,
    reps: 15,
    description: 'Build upper body strength with modified push-ups.',
    targetAreas: ['Chest', 'Arms', 'Shoulders']
  },
  {
    id: 7,
    name: 'Ankle Circles',
    category: 'Lower Body',
    difficulty: 'Beginner',
    duration: '5 min',
    sets: 2,
    reps: 12,
    description: 'Improve ankle mobility and reduce stiffness.',
    targetAreas: ['Ankles', 'Calves']
  },
  {
    id: 8,
    name: 'Core Stability',
    category: 'Core',
    difficulty: 'Advanced',
    duration: '20 min',
    sets: 4,
    reps: 10,
    description: 'Advanced core strengthening exercises for stability.',
    targetAreas: ['Core', 'Lower Back']
  }
];

export function ExerciseLibrary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');

  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         exercise.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || exercise.category === categoryFilter;
    const matchesDifficulty = difficultyFilter === 'all' || exercise.difficulty === difficultyFilter;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Intermediate':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Advanced':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-[#2C2E6F] mb-2">Exercise Library</h1>
        <p className="text-gray-600">Browse and assign exercises to your recovery plan</p>
      </div>

      <Card className="border-0 shadow-lg">
        <CardContent className="p-6 space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search exercises..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Upper Body">Upper Body</SelectItem>
                <SelectItem value="Lower Body">Lower Body</SelectItem>
                <SelectItem value="Core">Core</SelectItem>
              </SelectContent>
            </Select>

            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="Beginner">Beginner</SelectItem>
                <SelectItem value="Intermediate">Intermediate</SelectItem>
                <SelectItem value="Advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Exercise Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExercises.map((exercise) => (
              <Card key={exercise.id} className="border-0 shadow hover:shadow-lg transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <h4 className="text-[#2C2E6F]">{exercise.name}</h4>
                    <Badge variant="outline" className={getDifficultyColor(exercise.difficulty)}>
                      {exercise.difficulty}
                    </Badge>
                  </div>

                  <p className="text-gray-600">{exercise.description}</p>

                  <div className="flex flex-wrap gap-2">
                    {exercise.targetAreas.map((area) => (
                      <Badge key={area} className="bg-[#E9E6F9] text-[#2C2E6F] text-xs">
                        {area}
                      </Badge>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Clock className="w-3 h-3" />
                      {exercise.duration}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Target className="w-3 h-3" />
                      {exercise.sets} sets
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <TrendingUp className="w-3 h-3" />
                      {exercise.reps} reps
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1 hover:bg-[#E9E6F9] hover:text-[#2C2E6F] hover:border-[#2C2E6F]">
                      View Details
                    </Button>
                    <Button size="sm" className="flex-1 bg-[#4DD2C1] hover:bg-[#3bc1b0]">
                      Assign
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredExercises.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>No exercises found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
