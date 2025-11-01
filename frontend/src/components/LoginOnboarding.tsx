import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Card, CardContent } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { Activity, Chrome } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

interface LoginOnboardingProps {
  onLogin?: (role: 'patient' | 'clinician') => void;
}

export function LoginOnboarding({ onLogin }: LoginOnboardingProps) {
  const [showBaseline, setShowBaseline] = useState(false);
  const [role, setRole] = useState<'patient' | 'clinician'>('patient');
  const [painLevel, setPainLevel] = useState([5]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  const { login: authLogin, register: authRegister } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    
    setError('');
    setIsLoading(true);

    try {
      if (isSignUp) {
        if (!name.trim()) {
          setError('Please enter your name');
          setIsLoading(false);
          return;
        }
        await authRegister({ name, email, password });
      } else {
        await authLogin({ email, password });
      }

      // After successful auth, show baseline for patients
      if (role === 'patient') {
        setShowBaseline(true);
      } else {
        handleBaselineComplete();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || `${isSignUp ? 'Registration' : 'Login'} failed. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBaselineComplete = () => {
    setShowBaseline(false);
    if (onLogin) {
      onLogin(role);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E9E6F9] via-white to-white flex items-center justify-center p-8">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#2C2E6F] to-[#4DD2C1] rounded-2xl mb-4">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-[#2C2E6F] mb-2">Welcome to RehabQuest AI+</h1>
          <p className="text-gray-600">Your AI coach that sees your form, senses your effort, and predicts your progress</p>
        </div>

        {/* Login Card */}
        <Card className="border-0 shadow-2xl shadow-[#2C2E6F]/10">
          <CardContent className="p-8 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input 
                    id="name" 
                    type="text" 
                    placeholder="Your name"
                    className="bg-white border-gray-200"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={isSignUp}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="you@example.com"
                  className="bg-white border-gray-200"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••"
                  className="bg-white border-gray-200"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">I am a...</Label>
                <Select value={role} onValueChange={(value: 'patient' | 'clinician') => setRole(value)}>
                  <SelectTrigger className="bg-white border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="patient">Patient</SelectItem>
                    <SelectItem value="clinician">Clinician</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox 
                  id="terms" 
                  checked={agreedToTerms}
                  onCheckedChange={(checked: boolean) => setAgreedToTerms(checked === true)}
                />
                <label htmlFor="terms" className="text-sm text-gray-600">
                  I agree to the{' '}
                  <a href="#" className="text-[#2C2E6F] hover:underline">
                    privacy policy
                  </a>
                </label>
              </div>

              <div className="space-y-3">
                <Button 
                  type="submit"
                  className="w-full bg-[#2C2E6F] hover:bg-[#1f2050] text-white shadow-lg shadow-[#2C2E6F]/30 disabled:opacity-50"
                  disabled={isLoading || !agreedToTerms}
                >
                  {isLoading ? (isSignUp ? 'Signing Up...' : 'Logging In...') : (isSignUp ? 'Sign Up' : 'Log In')}
                </Button>

                <Button 
                  type="button"
                  variant="outline" 
                  className="w-full border-gray-200 hover:bg-[#E9E6F9] hover:text-[#2C2E6F] hover:border-[#2C2E6F]"
                >
                  <Chrome className="w-4 h-4 mr-2" />
                  Continue with Google
                </Button>
              </div>
            </form>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError('');
                  }}
                  className="text-[#2C2E6F] hover:underline"
                >
                  {isSignUp ? 'Log In' : 'Sign Up'}
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-500">
          Protected by encryption. Your data stays private.
        </p>
      </div>

      {/* Baseline Survey Dialog */}
      <Dialog open={showBaseline} onOpenChange={setShowBaseline}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Quick Baseline Assessment</DialogTitle>
            <DialogDescription>
              Help us personalize your recovery journey
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>What are you recovering from?</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select injury type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shoulder">Shoulder Injury</SelectItem>
                  <SelectItem value="knee">Knee Rehabilitation</SelectItem>
                  <SelectItem value="back">Lower Back Pain</SelectItem>
                  <SelectItem value="hip">Hip Replacement Recovery</SelectItem>
                  <SelectItem value="neck">Neck Strain</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Current Pain Level</Label>
                <span className="text-2xl font-semibold text-[#2C2E6F]">{painLevel[0]}/10</span>
              </div>
              <Slider 
                value={painLevel}
                onValueChange={setPainLevel}
                max={10}
                step={1}
                className="py-4"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>No pain</span>
                <span>Worst pain</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Primary Goal</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="What do you want to achieve?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pain">Reduce Pain</SelectItem>
                  <SelectItem value="mobility">Improve Mobility</SelectItem>
                  <SelectItem value="strength">Build Strength</SelectItem>
                  <SelectItem value="return">Return to Activity</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              className="w-full bg-[#2C2E6F] hover:bg-[#1f2050]"
              onClick={handleBaselineComplete}
            >
              Start My Journey
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
