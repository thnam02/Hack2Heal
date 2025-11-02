import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  TrendingUp,
  AlertTriangle,
  Activity,
  ArrowLeft,
  Download,
  Send,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Slider } from "./ui/slider";
import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

const kaplanMeierData = [
  { week: 0, current: 100, predicted: 100 },
  { week: 1, current: 98, predicted: 97 },
  { week: 2, current: 95, predicted: 94 },
  { week: 3, current: 92, predicted: 90 },
  { week: 4, current: 88, predicted: 85 },
  { week: 5, current: 84, predicted: 80 },
  { week: 6, current: 80, predicted: 75 },
  { week: 7, current: 76, predicted: 70 },
  { week: 8, current: 72, predicted: 65 },
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

const getRiskBadge = (score: number) => {
  if (score >= 0.7) return <Badge className="bg-red-500">High</Badge>;
  if (score >= 0.5) return <Badge className="bg-orange-500">Medium</Badge>;
  return <Badge className="bg-yellow-500">Low</Badge>;
};

interface ActuarialInsightsProps {
  onBack: () => void;
}

export default function ActuarialInsights({
  onBack,
}: ActuarialInsightsProps) {
  const [adherenceChange, setAdherenceChange] = useState([0]);
  const dropoffReduction = Math.round(adherenceChange[0] * 1.2);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4 hover:bg-[#6F66FF]/10"
        >
          <ArrowLeft className="mr-2" size={18} />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl mb-2">
          Actuarial Intelligence — Recovery Risk Index (RRI)
        </h1>
        <p className="text-[#1B1E3D]/60">
          Predictive analytics for proactive rehab management.
        </p>

        <div className="flex gap-3 mt-4">
          <Button className="bg-gradient-to-r from-[#6F66FF] to-[#8C7BFF] hover:opacity-90 rounded-xl">
            Run New Forecast
          </Button>
          <Button variant="outline" className="rounded-xl">
            <Download className="mr-2" size={18} />
            Generate Risk Report (CSV)
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <Card className="rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-[#1B1E3D]/60">
                Avg Drop-Off Probability
              </CardTitle>
              <AlertTriangle
                className="text-[#F87171]"
                size={20}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-[#F87171] mb-1">
              38%
            </div>
            <p className="text-sm text-[#1B1E3D]/60">
              Portfolio average
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-[#1B1E3D]/60">
                Avg Recovery Duration
              </CardTitle>
              <Activity className="text-[#6F66FF]" size={20} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-[#6F66FF] mb-1">
              7.4 weeks
            </div>
            <p className="text-sm text-[#1B1E3D]/60">
              Predicted timeline
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-[#1B1E3D]/60">
                Portfolio Risk Score
              </CardTitle>
              <TrendingUp
                className="text-[#F87171]/60"
                size={20}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-[#F87171]/60 mb-1">
              0.41
            </div>
            <p className="text-sm text-[#1B1E3D]/60">
              Moderate risk
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Kaplan-Meier Curve */}
        <Card className="rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
          <CardHeader>
            <CardTitle>Kaplan-Meier Recovery Curve</CardTitle>
            <p className="text-sm text-[#1B1E3D]/60 mt-1">
              Probability of continued engagement over time
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={kaplanMeierData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#E5E7EB"
                />
                <XAxis
                  dataKey="week"
                  stroke="#1B1E3D"
                  opacity={0.6}
                  label={{
                    value: "Weeks",
                    position: "insideBottom",
                    offset: -5,
                  }}
                />
                <YAxis
                  stroke="#1B1E3D"
                  opacity={0.6}
                  domain={[0, 100]}
                  label={{
                    value: "Survival Probability (%)",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="current"
                  stroke="#6F66FF"
                  strokeWidth={3}
                  name="Current Trajectory"
                  dot={{ fill: "#6F66FF", r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="#3ECF8E"
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  name="Predicted Path"
                  dot={{ fill: "#3ECF8E", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Risk Distribution Heatmap */}
        <Card className="rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
          <CardHeader>
            <CardTitle>
              Risk Distribution by Injury Type
            </CardTitle>
            <p className="text-sm text-[#1B1E3D]/60 mt-1">
              Color-coded risk assessment across conditions
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {["Shoulder", "Neck", "Knee", "Back", "Hip"].map(
                (injury, index) => {
                  const risk = [0.35, 0.52, 0.28, 0.48, 0.38][
                    index
                  ];
                  const color =
                    risk < 0.35
                      ? "#3ECF8E"
                      : risk < 0.5
                        ? "#F87171aa"
                        : "#F87171";

                  return (
                    <div key={injury} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>{injury}</span>
                        <span className="text-[#1B1E3D]/60">
                          RRI: {risk.toFixed(2)}
                        </span>
                      </div>
                      <div
                        className="h-8 rounded-lg overflow-hidden"
                        style={{
                          backgroundColor: color,
                          opacity: 0.8,
                        }}
                      >
                        <div className="h-full flex items-center px-3 text-white text-sm">
                          {risk < 0.35
                            ? "Low Risk"
                            : risk < 0.5
                              ? "Medium Risk"
                              : "High Risk"}
                        </div>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scenario Simulator */}
      <Card className="rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="text-[#6F66FF]" />
            Scenario Simulator
          </CardTitle>
          <p className="text-sm text-[#1B1E3D]/60 mt-1">
            Interactive modeling to predict impact of
            intervention strategies
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm">
                  Adherence Improvement
                </label>
                <Badge variant="outline">
                  {adherenceChange[0] > 0 ? "+" : ""}
                  {adherenceChange[0]}%
                </Badge>
              </div>
              <Slider
                value={adherenceChange}
                onValueChange={setAdherenceChange}
                min={-20}
                max={20}
                step={1}
                className="w-full"
              />
            </div>

            <div className="bg-gradient-to-br from-[#6F66FF]/10 to-[#8C7BFF]/10 rounded-xl p-6 border-2 border-[#6F66FF]/30">
              <h4 className="mb-3">Predicted Impact</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[#1B1E3D]/60 mb-1">
                    Drop-off Risk Change
                  </p>
                  <p
                    className={`text-2xl ${dropoffReduction > 0 ? "text-[#3ECF8E]" : dropoffReduction < 0 ? "text-[#F87171]" : "text-[#1B1E3D]"}`}
                  >
                    {dropoffReduction > 0
                      ? "↓"
                      : dropoffReduction < 0
                        ? "↑"
                        : "→"}{" "}
                    {Math.abs(dropoffReduction)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[#1B1E3D]/60 mb-1">
                    Expected Recovery Time
                  </p>
                  <p
                    className={`text-2xl ${adherenceChange[0] > 0 ? "text-[#3ECF8E]" : adherenceChange[0] < 0 ? "text-[#F87171]" : "text-[#1B1E3D]"}`}
                  >
                    {7.4 - adherenceChange[0] * 0.15} weeks
                  </p>
                </div>
              </div>
              <p className="text-sm text-[#1B1E3D]/70 mt-4 italic">
                {adherenceChange[0] > 0
                  ? `If adherence ↑${adherenceChange[0]}%, drop-off risk ↓${dropoffReduction}%`
                  : adherenceChange[0] < 0
                    ? `If adherence ↓${Math.abs(adherenceChange[0])}%, drop-off risk ↑${Math.abs(dropoffReduction)}%`
                    : "Adjust slider to simulate different scenarios"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patient Risk Analysis */}
      <Card className="rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Patient Risk Analysis
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

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-[#1B1E3D]/60">
        <p>
          Powered by{" "}
          <span className="text-[#6F66FF]">
            RehabQuest AI+ Predictive Core (v1.2)
          </span>{" "}
          — combining clinical, behavioural, and sensor data for
          actuarial recovery forecasting.
        </p>
      </div>
    </div>
  );
}

