import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { 
  TrendingUp, 
  Activity, 
  Target, 
  Flame,
  Play,
  Calendar,
  Award
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from 'recharts';

const adherenceData = [
  { date: 'Oct 25', adherence: 85, performance: 78 },
  { date: 'Oct 26', adherence: 88, performance: 82 },
  { date: 'Oct 27', adherence: 92, performance: 85 },
  { date: 'Oct 28', adherence: 87, performance: 88 },
  { date: 'Oct 29', adherence: 95, performance: 91 },
  { date: 'Oct 30', adherence: 91, performance: 89 },
  { date: 'Oct 31', adherence: 94, performance: 93 },
  { date: 'Nov 1', adherence: 96, performance: 95 }
];

const painTrendData = [
  { date: 'Oct 19', pain: 7 },
  { date: 'Oct 21', pain: 6.5 },
  { date: 'Oct 23', pain: 6 },
  { date: 'Oct 25', pain: 5.5 },
  { date: 'Oct 27', pain: 5 },
  { date: 'Oct 29', pain: 4 },
  { date: 'Oct 31', pain: 3.5 },
  { date: 'Nov 1', pain: 3 }
];

const xpProgressData = [
  { week: 'Week 1', xp: 120 },
  { week: 'Week 2', xp: 180 },
  { week: 'Week 3', xp: 240 },
  { week: 'Week 4', xp: 320 }
];

const todayExercises = [
  { name: 'Shoulder Rotation', sets: 3, reps: 10, completed: false },
  { name: 'Neck Mobility', sets: 2, reps: 8, completed: true },
  { name: 'Upper Back Stretch', sets: 2, reps: 12, completed: false }
];

export function PatientDashboard() {
  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[#2C2E6F] mb-2">Hi Rose 👋, ready to recover today?</h1>
          <p className="text-gray-600">Let's continue your shoulder rehabilitation journey</p>
        </div>
        <Badge className="bg-gradient-to-r from-[#4DD2C1] to-[#2C2E6F] text-white px-4 py-2">
          <Award className="w-4 h-4 mr-2" />
          Level 4: Resilience Builder
        </Badge>
      </div>

      {/* Motivational Quote */}
      <Card className="border-0 bg-gradient-to-r from-[#2C2E6F] to-[#4a4f9e] shadow-xl shadow-[#2C2E6F]/20">
        <CardContent className="p-6">
          <p className="text-white text-center text-lg">
            "Small steps today, stronger tomorrow 💪"
          </p>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-[#E9E6F9] rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-[#2C2E6F]" />
              </div>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Exercise Adherence</p>
            <h2 className="text-[#2C2E6F]">96%</h2>
            <p className="text-sm text-green-600 mt-1">+8% this week</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#4DD2C1] to-[#3bc1b0] rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Performance Score</p>
            <h2 className="text-[#2C2E6F]">95%</h2>
            <p className="text-sm text-green-600 mt-1">Excellent form!</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#FF8A73] to-[#ff7a5c] rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Completion Rate</p>
            <h2 className="text-[#2C2E6F]">94%</h2>
            <p className="text-sm text-gray-600 mt-1">28 of 30 sessions</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl flex items-center justify-center">
                <Flame className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Streak Days</p>
            <h2 className="text-[#2C2E6F]">12 🔥</h2>
            <p className="text-sm text-gray-600 mt-1">Keep it going!</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Exercise Adherence & Performance */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-[#2C2E6F]">Exercise Adherence & Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={adherenceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="adherence" 
                  stroke="#2C2E6F" 
                  strokeWidth={3}
                  name="Adherence (%)"
                  dot={{ fill: '#2C2E6F', r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="performance" 
                  stroke="#4DD2C1" 
                  strokeWidth={3}
                  name="Performance (%)"
                  dot={{ fill: '#4DD2C1', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pain Trend */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-[#2C2E6F]">Pain Trend (14 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={painTrendData}>
                <defs>
                  <linearGradient id="painGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF8A73" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FF8A73" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} domain={[0, 10]} />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="pain" 
                  stroke="#FF8A73" 
                  strokeWidth={3}
                  fill="url(#painGradient)"
                  name="Pain Level"
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="mt-4 flex items-center justify-between px-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Starting Pain</p>
                <p className="text-[#FF8A73]">7/10</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Current Pain</p>
                <p className="text-green-600">3/10</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Improvement</p>
                <p className="text-green-600">-57%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* XP Progress & Today's Exercises */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* XP Level Progress */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-[#2C2E6F]">XP Level Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={xpProgressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="week" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip />
                <Bar dataKey="xp" fill="#2C2E6F" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">Level 4 Progress</p>
                <p className="text-sm text-[#2C2E6F]">320 / 500 XP</p>
              </div>
              <Progress value={64} className="h-2" />
              <p className="text-xs text-gray-500">180 XP until Level 5: Champion</p>
            </div>
          </CardContent>
        </Card>

        {/* Today's Exercises */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-[#2C2E6F]">Today's Exercise Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayExercises.map((exercise, index) => (
              <div 
                key={index}
                className="p-4 rounded-xl border border-gray-200 hover:border-[#2C2E6F] transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {exercise.completed ? (
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border-2 border-gray-300 rounded-full" />
                    )}
                    <div>
                      <h4 className={exercise.completed ? 'text-gray-400 line-through' : 'text-[#2C2E6F]'}>
                        {exercise.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {exercise.sets} sets × {exercise.reps} reps
                      </p>
                    </div>
                  </div>
                  {!exercise.completed && (
                    <Button size="sm" className="bg-[#4DD2C1] hover:bg-[#3bc1b0] text-white">
                      <Play className="w-4 h-4 mr-1" />
                      Start
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Daily Progress</p>
                <p className="text-sm text-[#2C2E6F]">1 of 3 complete</p>
              </div>
              <Progress value={33} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recovery Prediction */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-[#E9E6F9] to-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-1">AI Predicted Recovery Date</p>
              <h2 className="text-[#2C2E6F]">December 15, 2025</h2>
              <p className="text-sm text-gray-600 mt-1">Based on your current progress, you're ahead of schedule! 🎉</p>
            </div>
            <div className="text-right">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
                <div className="text-center">
                  <p className="text-2xl text-[#2C2E6F]">44</p>
                  <p className="text-xs text-gray-600">days</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
