import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/auth.service';
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
        await authRegister({ name, email, password, role });
        
        // After registration, use the registered role
        if (role === 'patient') {
          setShowBaseline(true);
        } else {
          handleBaselineComplete();
        }
      } else {
        // Login - check role matches
        await authLogin({ email, password });
        
        // Get the actual user role from localStorage (set by authService.login)
        const currentUser = authService.getCurrentUser();
        if (!currentUser) {
          setError('Login failed. Please try again.');
          setIsLoading(false);
          return;
        }
        
        const actualRole = currentUser.role;
        const selectedRoleForLogin = role; // The role selected in UI dropdown
        
        // Validate that the selected role matches the user's actual role
        // Map backend roles: 'clinician' -> 'clinician', 'patient' or 'user' -> 'patient'
        const userActualRole = actualRole === 'clinician' ? 'clinician' : 'patient';
        
        if (userActualRole !== selectedRoleForLogin) {
          setError(`You are registered as a ${userActualRole}. Please select "${userActualRole === 'clinician' ? 'Clinician' : 'Patient'}" to log in.`);
          setIsLoading(false);
          // Clear the auth state since role doesn't match
          await authService.logout();
          return;
        }

        // Role matches - proceed with login
        // After successful auth, show baseline for patients
        if (userActualRole === 'patient') {
          setShowBaseline(true);
        } else {
          handleBaselineComplete();
        }
      }
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(errorMessage || `${isSignUp ? 'Registration' : 'Login'} failed. Please try again.`);
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
          <h1 className="text-[#2C2E6F] mb-2">Welcome to RehabMax AI+</h1>
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
                    name="name"
                    type="text" 
                    autoComplete="name"
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
                  name="email"
                  type="email"
                  autoComplete={isSignUp ? "username" : "email"}
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
                  name="password"
                  type="password"
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  placeholder="••••••••"
                  className="bg-white border-gray-200"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role-select">I am a...</Label>
                <Select value={role} onValueChange={(value: 'patient' | 'clinician') => setRole(value)}>
                  <SelectTrigger id="role-select" name="role" className="bg-white border-gray-200">
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
              <Label htmlFor="injury-type-select">What are you recovering from?</Label>
              <Select>
                <SelectTrigger id="injury-type-select" name="injuryType">
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
                <Label htmlFor="pain-level-slider">Current Pain Level</Label>
                <span className="text-2xl font-semibold text-[#2C2E6F]">{painLevel[0]}/10</span>
              </div>
              <Slider 
                id="pain-level-slider"
                name="painLevel"
                value={painLevel}
                onValueChange={setPainLevel}
                max={10}
                step={1}
                className="py-4"
                aria-label="Current Pain Level"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>No pain</span>
                <span>Worst pain</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="primary-goal-select">Primary Goal</Label>
              <Select>
                <SelectTrigger id="primary-goal-select" name="primaryGoal">
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
