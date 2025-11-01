import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Calendar, Clock, CheckCircle, XCircle, RefreshCw, Link2 } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useState } from 'react';

interface ScheduledExercise {
  id: string;
  time: string;
  exercise: string;
  details: string;
  status: 'done' | 'skipped' | 'rescheduled' | 'pending';
}

export default function SmartPlanner() {
  const [isConnected, setIsConnected] = useState(false);
  const [exercises, setExercises] = useState<ScheduledExercise[]>([
    { id: '1', time: '10:00 AM', exercise: 'Neck Retractions', details: '3×10 reps', status: 'done' },
    { id: '2', time: '02:00 PM', exercise: 'Shoulder Rotation', details: '3×10 reps', status: 'pending' },
    { id: '3', time: '06:00 PM', exercise: 'Pec Stretch', details: '3×30s', status: 'pending' },
  ]);

  const handleStatusChange = (id: string, status: 'done' | 'skipped' | 'rescheduled') => {
    setExercises(exercises.map(ex => ex.id === id ? { ...ex, status } : ex));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done':
        return <CheckCircle className="text-[#3ECF8E]" size={16} />;
      case 'skipped':
        return <XCircle className="text-[#F87171]" size={16} />;
      case 'rescheduled':
        return <RefreshCw className="text-[#6F66FF]" size={16} />;
      default:
        return <Clock className="text-[#1B1E3D]/40" size={16} />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'done':
        return <Badge className="bg-[#3ECF8E] text-white text-xs">Done</Badge>;
      case 'skipped':
        return <Badge className="bg-[#F87171] text-white text-xs">Skipped</Badge>;
      case 'rescheduled':
        return <Badge className="bg-[#6F66FF] text-white text-xs">Rescheduled</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Pending</Badge>;
    }
  };

  if (!isConnected) {
    return (
      <Card className="rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            🗓️ Smart Daily Planner
          </CardTitle>
          <p className="text-sm text-[#1B1E3D]/60">Plan your recovery around your day.</p>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-[#6F66FF]/10 mx-auto mb-4 flex items-center justify-center">
              <Calendar className="text-[#6F66FF]" size={32} />
            </div>
            <p className="text-sm text-[#1B1E3D]/60 mb-4">
              Connect your calendar to schedule exercises around your daily routine
            </p>
            <Button
              onClick={() => setIsConnected(true)}
              className="bg-gradient-to-r from-[#6F66FF] to-[#8C7BFF] hover:opacity-90 rounded-xl"
            >
              <Link2 className="mr-2" size={18} />
              Sync with Calendar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              🗓️ Today's Schedule
            </CardTitle>
            <p className="text-sm text-[#1B1E3D]/60 mt-1">
              <span className="inline-flex items-center gap-1">
                <Link2 size={12} className="text-[#3ECF8E]" />
                <span className="text-[#3ECF8E]">Connected</span>
              </span> • 3 exercises planned
            </p>
          </div>
          <Button variant="outline" size="sm" className="rounded-lg">
            Manage
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {exercises.map((exercise) => (
            <div
              key={exercise.id}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                exercise.status === 'done'
                  ? 'bg-[#3ECF8E]/5 border-[#3ECF8E]/20'
                  : exercise.status === 'skipped'
                  ? 'bg-[#F87171]/5 border-[#F87171]/20'
                  : exercise.status === 'rescheduled'
                  ? 'bg-[#6F66FF]/5 border-[#6F66FF]/20'
                  : 'bg-white border-[#1B1E3D]/10'
              }`}
            >
              <div className="flex-shrink-0">
                {getStatusIcon(exercise.status)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm">{exercise.exercise}</p>
                  {getStatusBadge(exercise.status)}
                </div>
                <p className="text-xs text-[#1B1E3D]/60">
                  {exercise.time} • {exercise.details}
                </p>
              </div>

              {exercise.status === 'pending' && (
                <div className="flex gap-1">
                  <button
                    onClick={() => handleStatusChange(exercise.id, 'done')}
                    className="p-1.5 rounded-lg hover:bg-[#3ECF8E]/10 transition-colors"
                    title="Mark as done"
                  >
                    <CheckCircle className="text-[#3ECF8E]" size={18} />
                  </button>
                  <button
                    onClick={() => handleStatusChange(exercise.id, 'rescheduled')}
                    className="p-1.5 rounded-lg hover:bg-[#6F66FF]/10 transition-colors"
                    title="Reschedule"
                  >
                    <RefreshCw className="text-[#6F66FF]" size={18} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {exercises.some(ex => ex.status === 'skipped') && (
          <div className="mt-4 p-3 bg-[#F87171]/10 rounded-xl border border-[#F87171]/20">
            <p className="text-sm text-[#1B1E3D]/70">
              You skipped an exercise. Would you like to reschedule it for tomorrow?
            </p>
            <div className="flex gap-2 mt-2">
              <Button size="sm" variant="outline" className="rounded-lg text-xs">
                Reschedule Tomorrow
              </Button>
              <Button size="sm" variant="ghost" className="text-xs">
                Skip Permanently
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

