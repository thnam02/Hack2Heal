import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Trophy, Target, Flame, Award, Star, Zap, CheckCircle2, UserPlus, MessageSquare } from 'lucide-react';
import { useStats } from '../contexts/StatsContext';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { friendService } from '../services/friend.service';

const questDefinitions = [
  { 
    id: 'complete_3_sessions_week', 
    title: 'Complete 3 sessions this week', 
    total: 3, 
    xp: 50, 
    icon: Target 
  },
  { 
    id: 'perfect_form_x3', 
    title: 'Perfect Form x3', 
    total: 3, 
    xp: 10, 
    icon: Star 
  },
  { 
    id: 'maintain_7_day_streak', 
    title: 'Maintain 7-day streak', 
    total: 7, 
    xp: 100, 
    icon: Flame 
  },
  { 
    id: 'complete_full_exercise_plan', 
    title: 'Complete full exercise plan', 
    total: 10, 
    xp: 75, 
    icon: Zap 
  }
];

const badges = [
  { name: 'Perfect Form', earned: true, color: 'from-yellow-400 to-yellow-600', icon: '🎯' },
  { name: 'Consistency', earned: true, color: 'from-blue-400 to-blue-600', icon: '📅' },
  { name: 'Pain Slayer', earned: true, color: 'from-red-400 to-red-600', icon: '⚔️' },
  { name: 'Week Warrior', earned: false, color: 'from-gray-300 to-gray-400', icon: '🛡️' },
  { name: 'Month Master', earned: false, color: 'from-gray-300 to-gray-400', icon: '👑' },
  { name: 'Recovery Hero', earned: false, color: 'from-gray-300 to-gray-400', icon: '🦸' }
];

