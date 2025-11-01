import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';
import { Upload, FileText, Sparkles, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

export function AIPlanReader() {
  const [uploaded, setUploaded] = useState(false);
  const [planGenerated, setPlanGenerated] = useState(false);
  const [frequency, setFrequency] = useState([3]);
  const [intensity, setIntensity] = useState([5]);

  const handleUpload = () => {
    setUploaded(true);
  };

  const handleGeneratePlan = () => {
    setPlanGenerated(true);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-[#2C2E6F] mb-2">AI Plan Reader</h1>
        <p className="text-gray-600">Upload your doctor's referral or rehabilitation plan for AI analysis</p>
      </div>

      {/* Upload Area */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-8">
          <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-[#2C2E6F] transition-colors">
            <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-[#2C2E6F] mb-2">Upload doctor's referral or rehab description</h3>
            <p className="text-gray-600 mb-4">Drop your PDF, image, or text file here, or click to browse</p>
            <Button 
              onClick={handleUpload}
              className="bg-[#2C2E6F] hover:bg-[#1f2050]"
            >
              <FileText className="w-4 h-4 mr-2" />
              Select File
            </Button>
          </div>

          {uploaded && (
            <Alert className="mt-4 border-[#4DD2C1] bg-[#4DD2C1]/10">
              <CheckCircle2 className="h-4 w-4 text-[#4DD2C1]" />
              <AlertDescription className="text-[#2C2E6F]">
                File uploaded successfully: shoulder_rehab_plan.pdf
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* AI Analysis Card */}
      {uploaded && (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-[#E9E6F9] to-white">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#2C2E6F]" />
              <CardTitle className="text-[#2C2E6F]">AI Analysis Summary</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-6 bg-white rounded-xl shadow-sm">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#2C2E6F] to-[#4DD2C1] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-[#2C2E6F] mb-2">Detected: Shoulder Rehabilitation — Phase 1 Mobility</h3>
                  <p className="text-gray-600">6 weeks progressive plan focusing on range of motion and pain reduction</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="p-4 bg-[#E9E6F9] rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Condition</p>
                  <p className="text-[#2C2E6F]">Rotator Cuff Strain</p>
                </div>
                <div className="p-4 bg-[#E9E6F9] rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Phase</p>
                  <p className="text-[#2C2E6F]">Phase 1: Mobility</p>
                </div>
                <div className="p-4 bg-[#E9E6F9] rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Duration</p>
                  <p className="text-[#2C2E6F]">6 weeks</p>
                </div>
              </div>
            </div>

            {/* Editable Parameters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white rounded-xl shadow-sm">
              <div className="space-y-3">
                <Label>Weekly Frequency (sessions/week)</Label>
                <div className="flex items-center gap-4">
                  <Slider 
                    value={frequency}
                    onValueChange={setFrequency}
                    max={7}
                    min={1}
                    step={1}
                    className="flex-1"
                  />
                  <Badge className="bg-[#2C2E6F]">{frequency[0]}x/week</Badge>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Intensity Level</Label>
                <div className="flex items-center gap-4">
                  <Slider 
                    value={intensity}
                    onValueChange={setIntensity}
                    max={10}
                    min={1}
                    step={1}
                    className="flex-1"
                  />
                  <Badge className="bg-[#4DD2C1]">{intensity[0]}/10</Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Sets per Exercise</Label>
                <Input type="number" defaultValue="3" className="bg-white" />
              </div>

              <div className="space-y-2">
                <Label>Rest Days</Label>
                <Input type="text" defaultValue="Sunday, Wednesday" className="bg-white" />
              </div>
            </div>

            <Button 
              onClick={handleGeneratePlan}
              className="w-full bg-gradient-to-r from-[#2C2E6F] to-[#4DD2C1] text-white shadow-lg hover:shadow-xl transition-all"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Personalized Plan
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Generated Plan Output */}
      {planGenerated && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-[#2C2E6F]">Generated Recovery Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Goals */}
            <div>
              <h4 className="text-[#2C2E6F] mb-3">Recovery Goals</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-3 bg-[#E9E6F9] rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-[#4DD2C1]" />
                  <span className="text-gray-700">Reduce pain to 2/10 or below</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-[#E9E6F9] rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-[#4DD2C1]" />
                  <span className="text-gray-700">Restore 90% range of motion</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-[#E9E6F9] rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-[#4DD2C1]" />
                  <span className="text-gray-700">Strengthen rotator cuff muscles</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-[#E9E6F9] rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-[#4DD2C1]" />
                  <span className="text-gray-700">Return to daily activities</span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h4 className="text-[#2C2E6F] mb-3">6-Week Timeline</h4>
              <div className="space-y-3">
                {[
                  { week: 'Weeks 1-2', focus: 'Pain reduction & gentle mobility', color: 'from-[#FF8A73] to-[#ff7a5c]' },
                  { week: 'Weeks 3-4', focus: 'Progressive range of motion', color: 'from-[#4DD2C1] to-[#3bc1b0]' },
                  { week: 'Weeks 5-6', focus: 'Strength building & stabilization', color: 'from-[#2C2E6F] to-[#4a4f9e]' }
                ].map((phase, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className={`w-32 h-12 bg-gradient-to-r ${phase.color} rounded-lg flex items-center justify-center text-white flex-shrink-0`}>
                      {phase.week}
                    </div>
                    <p className="text-gray-700">{phase.focus}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Exercises */}
            <div>
              <h4 className="text-[#2C2E6F] mb-3">Key Exercises Auto-Filled</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'Pendulum Swings', sets: 3, reps: 10 },
                  { name: 'Shoulder Rotation (External)', sets: 3, reps: 12 },
                  { name: 'Wall Slides', sets: 2, reps: 8 },
                  { name: 'Scapular Squeezes', sets: 3, reps: 15 }
                ].map((exercise, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg hover:border-[#2C2E6F] transition-colors">
                    <h4 className="text-[#2C2E6F] mb-1">{exercise.name}</h4>
                    <p className="text-sm text-gray-600">{exercise.sets} sets × {exercise.reps} reps</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button className="flex-1 bg-[#2C2E6F] hover:bg-[#1f2050]">
                Save to My Plan
              </Button>
              <Button variant="outline" className="flex-1">
                Edit Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
