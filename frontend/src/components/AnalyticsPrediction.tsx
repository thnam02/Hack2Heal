import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Brain, 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle,
  Send,
  Activity,
} from 'lucide-react';
import { 
  LineChart, 
  Line,
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';

const painForecastData = [
  { day: 'Today', actual: 3, predicted: null },
  { day: 'Day 2', actual: null, predicted: 2.8 },
  { day: 'Day 3', actual: null, predicted: 2.6 },
  { day: 'Day 4', actual: null, predicted: 2.9 },
  { day: 'Day 5', actual: null, predicted: 2.4 },
  { day: 'Day 6', actual: null, predicted: 2.2 },
  { day: 'Day 7', actual: null, predicted: 2.0 }
];

const heatmapData = [
  { adherence: '80-100%', dropoffRisk: 0.05, count: 42 },
  { adherence: '60-80%', dropoffRisk: 0.25, count: 28 },
  { adherence: '40-60%', dropoffRisk: 0.55, count: 15 },
  { adherence: '20-40%', dropoffRisk: 0.78, count: 8 },
  { adherence: '0-20%', dropoffRisk: 0.92, count: 5 }
];

const atRiskPatients = [
  {
    name: 'Sarah Johnson',
    riskScore: 0.72,
    lastActivity: '3 days ago',
    painSpike: 'Likely in 2 days',
    action: 'Send check-in message'
  },
  {
    name: 'Robert Williams',
    riskScore: 0.65,
    lastActivity: '2 days ago',
    painSpike: 'Unlikely',
    action: 'Schedule follow-up'
  },
  {
    name: 'Jennifer Lee',
    riskScore: 0.58,
    lastActivity: '4 days ago',
    painSpike: 'Possible in 3 days',
    action: 'Review exercise plan'
  },
  {
    name: 'Mark Thompson',
    riskScore: 0.51,
    lastActivity: '1 day ago',
    painSpike: 'Unlikely',
    action: 'Monitor progress'
  }
];

const recoveryPhases = [
  { phase: 'Phase 1: Mobility', patients: 35, avgProgress: 62, color: '#FF8A73' },
  { phase: 'Phase 2: Strengthening', patients: 28, avgProgress: 78, color: '#4DD2C1' },
  { phase: 'Phase 3: Return', patients: 18, avgProgress: 91, color: '#2C2E6F' }
];

export function AnalyticsPrediction() {
  const getRiskBadge = (score: number) => {
    if (score >= 0.7) return <Badge className="bg-red-500">High</Badge>;
    if (score >= 0.5) return <Badge className="bg-orange-500">Medium</Badge>;
    return <Badge className="bg-yellow-500">Low</Badge>;
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[#2C2E6F] mb-2 flex items-center gap-2">
            <Brain className="w-8 h-8" />
            AI Insights & Predictions
          </h1>
          <p className="text-gray-600">Predictive analytics powered by machine learning</p>
        </div>
        <Badge className="bg-gradient-to-r from-[#2C2E6F] to-[#4DD2C1] text-white px-4 py-2">
          Real-time Analysis
        </Badge>
      </div>

      {/* Key Insights */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-[#E9E6F9] to-white">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <Brain className="w-10 h-10 text-[#2C2E6F]" />
            <div>
              <h3 className="text-[#2C2E6F]">This Week's Insights</h3>
              <p className="text-sm text-gray-600">AI-generated summary across all patients</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2 p-3 bg-white rounded-lg">
              <TrendingDown className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Avg Pain</p>
                <p className="text-[#2C2E6F]">↓12%</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-white rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">ROM Improvement</p>
                <p className="text-[#2C2E6F]">↑8°</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-white rounded-lg">
              <Activity className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Adherence</p>
                <p className="text-[#2C2E6F]">↑10%</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Drop-off Risk Heatmap */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-[#2C2E6F]">Drop-off Risk vs Adherence</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={heatmapData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" domain={[0, 1]} stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis type="category" dataKey="adherence" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip />
                <Bar dataKey="dropoffRisk" name="Drop-off Risk">
                  {heatmapData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill={
                        entry.dropoffRisk >= 0.7 ? '#ef4444' :
                        entry.dropoffRisk >= 0.4 ? '#f97316' :
                        '#22c55e'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 flex items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded" />
                <span className="text-gray-600">Low Risk</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-500 rounded" />
                <span className="text-gray-600">Medium Risk</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded" />
                <span className="text-gray-600">High Risk</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pain Forecast */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-[#2C2E6F]">Pain Forecast (Next 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={painForecastData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} domain={[0, 10]} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#FF8A73" 
                  strokeWidth={3}
                  name="Actual"
                  dot={{ fill: '#FF8A73', r: 4 }}
                  connectNulls={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="predicted" 
                  stroke="#2C2E6F" 
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  name="Predicted"
                  dot={{ fill: '#2C2E6F', r: 4 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 p-3 bg-[#E9E6F9] rounded-lg">
              <p className="text-sm text-gray-700">
                <strong className="text-[#2C2E6F]">AI Prediction:</strong> Pain levels expected to decrease by 33% over the next week based on current adherence patterns.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recovery Phases Timeline */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-[#2C2E6F]">Recovery Phases Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {recoveryPhases.map((phase, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: phase.color }}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="text-[#2C2E6F]">{phase.phase}</h4>
                      <p className="text-sm text-gray-600">{phase.patients} patients</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[#2C2E6F]">{phase.avgProgress}%</p>
                    <p className="text-xs text-gray-600">Avg Progress</p>
                  </div>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full"
                    style={{ 
                      width: `${phase.avgProgress}%`,
                      backgroundColor: phase.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* At-Risk Patients Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-[#2C2E6F] flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              At-Risk Patients
            </CardTitle>
            <Badge variant="outline" className="text-orange-600 border-orange-200">
              {atRiskPatients.length} patients need attention
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Risk Score</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead>Predicted Pain Spike</TableHead>
                <TableHead>Suggested Action</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {atRiskPatients.map((patient, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-[#2C2E6F] to-[#4DD2C1] rounded-full flex items-center justify-center text-white text-sm">
                        {patient.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-[#2C2E6F]">{patient.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getRiskBadge(patient.riskScore)}
                      <span className="text-sm text-gray-600">{patient.riskScore.toFixed(2)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600">{patient.lastActivity}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline"
                      className={patient.painSpike.includes('Likely') ? 'border-red-200 text-red-600' : 
                                patient.painSpike.includes('Possible') ? 'border-orange-200 text-orange-600' :
                                'border-green-200 text-green-600'}
                    >
                      {patient.painSpike}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-700">{patient.action}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" className="gap-2">
                      <Send className="w-3 h-3" />
                      Send Nudge
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* AI Transparency Note */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-[#E9E6F9] to-white">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Brain className="w-6 h-6 text-[#2C2E6F] flex-shrink-0 mt-1" />
            <div>
              <h4 className="text-[#2C2E6F] mb-2">How AI Predictions Work</h4>
              <p className="text-sm text-gray-600 mb-3">
                Our predictive models analyze exercise adherence, pain trends, form quality, and engagement patterns using XGBoost and LSTM neural networks. 
                Risk scores are calculated based on deviation from expected recovery trajectories.
              </p>
              <p className="text-sm text-gray-600">
                <strong>Transparency:</strong> All predictions include confidence intervals and are reviewed by clinicians before patient intervention.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
