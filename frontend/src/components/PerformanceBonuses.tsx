import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { TrendingUp, Award, Info } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "./ui/hover-card";

const engagementData = [
  { day: "Day 1", adherence: 78 },
  { day: "Day 5", adherence: 82 },
  { day: "Day 10", adherence: 85 },
  { day: "Day 15", adherence: 88 },
  { day: "Day 20", adherence: 91 },
  { day: "Day 25", adherence: 93 },
  { day: "Day 30", adherence: 94 },
];

export default function PerformanceBonuses() {
  const portfolioCompletion = 94; // Current portfolio completion rate
  const currentTier =
    portfolioCompletion >= 90
      ? "A"
      : portfolioCompletion >= 75
        ? "B"
        : "C";
  const bonusPercentage =
    currentTier === "A" ? 10 : currentTier === "B" ? 0 : -5;

  return (
    <Card className="rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] bg-gradient-to-br from-[#F59E0B]/5 to-[#3ECF8E]/5 border-2 border-[#F59E0B]/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#F59E0B] to-[#F97316] flex items-center justify-center">
              <Award className="text-white" size={24} />
            </div>
            <div>
              <CardTitle className="text-xl">
                Clinic Performance Incentives
              </CardTitle>
              <p className="text-sm text-[#1B1E3D]/60">
                Shared-Savings Dashboard
              </p>
            </div>
          </div>
          <HoverCard>
            <HoverCardTrigger>
              <Info
                className="text-[#1B1E3D]/40 cursor-help"
                size={20}
              />
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="space-y-2">
                <h4 className="text-sm">
                  How Performance Bonuses Work
                </h4>
                <p className="text-sm text-[#1B1E3D]/70">
                  High completion rates increase your clinic's
                  reimbursement potential. Bonuses are
                  calculated based on aggregated patient
                  outcomes.
                </p>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tier Status Card */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[#1B1E3D]/60">
                Portfolio Completion
              </span>
              <Badge
                className={`${
                  currentTier === "A"
                    ? "bg-gradient-to-r from-[#F59E0B] to-[#F97316]"
                    : currentTier === "B"
                      ? "bg-[#3ECF8E]"
                      : "bg-[#F87171]"
                } text-white border-0`}
              >
                Tier {currentTier}
              </Badge>
            </div>
            <div className="text-3xl mb-1" style={{ color: '#3ECF8E' }}>
              {portfolioCompletion}%
            </div>
            <p className="text-sm" style={{ color: currentTier === "A" ? '#3ECF8E' : currentTier === "B" ? '#F59E0B' : '#F87171' }}>
              {currentTier === "A" && "10% performance bonus"}
              {currentTier === "B" && "Standard rate"}
              {currentTier === "C" && "Below target"}
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp
                className="text-[#3ECF8E]"
                size={20}
              />
              <span className="text-sm text-[#1B1E3D]/60">
                Current Tier
              </span>
            </div>
            <div className="text-3xl mb-1" style={{ color: currentTier === 'A' ? '#3ECF8E' : currentTier === 'B' ? '#6F66FF' : '#F59E0B' }}>
              Tier {currentTier}
            </div>
            <p className="text-sm" style={{ color: currentTier === "A" ? '#3ECF8E' : currentTier === "B" ? '#F59E0B' : '#F87171' }}>
              {currentTier === "A" && "≥ 90% completion"}
              {currentTier === "B" && "75-89% completion"}
              {currentTier === "C" && "< 75% completion"}
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Award className="text-[#6F66FF]" size={20} />
              <span className="text-sm text-[#1B1E3D]/60">
                Bonus Rate
              </span>
            </div>
            <div
              className="text-3xl mb-1"
              style={{ 
                color: bonusPercentage > 0 ? '#3ECF8E' : bonusPercentage === 0 ? '#1B1E3D' : '#F87171',
                opacity: bonusPercentage === 0 ? 0.6 : 1
              }}
            >
              {bonusPercentage > 0 ? "+" : ""}
              {bonusPercentage}%
            </div>
            <p className="text-sm text-[#1B1E3D]/60">
              Performance bonus
            </p>
          </div>
        </div>

        {/* Tier Breakdown */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h4 className="mb-4">Performance Tier System</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-[#3ECF8E]/10 to-[#3ECF8E]/5 border border-[#3ECF8E]/20">
              <div className="flex items-center gap-3">
                <Badge className="bg-[#3ECF8E] text-white border-0">
                  Tier A
                </Badge>
                <span className="text-sm" style={{ color: '#3ECF8E' }}>
                  ≥ 90% portfolio completion
                </span>
              </div>
              <span style={{ color: '#3ECF8E' }}>+10% bonus</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/20">
              <div className="flex items-center gap-3">
                <Badge className="bg-[#F59E0B] text-white border-0">
                  Tier B
                </Badge>
                <span className="text-sm" style={{ color: '#F59E0B' }}>
                  75-89% portfolio completion
                </span>
              </div>
              <span style={{ color: '#F59E0B' }}>
                Standard rate
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#F87171]/10 border border-[#F87171]/20">
              <div className="flex items-center gap-3">
                <Badge className="bg-[#F87171] text-white border-0">
                  Tier C
                </Badge>
                <span className="text-sm" style={{ color: '#F87171' }}>
                  {"<"} 75% portfolio completion
                </span>
              </div>
              <span style={{ color: '#F87171' }}>
                Below target
              </span>
            </div>
          </div>
        </div>

        {/* Patient Engagement Trend */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4>Patient Engagement Trend</h4>
            <span className="text-sm text-[#1B1E3D]/60">
              Last 30 days
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={engagementData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E5E7EB"
              />
              <XAxis
                dataKey="day"
                stroke="#1B1E3D"
                opacity={0.6}
              />
              <YAxis
                stroke="#1B1E3D"
                opacity={0.6}
                domain={[0, 100]}
              />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="adherence"
                stroke="#6F66FF"
                strokeWidth={3}
                name="Avg Adherence %"
                dot={{ fill: "#6F66FF", r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Footer Note */}
        <div className="bg-[#6F66FF]/5 rounded-xl p-4 border border-[#6F66FF]/20">
          <p className="text-sm text-[#1B1E3D]/70">
            📊 Metrics based on aggregated RRI scores — no
            patient identifiers used.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

