import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Search, Mail, Phone, Calendar, TrendingUp, FileText } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from './ui/sheet';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const patients = [
  {
    id: '1',
    name: 'Rose Martinez',
    age: 34,
    condition: 'Shoulder Rehabilitation',
    recoveryStage: 'Phase 1: Mobility',
    progress: 78,
    nextSession: '2025-11-02',
    painTrend: [7, 6.5, 6, 5.5, 5, 4, 3.5, 3],
    adherence: 96,
    letterStatus: 'Written',
    riskLevel: 'low'
  },
  {
    id: '2',
    name: 'Michael Chen',
    age: 45,
    condition: 'Knee Rehabilitation',
    recoveryStage: 'Phase 2: Strengthening',
    progress: 92,
    nextSession: '2025-11-03',
    painTrend: [6, 5.5, 5, 4.5, 4, 3.5, 3, 2.5],
    adherence: 88,
    letterStatus: 'Read',
    riskLevel: 'low'
  },
  {
    id: '3',
    name: 'Sarah Johnson',
    age: 28,
    condition: 'Lower Back Pain',
    recoveryStage: 'Phase 1: Mobility',
    progress: 45,
    nextSession: '2025-11-04',
    painTrend: [8, 7.5, 7, 7, 6.5, 6, 6, 5.5],
    adherence: 62,
    letterStatus: 'Not Written',
    riskLevel: 'medium'
  },
  {
    id: '4',
    name: 'David Kim',
    age: 52,
    condition: 'Hip Replacement Recovery',
    recoveryStage: 'Phase 3: Return to Activity',
    progress: 85,
    nextSession: '2025-11-01',
    painTrend: [7, 6, 5, 4.5, 4, 3.5, 3, 2],
    adherence: 94,
    letterStatus: 'Written',
    riskLevel: 'low'
  }
];

