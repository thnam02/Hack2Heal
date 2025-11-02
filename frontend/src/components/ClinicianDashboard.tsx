import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Users, Activity, TrendingUp, AlertTriangle, Plus, Download } from 'lucide-react';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import PainTransitionMatrix from './PainTransitionMatrix';
import PerformanceBonuses from './PerformanceBonuses';
import { useAuth } from '../contexts/AuthContext';

const adherenceData = [
  { date: 'Oct 18', adherence: 88, performance: 85 },
  { date: 'Oct 20', adherence: 90, performance: 88 },
  { date: 'Oct 22', adherence: 92, performance: 90 },
  { date: 'Oct 24', adherence: 94, performance: 92 },
  { date: 'Oct 26', adherence: 95, performance: 93 },
  { date: 'Oct 28', adherence: 96, performance: 94 },
  { date: 'Oct 30', adherence: 96, performance: 95 },
];

const painTrendData = [
  { day: 'Day 1', pain: 6.5 },
  { day: 'Day 3', pain: 6.0 },
  { day: 'Day 5', pain: 5.5 },
  { day: 'Day 7', pain: 5.0 },
  { day: 'Day 9', pain: 4.8 },
  { day: 'Day 11', pain: 4.2 },
  { day: 'Day 13', pain: 3.8 },
];

const completionByInjury = [
  { injury: 'Shoulder', rate: 92 },
  { injury: 'Neck', rate: 88 },
  { injury: 'Knee', rate: 94 },
  { injury: 'Back', rate: 85 },
  { injury: 'Hip', rate: 90 },
];

const patients = [
  { name: 'Rose Nguyen', adherence: 94, performance: 92, risk: 'Low', nextAppt: 'Nov 3', notes: 'Excellent progress', riskColor: 'text-[#3ECF8E]' },
  { name: 'James Chen', adherence: 88, performance: 85, risk: 'Low', nextAppt: 'Nov 4', notes: 'On track', riskColor: 'text-[#3ECF8E]' },
  { name: 'Mia Patel', adherence: 70, performance: 75, risk: 'High', nextAppt: 'Nov 5', notes: 'Motivation slipping', riskColor: 'text-[#F87171]' },
  { name: 'Sarah Kim', adherence: 82, performance: 80, risk: 'Medium', nextAppt: 'Nov 6', notes: 'Needs encouragement', riskColor: 'text-[#F87171]/60' },
  { name: 'David Lopez', adherence: 96, performance: 94, risk: 'Low', nextAppt: 'Nov 7', notes: 'Ahead of schedule', riskColor: 'text-[#3ECF8E]' },
];

// Helper function to get color based on percentage value for Patient Overview table
const getPercentageColor = (value: number, risk?: string): string => {
  // Nếu risk là High, luôn dùng màu đỏ
  if (risk && risk.toLowerCase() === 'high') return '#F87171'; // Đỏ - High risk
  // Nếu risk là Medium, dùng màu vàng
  if (risk && risk.toLowerCase() === 'medium') return '#F59E0B'; // Vàng - Medium risk
  if (value > 0) return '#3ECF8E'; // Xanh - số dương
  return '#F59E0B'; // Đỏ cam - thấp
};

// Helper function to get risk color
const getRiskColor = (risk: string): string => {
  if (risk.toLowerCase() === 'low') return '#3ECF8E'; // Xanh - Low risk
  if (risk.toLowerCase() === 'high') return '#F87171'; // Đỏ - High risk
  return '#F59E0B'; // Cam - Medium risk
};

interface ClinicianDashboardProps {
  onNavigate?: (page: string) => void;
}

