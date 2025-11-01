import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';

const moodData = [
  { day: 'Mon', mood: 3 },
  { day: 'Tue', mood: 2 },
  { day: 'Wed', mood: 3 },
  { day: 'Thu', mood: 2 },
  { day: 'Fri', mood: 3 },
  { day: 'Sat', mood: 3 },
  { day: 'Sun', mood: 0 }, // Today - not logged yet
];

export default function MoodTracker() {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [showEncouragement, setShowEncouragement] = useState(false);

  const handleMoodSelect = (mood: number) => {
    setSelectedMood(mood);
    
    // Simulate checking for 3 consecutive low mood days
    const recentMoods = moodData.slice(-3).map(d => d.mood);
    const lowMoodStreak = recentMoods.filter(m => m === 1).length >= 2;
    
    if (mood === 1 && lowMoodStreak) {
      setTimeout(() => setShowEncouragement(true), 500);
    }
  };

  const moodOptions = [
    { value: 3, emoji: '😊', label: 'Good', color: 'bg-[#3ECF8E]', hoverColor: 'hover:bg-[#3ECF8E]/20' },
    { value: 2, emoji: '😐', label: 'Okay', color: 'bg-[#6F66FF]', hoverColor: 'hover:bg-[#6F66FF]/20' },
    { value: 1, emoji: '😣', label: 'Tired', color: 'bg-[#F87171]', hoverColor: 'hover:bg-[#F87171]/20' },
  ];

  const chartData = moodData.filter(d => d.mood > 0);

  return (
    <>
      <Card className="rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            💭 Mood & Energy Check-In
          </CardTitle>
          <p className="text-sm text-[#1B1E3D]/60">How are you feeling today?</p>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 mb-4">
            {moodOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleMoodSelect(option.value)}
                className={`flex-1 rounded-xl p-4 border-2 transition-all ${
                  selectedMood === option.value
                    ? `${option.color} border-transparent text-white`
                    : `border-[#1B1E3D]/10 ${option.hoverColor}`
                }`}
              >
                <div className="text-3xl mb-1">{option.emoji}</div>
                <div className="text-sm">{option.label}</div>
              </button>
            ))}
          </div>

          {/* Mini Chart */}
          <div className="pt-3 border-t border-[#1B1E3D]/10">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-[#1B1E3D]/60">Mood Trend (7 days)</p>
              <Dialog>
                <DialogTrigger asChild>
                  <button className="text-xs text-[#6F66FF] hover:underline flex items-center gap-1">
                    View Insights
                    <TrendingUp size={12} />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Mood & Energy Insights</DialogTitle>
                    <DialogDescription>
                      Track your mood trends over time to understand patterns in your recovery journey.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={chartData}>
                        <XAxis dataKey="day" stroke="#1B1E3D" opacity={0.6} />
                        <YAxis domain={[0, 3]} ticks={[1, 2, 3]} stroke="#1B1E3D" opacity={0.6} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="mood"
                          stroke="#6F66FF"
                          strokeWidth={3}
                          dot={{ fill: '#6F66FF', r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-[#3ECF8E]/10 rounded-xl p-4">
                        <p className="text-2xl mb-1">
                          {chartData.filter(d => d.mood === 3).length}
                        </p>
                        <p className="text-sm text-[#1B1E3D]/60">Good Days</p>
                      </div>
                      <div className="bg-[#6F66FF]/10 rounded-xl p-4">
                        <p className="text-2xl mb-1">
                          {chartData.filter(d => d.mood === 2).length}
                        </p>
                        <p className="text-sm text-[#1B1E3D]/60">Okay Days</p>
                      </div>
                      <div className="bg-[#F87171]/10 rounded-xl p-4">
                        <p className="text-2xl mb-1">
                          {chartData.filter(d => d.mood === 1).length}
                        </p>
                        <p className="text-sm text-[#1B1E3D]/60">Tired Days</p>
                      </div>
                    </div>

                    <div className="bg-[#F9F9FB] rounded-xl p-4 border border-[#1B1E3D]/10">
                      <p className="text-sm text-[#1B1E3D]/70">
                        <span className="text-[#6F66FF]">AI Insight:</span> Your mood has been consistently positive this week! 
                        This correlates with your high adherence rate. Keep up the great work! 💪
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <ResponsiveContainer width="100%" height={60}>
              <LineChart data={chartData}>
                <Line
                  type="monotone"
                  dataKey="mood"
                  stroke="#6F66FF"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* AI Encouragement Popup */}
      {showEncouragement && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="rounded-2xl shadow-2xl max-w-md mx-4 border-2 border-[#6F66FF]">
            <CardContent className="pt-6 pb-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#6F66FF] to-[#8C7BFF] mx-auto mb-4 flex items-center justify-center text-3xl">
                  💜
                </div>
                <h3 className="text-xl mb-3">We're here for you</h3>
                <p className="text-[#1B1E3D]/70 mb-6">
                  We noticed you've been feeling tired lately. Recovery isn't always linear, and that's okay. 
                  Remember why you started this journey. You're doing better than you think! 🌟
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowEncouragement(false)}
                    className="flex-1 px-4 py-2 bg-[#F9F9FB] rounded-xl hover:bg-[#6F66FF]/10 transition-colors"
                  >
                    Thanks
                  </button>
                  <button
                    onClick={() => setShowEncouragement(false)}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-[#6F66FF] to-[#8C7BFF] text-white rounded-xl hover:opacity-90 transition-opacity"
                  >
                    Read My Letter
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

