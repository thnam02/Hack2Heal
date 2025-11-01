import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { TrendingUp, Award, CheckCircle, Flame } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { useStats } from '../contexts/StatsContext';
import { exerciseService } from '../services/exercise.service';
import { useMemo } from 'react';
import MoodTracker from './MoodTracker';
import SmartPlanner from './SmartPlanner';

const adherenceData = [
  { date: 'Oct 18', adherence: 88, performance: 85 },
  { date: 'Oct 20', adherence: 90, performance: 88 },
  { date: 'Oct 22', adherence: 92, performance: 90 },
  { date: 'Oct 24', adherence: 94, performance: 92 },
  { date: 'Oct 26', adherence: 95, performance: 93 },
  { date: 'Oct 28', adherence: 96, performance: 94 },
  { date: 'Oct 30', adherence: 96, performance: 95 },
];

const painData = [
  { day: 'Day 1', pain: 7 },
  { day: 'Day 3', pain: 6.5 },
  { day: 'Day 5', pain: 6 },
  { day: 'Day 7', pain: 5 },
  { day: 'Day 9', pain: 4.5 },
  { day: 'Day 11', pain: 3.5 },
  { day: 'Day 13', pain: 3 },
  { day: 'Day 14', pain: 2.5 },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { stats, isLoading } = useStats();
  const userName = user?.name || 'there';

  // Calculate completion rate from exercise data
  const exerciseStats = useMemo(() => {
    const exercises = exerciseService.getExercises();
    const completedSessions = exercises.reduce((sum, ex) => sum + ex.completedSessions, 0);
    const totalSessions = exercises.reduce((sum, ex) => sum + ex.totalSessions, 0);
    const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
    
    // Calculate exercise adherence (percentage of exercises completed)
    const completedExercises = exercises.filter(ex => ex.progress === 100).length;
    const adherenceRate = exercises.length > 0 ? Math.round((completedExercises / exercises.length) * 100) : 0;
    
    return {
      completedSessions,
      totalSessions,
      completionRate,
      adherenceRate,
      completedExercises,
      totalExercises: exercises.length,
    };
  }, []);

  // Get real stats from backend
  const currentStreak = stats?.currentStreak || 0;
  const totalXp = stats?.totalXp || 0;
  const currentLevel = Math.floor(totalXp / 150) + 1;

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6F66FF] mx-auto mb-4"></div>
          <p className="text-[#1B1E3D]/60">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Hi {userName} 👋, ready to recover today?</h1>
        <p className="text-[#1B1E3D]/60">Let's continue your shoulder rehabilitation journey.</p>
        <div 
          className="mt-4 text-white rounded-2xl p-4"
          style={{
            background: 'linear-gradient(to right, #6F66FF, #8C7BFF)',
            backgroundColor: '#6F66FF',
            backgroundImage: 'linear-gradient(to right, #6F66FF, #8C7BFF)',
          }}
        >
          <p className="text-center">Small steps today, stronger tomorrow 💪</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <Card className="rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-[#1B1E3D]/60">Exercise Adherence</CardTitle>
              <TrendingUp className="text-[#6F66FF]" size={20} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-[#6F66FF] mb-1">{exerciseStats.adherenceRate}%</div>
            <p className="text-sm text-[#3ECF8E]">
              {exerciseStats.completedExercises} of {exerciseStats.totalExercises} exercises complete
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-[#1B1E3D]/60">Performance Score</CardTitle>
              <Award className="text-[#3ECF8E]" size={20} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-[#3ECF8E] mb-1">Level {currentLevel}</div>
            <p className="text-sm text-[#1B1E3D]/60">{totalXp} XP total</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-[#1B1E3D]/60">Completion Rate</CardTitle>
              <CheckCircle className="text-[#6F66FF]" size={20} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-[#6F66FF] mb-1">{exerciseStats.completionRate}%</div>
            <p className="text-sm text-[#1B1E3D]/60">
              {exerciseStats.completedSessions} of {exerciseStats.totalSessions} sessions
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-[#1B1E3D]/60">Streak Days</CardTitle>
              <Flame className="text-[#F87171]" size={20} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-[#F87171] mb-1">{currentStreak} 🔥</div>
            <p className="text-sm text-[#1B1E3D]/60">
              {currentStreak === 0 ? 'Start your streak!' : currentStreak === 1 ? 'Great start!' : 'Keep it going!'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Mood Tracker & Smart Planner */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <MoodTracker />
        <SmartPlanner />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        <Card className="rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
          <CardHeader>
            <CardTitle>Exercise Adherence & Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={adherenceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" stroke="#1B1E3D" opacity={0.6} />
                <YAxis stroke="#1B1E3D" opacity={0.6} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="adherence"
                  stroke="#6F66FF"
                  strokeWidth={2}
                  name="Adherence %"
                  dot={{ fill: '#6F66FF', r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="performance"
                  stroke="#3ECF8E"
                  strokeWidth={2}
                  name="Performance %"
                  dot={{ fill: '#3ECF8E', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
          <CardHeader>
            <CardTitle>Pain Trend (14 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={painData}>
                <defs>
                  <linearGradient id="painGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F87171" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F87171" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="day" stroke="#1B1E3D" opacity={0.6} />
                <YAxis stroke="#1B1E3D" opacity={0.6} domain={[0, 10]} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="pain"
                  stroke="#F87171"
                  strokeWidth={2}
                  fill="url(#painGradient)"
                  name="Pain Level"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