export function ClinicianDashboard({ onNavigate }: ClinicianDashboardProps) {
  const { user } = useAuth();
  
  const handleNavigate = (page: string) => {
    if (onNavigate) {
      onNavigate(page);
    } else {
      // Fallback: use window location if onNavigate is not provided
      window.location.href = `/${page}`;
    }
  };

  const displayName = user?.name || 'Clinician';

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Hi {displayName} 👋, here's your clinic's performance today.</h1>
        <div className="flex items-center gap-4 mt-4">
          <Button variant="outline" className="rounded-xl">
            This Week
          </Button>
          <Button variant="outline" className="rounded-xl">
            This Month
          </Button>
          <Button variant="outline" className="rounded-xl">
            Custom Range
          </Button>
          <div className="flex-1"></div>
          <Button className="bg-gradient-to-r from-[#6F66FF] to-[#8C7BFF] hover:opacity-90 rounded-xl">
            <Plus className="mr-2" size={18} />
            Add Patient
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="flex flex-nowrap gap-4 mb-8 overflow-x-auto">
        <Card className="rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] flex-1 min-w-[200px] flex-shrink-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-sm text-[#1B1E3D]/60 whitespace-nowrap">Total Patients</CardTitle>
              <Users className="text-[#6F66FF] flex-shrink-0" size={20} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl mb-1" style={{ color: '#6F66FF' }}>152</div>
            <p className="text-sm font-medium" style={{ color: '#6F66FF' }}>+12% from last month</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] flex-1 min-w-[200px] flex-shrink-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-sm text-[#1B1E3D]/60 whitespace-nowrap">Active Plans</CardTitle>
              <Activity className="text-[#3ECF8E] flex-shrink-0" size={20} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl mb-1" style={{ color: '#3ECF8E' }}>118</div>
            <p className="text-sm font-medium" style={{ color: '#F59E0B' }}>–3 inactive</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] flex-1 min-w-[200px] flex-shrink-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-sm text-[#1B1E3D]/60 whitespace-nowrap">Avg Completion Rate</CardTitle>
              <TrendingUp className="text-[#6F66FF] flex-shrink-0" size={20} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl mb-1" style={{ color: '#3ECF8E' }}>91%</div>
            <p className="text-sm font-medium" style={{ color: '#3ECF8E' }}>+4% improvement</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] flex-1 min-w-[200px] flex-shrink-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-sm text-[#1B1E3D]/60 whitespace-nowrap">Avg Drop-Off Risk</CardTitle>
              <AlertTriangle className="text-[#F59E0B] flex-shrink-0" size={20} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl mb-1" style={{ color: '#F59E0B' }}>0.38</div>
            <p className="text-sm text-[#1B1E3D]/60">Low risk</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white rounded-xl p-1 shadow-sm">
          <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
          <TabsTrigger value="patients" className="rounded-lg">Patients</TabsTrigger>
          <TabsTrigger value="bonuses" className="rounded-lg">Performance Bonus</TabsTrigger>
          <TabsTrigger value="insights" className="rounded-lg">Predictive Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Charts */}
          <div className="grid grid-cols-2 gap-6">
            <Card className="rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
              <CardHeader>
                <CardTitle>Adherence vs Performance</CardTitle>
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
                <CardTitle>Pain Trend Across Portfolio</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={painTrendData}>
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
                      name="Avg Pain Level"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
            <CardHeader>
              <CardTitle>Completion Rate per Injury Type</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={completionByInjury}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="injury" stroke="#1B1E3D" opacity={0.6} />
                  <YAxis stroke="#1B1E3D" opacity={0.6} domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="rate" fill="#6F66FF" radius={[8, 8, 0, 0]} name="Completion Rate %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Patient Table */}
          <Card className="rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Patient Overview</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="rounded-lg">
                    <Download className="mr-2" size={16} />
                    Export CSV
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-lg">
                    <Download className="mr-2" size={16} />
                    Export PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#1B1E3D]/10">
                      <th className="text-left py-3 px-4 text-[#1B1E3D]/60 text-sm">Patient</th>
                      <th className="text-left py-3 px-4 text-[#1B1E3D]/60 text-sm">Adherence</th>
                      <th className="text-left py-3 px-4 text-[#1B1E3D]/60 text-sm">Performance</th>
                      <th className="text-left py-3 px-4 text-[#1B1E3D]/60 text-sm">Risk</th>
                      <th className="text-left py-3 px-4 text-[#1B1E3D]/60 text-sm">Next Appt</th>
                      <th className="text-left py-3 px-4 text-[#1B1E3D]/60 text-sm">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map((patient, index) => (
                      <tr key={index} className="border-b border-[#1B1E3D]/5 hover:bg-[#F9F9FB]">
                        <td className="py-4 px-4">{patient.name}</td>
                        <td className="py-4 px-4 font-semibold" style={{ color: getPercentageColor(patient.adherence, patient.risk) }}>{patient.adherence}%</td>
                        <td className="py-4 px-4 font-semibold" style={{ color: getPercentageColor(patient.performance, patient.risk) }}>{patient.performance}%</td>
                        <td className="py-4 px-4">
                          <span style={{ color: getRiskColor(patient.risk) }}>● {patient.risk}</span>
                        </td>
                        <td className="py-4 px-4">{patient.nextAppt}</td>
                        <td className="py-4 px-4 text-sm text-[#1B1E3D]/60">{patient.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patients">
          <Card className="rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
            <CardHeader>
              <CardTitle>All Patients</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#1B1E3D]/60">Search and filter functionality would go here...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bonuses">
          <PerformanceBonuses />
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Card className="rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
            <CardHeader>
              <CardTitle>Predictive Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#1B1E3D]/70 mb-6">
                View AI-driven actuarial risk modeling to proactively manage patient recovery outcomes.
              </p>
              <Button
                onClick={() => handleNavigate('actuarial-insights')}
                className="bg-gradient-to-r from-[#6F66FF] to-[#8C7BFF] hover:opacity-90 rounded-xl"
              >
                Open Actuarial Insights
              </Button>
            </CardContent>
          </Card>

          <PainTransitionMatrix />
        </TabsContent>
      </Tabs>
    </div>
  );
}
