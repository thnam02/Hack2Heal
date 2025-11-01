import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Users, 
  Calendar, 
  Activity, 
  TrendingUp,
  TrendingDown,
  Plus
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';

const adherenceData = [
  { date: 'Oct 25', adherence: 82, performance: 75 },
  { date: 'Oct 26', adherence: 85, performance: 79 },
  { date: 'Oct 27', adherence: 88, performance: 82 },
  { date: 'Oct 28', adherence: 86, performance: 84 },
  { date: 'Oct 29', adherence: 91, performance: 87 },
  { date: 'Oct 30', adherence: 89, performance: 86 },
  { date: 'Oct 31', adherence: 93, performance: 90 },
  { date: 'Nov 1', adherence: 94, performance: 92 }
];

const painReductionData = [
  { week: 'Week 1', avgPain: 6.8 },
  { week: 'Week 2', avgPain: 5.9 },
  { week: 'Week 3', avgPain: 5.1 },
  { week: 'Week 4', avgPain: 4.2 }
];

const recentSessions = [
  {
    patient: 'Rose Martinez',
    exercise: 'Shoulder Rotation',
    duration: '25 min',
    completion: 100,
    performance: 'Excellent',
    date: '2025-11-01'
  },
  {
    patient: 'Michael Chen',
    exercise: 'Knee Extension',
    duration: '30 min',
    completion: 95,
    performance: 'Good',
    date: '2025-11-01'
  },
  {
    patient: 'Sarah Johnson',
    exercise: 'Hip Flexor Stretch',
    duration: '20 min',
    completion: 88,
    performance: 'Good',
    date: '2025-10-31'
  },
  {
    patient: 'David Kim',
    exercise: 'Neck Mobility',
    duration: '15 min',
    completion: 75,
    performance: 'Fair',
    date: '2025-10-31'
  }
];

const upcomingAppointments = [
  {
    patient: 'Rose Martinez',
    time: '09:00 AM',
    type: 'Progress Review',
    status: 'confirmed'
  },
  {
    patient: 'Michael Chen',
    time: '10:30 AM',
    type: 'Therapy Session',
    status: 'confirmed'
  },
  {
    patient: 'Sarah Johnson',
    time: '02:00 PM',
    type: 'Initial Assessment',
    status: 'pending'
  },
  {
    patient: 'David Kim',
    time: '03:30 PM',
    type: 'Follow-up',
    status: 'confirmed'
  }
];

export function ClinicianDashboard() {
  const getPerformanceBadge = (performance: string) => {
    switch (performance) {
      case 'Excellent':
        return <Badge className="bg-green-100 text-green-700 border-green-200">Excellent</Badge>;
      case 'Good':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Good</Badge>;
      case 'Fair':
        return <Badge className="bg-orange-100 text-orange-700 border-orange-200">Fair</Badge>;
      default:
        return <Badge variant="outline">{performance}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[#2C2E6F] mb-2">RehabQuest Clinic Portal</h1>
          <p className="text-gray-600">Welcome back, Dr. Sarah Chen</p>
        </div>
        <Button className="bg-[#2C2E6F] hover:bg-[#1f2050]">
          <Plus className="w-4 h-4 mr-2" />
          Add New Patient
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#2C2E6F] to-[#4a4f9e] rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center gap-1 text-green-600 text-sm">
                <TrendingUp className="w-4 h-4" />
                +12%
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Patients</p>
            <h2 className="text-[#2C2E6F]">148</h2>
            <p className="text-sm text-gray-500 mt-1">18 new this month</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#4DD2C1] to-[#3bc1b0] rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm text-gray-600">Today</p>
            </div>
            <p className="text-sm text-gray-600 mb-1">Today's Appointments</p>
            <h2 className="text-[#2C2E6F]">8</h2>
            <p className="text-sm text-gray-500 mt-1">4 remaining</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#FF8A73] to-[#ff7a5c] rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center gap-1 text-green-600 text-sm">
                <TrendingUp className="w-4 h-4" />
                +8%
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Active Sessions</p>
            <h2 className="text-[#2C2E6F]">23</h2>
            <p className="text-sm text-gray-500 mt-1">This week</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center gap-1 text-green-600 text-sm">
                <TrendingUp className="w-4 h-4" />
                +5%
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Completion Rate</p>
            <h2 className="text-[#2C2E6F]">94%</h2>
            <p className="text-sm text-gray-500 mt-1">Above target</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Exercise Adherence vs Performance */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-[#2C2E6F]">Exercise Adherence vs Performance Score</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
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

        {/* Pain Reduction Trend */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-[#2C2E6F]">Pain Reduction Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={painReductionData}>
                <defs>
                  <linearGradient id="painGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF8A73" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FF8A73" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="week" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} domain={[0, 10]} />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="avgPain" 
                  stroke="#FF8A73" 
                  strokeWidth={3}
                  fill="url(#painGrad)"
                  name="Avg Pain Level"
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="mt-4 flex items-center justify-around">
              <div className="text-center">
                <p className="text-sm text-gray-600">Avg Reduction</p>
                <div className="flex items-center gap-1 justify-center">
                  <TrendingDown className="w-4 h-4 text-green-600" />
                  <p className="text-green-600">-38%</p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Current Avg</p>
                <p className="text-[#FF8A73]">4.2/10</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sessions Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-[#2C2E6F]">Recent Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Exercise</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Completion</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentSessions.map((session, index) => (
                <TableRow key={index}>
                  <TableCell className="text-[#2C2E6F]">{session.patient}</TableCell>
                  <TableCell>{session.exercise}</TableCell>
                  <TableCell>{session.duration}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#4DD2C1]"
                          style={{ width: `${session.completion}%` }}
                        />
                      </div>
                      <span className="text-sm">{session.completion}%</span>
                    </div>
                  </TableCell>
                  <TableCell>{getPerformanceBadge(session.performance)}</TableCell>
                  <TableCell className="text-gray-600">
                    {new Date(session.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Upcoming Appointments */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-[#2C2E6F]">Upcoming Appointments</CardTitle>
            <Badge variant="outline">Today</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {upcomingAppointments.map((appointment, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-[#2C2E6F] hover:bg-[#E9E6F9]/30 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#2C2E6F] to-[#4DD2C1] rounded-lg flex items-center justify-center text-white">
                    {appointment.patient.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="text-[#2C2E6F]">{appointment.patient}</h4>
                    <p className="text-sm text-gray-600">{appointment.type}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[#2C2E6F]">{appointment.time}</p>
                  </div>
                  <Badge 
                    className={appointment.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}
                  >
                    {appointment.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