export function PatientManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [conditionFilter, setConditionFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  const [selectedPatient, setSelectedPatient] = useState<typeof patients[0] | null>(null);

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         patient.condition.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCondition = conditionFilter === 'all' || patient.condition.includes(conditionFilter);
    const matchesStage = stageFilter === 'all' || patient.recoveryStage.includes(stageFilter);
    
    return matchesSearch && matchesCondition && matchesStage;
  });

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'medium':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-[#2C2E6F] mb-2">Patient Management</h1>
        <p className="text-gray-600">Track and manage patient recovery progress</p>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-2">
              <label htmlFor="search-patients" className="sr-only">Search by name or condition</label>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="search-patients"
                name="searchPatients"
                type="search"
                autoComplete="off"
                placeholder="Search by name or condition..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={conditionFilter} onValueChange={setConditionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="By Condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Conditions</SelectItem>
                <SelectItem value="Shoulder">Shoulder</SelectItem>
                <SelectItem value="Knee">Knee</SelectItem>
                <SelectItem value="Back">Back</SelectItem>
                <SelectItem value="Hip">Hip</SelectItem>
              </SelectContent>
            </Select>

            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Recovery Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="Phase 1">Phase 1: Mobility</SelectItem>
                <SelectItem value="Phase 2">Phase 2: Strengthening</SelectItem>
                <SelectItem value="Phase 3">Phase 3: Return to Activity</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Patient Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredPatients.map((patient) => (
          <Card 
            key={patient.id}
            className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer"
            onClick={() => setSelectedPatient(patient)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#2C2E6F] to-[#4DD2C1] rounded-full flex items-center justify-center text-white text-xl">
                    {patient.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="text-[#2C2E6F] mb-1">{patient.name}</h3>
                    <p className="text-sm text-gray-600">{patient.condition} • Age {patient.age}</p>
                  </div>
                </div>
                <Badge variant="outline" className={getRiskColor(patient.riskLevel)}>
                  {patient.riskLevel} risk
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 bg-[#E9E6F9] rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Recovery Stage</p>
                  <p className="text-sm text-[#2C2E6F]">{patient.recoveryStage}</p>
                </div>
                <div className="p-3 bg-[#E9E6F9] rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Next Session</p>
                  <p className="text-sm text-[#2C2E6F]">
                    {new Date(patient.nextSession).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="text-[#2C2E6F]">{patient.progress}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#2C2E6F] to-[#4DD2C1]"
                    style={{ width: `${patient.progress}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-gray-600">
                  <TrendingUp className="w-4 h-4" />
                  <span>Adherence: {patient.adherence}%</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <FileText className="w-4 h-4" />
                  <span>{patient.letterStatus}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Patient Detail Sheet */}
      <Sheet open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedPatient && (
            <>
              <SheetHeader>
                <SheetTitle className="text-[#2C2E6F]">{selectedPatient.name}</SheetTitle>
                <SheetDescription>
                  {selectedPatient.condition} • {selectedPatient.recoveryStage}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 mt-6">
                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 p-3 bg-[#E9E6F9] rounded-lg">
                    <Mail className="w-4 h-4 text-[#2C2E6F]" />
                    <div>
                      <p className="text-xs text-gray-600">Email</p>
                      <p className="text-sm text-[#2C2E6F]">patient@email.com</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-[#E9E6F9] rounded-lg">
                    <Phone className="w-4 h-4 text-[#2C2E6F]" />
                    <div>
                      <p className="text-xs text-gray-600">Phone</p>
                      <p className="text-sm text-[#2C2E6F]">+1 (555) 000-0000</p>
                    </div>
                  </div>
                </div>

                {/* Pain Trend Chart */}
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-sm">Pain Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={150}>
                      <LineChart data={selectedPatient.painTrend.map((pain, i) => ({ day: i + 1, pain }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="day" stroke="#6b7280" style={{ fontSize: '12px' }} />
                        <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} domain={[0, 10]} />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="pain" 
                          stroke="#FF8A73" 
                          strokeWidth={2}
                          dot={{ fill: '#FF8A73', r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Adherence Trend */}
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-sm">Exercise Adherence</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Current Week</span>
                        <span className="text-sm text-[#4DD2C1]">{selectedPatient.adherence}%</span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#4DD2C1]"
                          style={{ width: `${selectedPatient.adherence}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Form Accuracy Heatmap */}
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-sm">Form Accuracy (Per Exercise)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {[
                        { exercise: 'Shoulder Rotation', accuracy: 94 },
                        { exercise: 'Neck Mobility', accuracy: 88 },
                        { exercise: 'Upper Back Stretch', accuracy: 92 }
                      ].map((item, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <span className="text-sm text-gray-700 w-40">{item.exercise}</span>
                          <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                            <div 
                              className={`h-full flex items-center justify-end pr-2 text-xs text-white ${
                                item.accuracy >= 90 ? 'bg-green-500' :
                                item.accuracy >= 75 ? 'bg-[#4DD2C1]' :
                                'bg-orange-500'
                              }`}
                              style={{ width: `${item.accuracy}%` }}
                            >
                              {item.accuracy}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Future-Self Letter Status */}
                <Card className="border-0 shadow-sm bg-gradient-to-br from-[#E9E6F9] to-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-[#2C2E6F]" />
                        <div>
                          <p className="text-sm text-[#2C2E6F]">Future-Self Letter</p>
                          <p className="text-xs text-gray-600">{selectedPatient.letterStatus}</p>
                        </div>
                      </div>
                      {selectedPatient.letterStatus === 'Written' && (
                        <Badge className="bg-[#4DD2C1]">Active</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Notes */}
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-sm">Clinician Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="p-3 bg-gray-50 rounded-lg text-sm">
                        <p className="text-gray-600 mb-1">Nov 1, 2025</p>
                        <p className="text-gray-700">Patient achieved 92% form accuracy in today's session. Excellent progress on shoulder mobility.</p>
                      </div>
                      <Button variant="outline" className="w-full" size="sm">
                        Add Note
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-3 pt-4">
                  <Button className="flex-1 bg-[#2C2E6F] hover:bg-[#1f2050]">
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Session
                  </Button>
                  <Button variant="outline" className="flex-1">
                    View Full Profile
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
