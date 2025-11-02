import { Activity, TrendingUp, Download, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { useState } from 'react';

const transitionMatrix = [
  { from: 'Mild', to: 'Mild', probability: 0.45, count: 89 },
  { from: 'Mild', to: 'Moderate', probability: 0.35, count: 69 },
  { from: 'Mild', to: 'Recovery', probability: 0.20, count: 39 },
  { from: 'Moderate', to: 'Mild', probability: 0.30, count: 52 },
  { from: 'Moderate', to: 'Moderate', probability: 0.50, count: 87 },
  { from: 'Moderate', to: 'Severe', probability: 0.20, count: 35 },
  { from: 'Severe', to: 'Moderate', probability: 0.40, count: 28 },
  { from: 'Severe', to: 'Severe', probability: 0.50, count: 35 },
  { from: 'Severe', to: 'Recovery', probability: 0.10, count: 7 },
  { from: 'Recovery', to: 'Mild', probability: 0.15, count: 12 },
  { from: 'Recovery', to: 'Recovery', probability: 0.85, count: 68 },
];

const states = ['Mild', 'Moderate', 'Severe', 'Recovery'];

// Get background color based on percentage
const getBackgroundColor = (percentage: number): string => {
  if (percentage < 25) return '#A7F3D0'; // green-200 - Low
  if (percentage < 40) return '#C7D2FE'; // indigo-200 - Medium
  if (percentage < 60) return '#FECACA'; // red-200 - High
  return '#FCA5A5'; // red-300 - Very High
};

// Get text color based on background
const getTextColor = (percentage: number): string => {
  // Use white text for darker backgrounds (>=40%)
  return percentage >= 40 ? 'text-white' : 'text-slate-800';
};

export default function PainTransitionMatrix() {
  const [viewMode, setViewMode] = useState<'heatmap' | 'sankey'>('heatmap');

  const getTransition = (from: string, to: string) => {
    return transitionMatrix.find(t => t.from === from && t.to === to);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-1">
            🧭 Milestone Mapping — Pain Transition Matrix
          </h2>
          <p className="text-slate-500 text-sm">
            Visualize patient movement between pain states
          </p>
        </div>
        <div className="flex gap-2">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'heatmap' | 'sankey')}>
            <TabsList className="bg-white rounded-xl p-1">
              <TabsTrigger value="heatmap" className="rounded-lg text-xs">
                Heatmap
              </TabsTrigger>
              <TabsTrigger value="sankey" className="rounded-lg text-xs">
                Flow
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="sm" className="rounded-lg">
            <Download className="mr-2" size={16} />
            Export
          </Button>
        </div>
      </div>

      {viewMode === 'heatmap' ? (
        <div className="space-y-6">
          {/* Heatmap Grid */}
          <div className="w-full overflow-x-auto">
            <table className="border-separate" style={{ borderSpacing: '14px', width: '100%' }}>
              <colgroup>
                <col style={{ width: '85px' }} />
                <col style={{ width: '80px' }} />
                <col style={{ width: '80px' }} />
                <col style={{ width: '80px' }} />
                <col style={{ width: '80px' }} />
              </colgroup>
              <thead>
                <tr>
                  <th className="text-sm font-bold text-slate-600 text-left p-2"></th>
                  {states.map((state) => (
                    <th key={state} className="text-sm font-bold text-slate-600 text-center py-3 px-4" style={{ fontWeight: '700' }}>
                      {state}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {states.map((fromState) => (
                  <tr key={fromState}>
                    {/* Row Label */}
                    <td className="text-sm font-bold text-slate-600 text-right pr-5 py-3 align-middle" style={{ fontWeight: '700' }}>
                      {fromState}
                    </td>
                    
                    {/* Data Cells */}
                    {states.map((toState) => {
                      const transition = getTransition(fromState, toState);
                      const percentage = transition ? Math.round(transition.probability * 100) : 0;
                      const isEmpty = !transition;
                      const bgColor = isEmpty ? '#F3F4F6' : getBackgroundColor(percentage);
                      const textColorClass = isEmpty ? 'text-slate-400' : getTextColor(percentage);
                      
                      return (
                        <td
                          key={`${fromState}-${toState}`}
                          className="p-0"
                          style={{ padding: '0', width: '80px' }}
                        >
                          <div
                            className="h-[48px] w-[80px] flex flex-col items-center justify-center rounded-md font-semibold transition-transform duration-300 hover:scale-[1.02] shadow-sm"
                            style={{
                              backgroundColor: bgColor
                            }}
                          >
                            <div className={`text-xs font-semibold mb-0 ${textColorClass}`}>
                              {isEmpty ? '—' : `${percentage}%`}
                            </div>
                            {!isEmpty && (
                              <p className={`text-[9px] mt-0 leading-tight ${percentage >= 40 ? 'text-white/80' : 'text-slate-600'}`}>
                                n={transition.count}
                              </p>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#A7F3D0' }}></div>
              <span className="text-xs text-slate-600 font-medium">Low (&lt;25%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#C7D2FE' }}></div>
              <span className="text-xs text-slate-600 font-medium">Medium (25-40%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#FECACA' }}></div>
              <span className="text-xs text-slate-600 font-medium">High (40-60%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#FCA5A5' }}></div>
              <span className="text-xs text-slate-600 font-medium">Very High (&gt;60%)</span>
            </div>
          </div>
        </div>
      ) : (
        /* Sankey Flow View */
        <div className="space-y-6">
          <div className="bg-slate-50 rounded-xl p-8 border border-slate-200">
            <svg className="w-full h-[400px]" viewBox="0 0 800 400">
              {/* Left nodes (From states) */}
              <g>
                <rect x="50" y="50" width="120" height="60" rx="8" fill="#6F66FF" opacity="0.8" />
                <text x="110" y="85" textAnchor="middle" fill="white" fontSize="14">Mild Pain</text>
                
                <rect x="50" y="150" width="120" height="60" rx="8" fill="#F87171" opacity="0.6" />
                <text x="110" y="185" textAnchor="middle" fill="white" fontSize="14">Moderate</text>
                
                <rect x="50" y="250" width="120" height="60" rx="8" fill="#F87171" opacity="0.9" />
                <text x="110" y="285" textAnchor="middle" fill="white" fontSize="14">Severe</text>
              </g>

              {/* Right nodes (To states) */}
              <g>
                <rect x="630" y="50" width="120" height="60" rx="8" fill="#6F66FF" opacity="0.8" />
                <text x="690" y="85" textAnchor="middle" fill="white" fontSize="14">Mild Pain</text>
                
                <rect x="630" y="150" width="120" height="60" rx="8" fill="#F87171" opacity="0.6" />
                <text x="690" y="185" textAnchor="middle" fill="white" fontSize="14">Moderate</text>
                
                <rect x="630" y="250" width="120" height="60" rx="8" fill="#3ECF8E" opacity="0.8" />
                <text x="690" y="285" textAnchor="middle" fill="white" fontSize="14">Recovery</text>
              </g>

              {/* Flow paths */}
              <defs>
                <linearGradient id="flow1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6F66FF" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#3ECF8E" stopOpacity="0.3" />
                </linearGradient>
                <linearGradient id="flow2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6F66FF" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#F87171" stopOpacity="0.2" />
                </linearGradient>
              </defs>

              {/* Sample flows */}
              <path
                d="M 170 80 Q 400 80 630 280"
                fill="none"
                stroke="url(#flow1)"
                strokeWidth="20"
                opacity="0.6"
              />
              <path
                d="M 170 180 Q 400 180 630 180"
                fill="none"
                stroke="url(#flow2)"
                strokeWidth="30"
                opacity="0.6"
              />
              <path
                d="M 170 280 Q 400 280 630 180"
                fill="none"
                stroke="#F87171"
                strokeWidth="15"
                opacity="0.3"
              />

              {/* Labels */}
              <text x="280" y="270" textAnchor="middle" fill="#3ECF8E" fontSize="12">20% → Recovery</text>
              <text x="400" y="170" textAnchor="middle" fill="#F87171" fontSize="12" opacity="0.7">50% stable</text>
            </svg>
          </div>

          <div className="text-center text-sm text-slate-600">
            Flow diagram showing patient transitions between pain states over the last 30 days
          </div>
        </div>
      )}

      {/* Key Insight Box */}
      <div className="mt-6 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
        <p className="text-indigo-700 text-sm font-medium mb-2">
          🔍 Key Insight: Patients transitioning from <b>Mild → Recovery</b> rose <b>10%</b> this month.
        </p>
        <p className="text-slate-600 text-xs">
          This improvement correlates with increased adherence rates. Consider applying similar approaches to moderate pain patients.
        </p>
      </div>

      {/* Footer Summary Cards */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center text-sm">
          <TrendingUp className="w-5 h-5 text-green-500 mb-2" />
          <p className="text-2xl font-semibold text-green-500 mb-1">20%</p>
          <p className="text-xs font-medium text-slate-700">Recovery Rate</p>
          <p className="text-xs text-slate-500 mt-1">From mild</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center text-sm">
          <Activity className="w-5 h-5 text-blue-500 mb-2" />
          <p className="text-2xl font-semibold text-blue-500 mb-1">50%</p>
          <p className="text-xs font-medium text-slate-700">Stability Rate</p>
          <p className="text-xs text-slate-500 mt-1">Moderate stable</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center text-sm">
          <AlertTriangle className="w-5 h-5 text-red-500 mb-2" />
          <p className="text-2xl font-semibold text-red-500 mb-1">20%</p>
          <p className="text-xs font-medium text-slate-700">At-Risk Rate</p>
          <p className="text-xs text-slate-500 mt-1">Moderate → Severe</p>
        </div>
      </div>
    </div>
  );
}
