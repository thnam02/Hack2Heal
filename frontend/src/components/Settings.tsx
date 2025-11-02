import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, 
  Bell, 
  Smartphone, 
  Shield, 
  Download,
  Moon,
  Mail,
  MessageSquare
} from 'lucide-react';

export function Settings() {
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);

  // Parse user name into first and last name
  const { firstName, lastName, userInitial } = useMemo(() => {
    if (!user?.name) {
      return { firstName: '', lastName: '', userInitial: 'U' };
    }
    
    const nameParts = user.name.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    const userInitial = firstName.charAt(0).toUpperCase() || 'U';
    
    return { firstName, lastName, userInitial };
  }, [user?.name]);

  const connectedDevices = [
    { name: 'Apple Health', connected: true, icon: '🍎' },
    { name: 'Fitbit', connected: false, icon: '⌚' },
    { name: 'Google Fit', connected: true, icon: '📱' }
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-[#2C2E6F] mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="bg-white border border-gray-200">
          <TabsTrigger value="account" className="gap-2">
            <User className="w-4 h-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="devices" className="gap-2">
            <Smartphone className="w-4 h-4" />
            Connected Devices
          </TabsTrigger>
          <TabsTrigger value="privacy" className="gap-2">
            <Shield className="w-4 h-4" />
            Data & Privacy
          </TabsTrigger>
        </TabsList>

        {/* Account Tab */}
        <TabsContent value="account">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-[#2C2E6F]">Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-gradient-to-br from-[#2C2E6F] to-[#4DD2C1] rounded-full flex items-center justify-center text-white text-2xl">
                  {userInitial}
                </div>
                <div>
                  <Button variant="outline" size="sm">Change Photo</Button>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    defaultValue={firstName} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    defaultValue={lastName} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  defaultValue={user?.email || ''} 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input 
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="Enter your phone number" 
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input 
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••" 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input 
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input 
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••" 
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button className="bg-[#2C2E6F] hover:bg-[#1f2050]">Save Changes</Button>
                <Button variant="outline">Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-[#2C2E6F]">Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#E9E6F9] rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-[#2C2E6F]" />
                  </div>
                  <div>
                    <label htmlFor="email-notifications" className="text-[#2C2E6F] cursor-pointer">Email Notifications</label>
                    <p className="text-sm text-gray-600">Receive updates via email</p>
                  </div>
                </div>
                <Switch 
                  id="email-notifications"
                  name="emailNotifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                  aria-label="Email Notifications"
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#E9E6F9] rounded-lg flex items-center justify-center">
                    <Bell className="w-5 h-5 text-[#2C2E6F]" />
                  </div>
                  <div>
                    <label htmlFor="push-notifications" className="text-[#2C2E6F] cursor-pointer">Push Notifications</label>
                    <p className="text-sm text-gray-600">Get notified about session reminders</p>
                  </div>
                </div>
                <Switch 
                  id="push-notifications"
                  name="pushNotifications"
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
                  aria-label="Push Notifications"
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#E9E6F9] rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-[#2C2E6F]" />
                  </div>
                  <div>
                    <label htmlFor="weekly-report" className="text-[#2C2E6F] cursor-pointer">Weekly Progress Report</label>
                    <p className="text-sm text-gray-600">Summary of your recovery progress</p>
                  </div>
                </div>
                <Switch 
                  id="weekly-report"
                  name="weeklyReport"
                  checked={weeklyReport}
                  onCheckedChange={setWeeklyReport}
                  aria-label="Weekly Progress Report"
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <Label htmlFor="notification-frequency">Notification Frequency</Label>
                <div className="grid grid-cols-3 gap-3">
                  <Button variant="outline" className="bg-[#2C2E6F] text-white">Daily</Button>
                  <Button variant="outline">Weekly</Button>
                  <Button variant="outline">Monthly</Button>
                </div>
              </div>

              <Button className="bg-[#2C2E6F] hover:bg-[#1f2050]">Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Connected Devices Tab */}
        <TabsContent value="devices">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-[#2C2E6F]">Connected Devices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {connectedDevices.map((device, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-[#2C2E6F] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#E9E6F9] rounded-lg flex items-center justify-center text-2xl">
                        {device.icon}
                      </div>
                      <div>
                        <h4 className="text-[#2C2E6F]">{device.name}</h4>
                        <p className="text-sm text-gray-600">
                          {device.connected ? 'Syncing data automatically' : 'Not connected'}
                        </p>
                      </div>
                    </div>
                    <Switch 
                      id={`device-${index}`}
                      name={`device-${index}`}
                      checked={device.connected}
                      onCheckedChange={() => {}}
                      aria-label={`${device.name} connection`}
                    />
                  </div>
                  {index < connectedDevices.length - 1 && <Separator className="my-4" />}
                </div>
              ))}

              <div className="p-4 bg-[#E9E6F9] rounded-xl">
                <p className="text-sm text-gray-700">
                  <strong className="text-[#2C2E6F]">How it works:</strong> Connected devices help track your daily activity, heart rate, and sleep patterns to provide better recovery insights.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data & Privacy Tab */}
        <TabsContent value="privacy">
          <div className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#2C2E6F]">Appearance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#E9E6F9] rounded-lg flex items-center justify-center">
                      <Moon className="w-5 h-5 text-[#2C2E6F]" />
                    </div>
                    <div>
                      <label htmlFor="dark-mode" className="text-[#2C2E6F] cursor-pointer">Dark Mode</label>
                      <p className="text-sm text-gray-600">Use dark theme for the interface</p>
                    </div>
                  </div>
                  <Switch 
                    id="dark-mode"
                    name="darkMode"
                    checked={darkMode}
                    onCheckedChange={setDarkMode}
                    aria-label="Dark Mode"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#2C2E6F]">Data Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#2C2E6F]">Download Your Data</p>
                    <p className="text-sm text-gray-600">Export all your recovery data as CSV</p>
                  </div>
                  <Button variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Export
                  </Button>
                </div>

                <Separator />

                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="text-red-900 mb-2">Delete Account</h4>
                  <p className="text-sm text-red-700 mb-3">
                    This will permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <Button variant="destructive" size="sm">
                    Delete My Account
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-[#E9E6F9] to-white">
              <CardHeader>
                <CardTitle className="text-[#2C2E6F]">Privacy & Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-[#2C2E6F] flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="text-[#2C2E6F] mb-2">Your Data is Protected</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      All data is encrypted end-to-end and stored securely. We never share your personal health information with third parties without your explicit consent.
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>AI Transparency:</strong> Computer vision pose estimation runs on-device. No video data is uploaded to the cloud.
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    View Privacy Policy
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    View Terms of Service
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Manage Consent Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