export function QuestsGamification() {
  const { stats, leaderboard, isLoading } = useStats();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [friendRequests, setFriendRequests] = useState<Set<number>>(new Set());

  // Calculate level from XP (150 XP per level)
  const totalXp = stats?.totalXp || 0;
  const currentLevel = Math.floor(totalXp / 150) + 1;
  const xpForCurrentLevel = totalXp % 150;
  const xpForNextLevel = 150;
  const levelProgress = (xpForCurrentLevel / xpForNextLevel) * 100;
  const xpToNextLevel = xpForNextLevel - xpForCurrentLevel;
  
  // Get user's initial for avatar
  const userInitial = user?.name?.charAt(0).toUpperCase() || 'U';

  // Build quests from stats
  const questProgress = stats?.questProgress || {};
  const currentStreak = stats?.currentStreak || 0;
  
  const quests = questDefinitions.map((questDef) => {
    let progress = 0;
    if (questDef.id === 'maintain_7_day_streak') {
      progress = Math.min(currentStreak, questDef.total);
    } else {
      progress = questProgress[questDef.id]?.progress || 0;
    }
    
    const isCompleted = progress >= questDef.total;
    
    return {
      ...questDef,
      progress,
      status: isCompleted ? 'completed' : 'active',
    };
  });

  // Map leaderboard entries
  const leaderboardEntries = leaderboard.map((entry) => ({
    ...entry,
    isUser: entry.userId === Number(user?.id),
    avatar: entry.name?.charAt(0).toUpperCase() || '?',
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-600">Loading stats...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[#2C2E6F] mb-2">Your Recovery Journey</h1>
          <p className="text-gray-600">Complete quests and earn rewards on your path to recovery</p>
        </div>
      </div>

      {/* Avatar & Level */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-[#2C2E6F] via-[#4a4f9e] to-[#4DD2C1]">
        <CardContent className="p-8">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg">
                <span className="text-4xl text-[#2C2E6F]">{userInitial}</span>
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#FF8A73] rounded-full flex items-center justify-center text-white shadow-lg">
                <Trophy className="w-5 h-5" />
              </div>
            </div>
            
            <div className="flex-1">
              <h2 className="text-white mb-1">Level {currentLevel}: Resilience Builder</h2>
              <p className="text-white/80 mb-4">{user?.name || 'User'}</p>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-white text-sm">
                  <span>{xpForCurrentLevel} / {xpForNextLevel} XP</span>
                  <span>{xpToNextLevel} XP to Level {currentLevel + 1}</span>
                </div>
                <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full shadow-lg" style={{ width: `${levelProgress}%` }} />
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-white/80 mb-1">Total XP</div>
              <div className="text-4xl text-white">{totalXp}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Quests */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-[#2C2E6F] flex items-center gap-2">
              <Target className="w-5 h-5" />
              Active Quests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {quests.map((quest) => {
              const Icon = quest.icon;
              const progressPercent = (quest.progress / quest.total) * 100;
              
              return (
                <div 
                  key={quest.id}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    quest.status === 'completed' 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-gray-200 hover:border-[#2C2E6F] bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      quest.status === 'completed' 
                        ? 'bg-green-500' 
                        : 'bg-gradient-to-br from-[#2C2E6F] to-[#4DD2C1]'
                    }`}>
                      {quest.status === 'completed' ? (
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      ) : (
                        <Icon className="w-5 h-5 text-white" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className={quest.status === 'completed' ? 'text-green-700' : 'text-[#2C2E6F]'}>
                          {quest.title}
                        </h4>
                        <Badge className={quest.status === 'completed' ? 'bg-green-500' : 'bg-[#FF8A73]'}>
                          +{quest.xp} XP
                        </Badge>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">
                            {quest.progress} / {quest.total}
                          </span>
                          <span className={quest.status === 'completed' ? 'text-green-600' : 'text-[#2C2E6F]'}>
                            {Math.round(progressPercent)}%
                          </span>
                        </div>
                        <Progress value={progressPercent} className="h-2" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Badge Gallery */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-[#2C2E6F] flex items-center gap-2">
              <Award className="w-5 h-5" />
              Badge Collection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {badges.map((badge, index) => (
                <div 
                  key={index}
                  className="text-center"
                >
                  <div className={`w-20 h-20 mx-auto rounded-xl bg-gradient-to-br ${badge.color} flex items-center justify-center text-4xl mb-2 shadow-lg ${
                    !badge.earned && 'grayscale opacity-50'
                  }`}>
                    {badge.icon}
                  </div>
                  <p className={`text-xs ${badge.earned ? 'text-[#2C2E6F]' : 'text-gray-400'}`}>
                    {badge.name}
                  </p>
                  {badge.earned && (
                    <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto mt-1" />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-[#E9E6F9] rounded-xl text-center">
              <p className="text-sm text-gray-600 mb-1">Badges Earned</p>
              <p className="text-2xl text-[#2C2E6F]">3 / 6</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-[#2C2E6F] flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Community Leaderboard
            </CardTitle>
            <Badge variant="outline" className="text-gray-600">This Week</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leaderboardEntries.map((user) => (
              <div 
                key={user.rank}
                className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                  user.isUser 
                    ? 'bg-gradient-to-r from-[#E9E6F9] to-[#E9E6F9]/50 border-2 border-[#2C2E6F]' 
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  user.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                  user.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-400' :
                  user.rank === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                  'bg-gradient-to-br from-[#2C2E6F] to-[#4DD2C1]'
                }`}>
                  <span className="text-white">#{user.rank}</span>
                </div>

                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow">
                  <span className="text-[#2C2E6F]">{user.avatar}</span>
                </div>

                <div className="flex-1">
                  <h4 className={user.isUser ? 'text-[#2C2E6F]' : 'text-gray-900'}>
                    {user.name}
                  </h4>
                  <p className="text-sm text-gray-600">Level {user.level}</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-[#2C2E6F]">{user.xp} XP</p>
                    <div className="flex items-center gap-1 text-sm text-orange-600">
                      <Flame className="w-3 h-3" />
                      {user.streak} days
                    </div>
                  </div>

                  {/* Action Buttons - Only show for other users */}
                  {!user.isUser && (
                    <div className="flex flex-col gap-2 ml-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            await friendService.sendFriendRequest(user.userId);
                            setFriendRequests(prev => new Set(prev).add(user.userId));
                            toast.success(`Friend request sent to ${user.name}!`);
                          } catch (error: any) {
                            if (error?.code !== 'ERR_NETWORK' && error?.code !== 'ERR_CONNECTION_REFUSED') {
                              toast.error('Failed to send friend request');
                            } else {
                              // Fallback to local state if backend is unavailable
                              setFriendRequests(prev => new Set(prev).add(user.userId));
                              toast.success(`Friend request sent to ${user.name}!`);
                            }
                          }
                        }}
                        disabled={friendRequests.has(user.userId)}
                        className="text-xs h-7 px-3 bg-white border-[#6F66FF] text-[#6F66FF] hover:bg-[#6F66FF]/10"
                      >
                        <UserPlus className="w-3 h-3 mr-1" />
                        {friendRequests.has(user.userId) ? 'Sent' : 'Connect'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigate('/messages', { state: { userId: user.userId, userName: user.name } });
                        }}
                        className="text-xs h-7 px-3 bg-white border-[#6F66FF] text-[#6F66FF] hover:bg-[#6F66FF]/10"
                      >
                        <MessageSquare className="w-3 h-3 mr-1" />
                        Message
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rewards Section */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-[#E9E6F9] to-white">
        <CardContent className="p-8">
          <div className="text-center">
            <Trophy className="w-16 h-16 text-[#2C2E6F] mx-auto mb-4" />
            <h3 className="text-[#2C2E6F] mb-2">Keep Going! 🎉</h3>
            <p className="text-gray-600 mb-4">You're doing amazing! Complete 2 more sessions to unlock the "Week Warrior" badge.</p>
            <Button className="bg-gradient-to-r from-[#2C2E6F] to-[#4DD2C1] text-white">
              View All Rewards
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
