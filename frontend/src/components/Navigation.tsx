import { 
  LayoutDashboard, 
  Video, 
  Users, 
  Dumbbell, 
  BarChart3, 
  Settings,
  Trophy,
  Mail,
  FileText,
  Activity,
  Brain,
  LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { cn } from './ui/utils';

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  userRole: 'patient' | 'clinician';
}

export function Navigation({ currentPage, onPageChange, userRole }: NavigationProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getUserInitial = () => {
    if (user?.name) {
      return user.name.charAt(0).toUpperCase();
    }
    return userRole === 'patient' ? 'P' : 'C';
  };

  const getUserDisplayName = () => {
    return user?.name || (userRole === 'patient' ? 'Patient' : 'Clinician');
  };

  const patientNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ai-plan', label: 'AI Plan Reader', icon: FileText },
    { id: 'live-session', label: 'Live Session', icon: Video },
    { id: 'quests', label: 'Quests & XP', icon: Trophy },
    { id: 'future-self', label: 'Future Self', icon: Mail },
    { id: 'clarity-hub', label: 'Clarity Hub', icon: Brain },
    { id: 'exercises', label: 'Exercises', icon: Dumbbell },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const clinicianNavItems = [
    { id: 'clinician-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'clarity-hub', label: 'Clarity Hub', icon: Brain },
    { id: 'exercises', label: 'Exercise Library', icon: Dumbbell },
    { id: 'analytics', label: 'Analytics & AI', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const navItems = userRole === 'patient' ? patientNavItems : clinicianNavItems;

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white/80 backdrop-blur-sm border-r border-gray-200 p-6 flex flex-col">
      {/* Logo */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-[#2C2E6F] to-[#4DD2C1] rounded-xl flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-[#2C2E6F]">RehabQuest AI+</h3>
          </div>
        </div>
        <p className="text-sm text-gray-500 pl-[52px]">
          {userRole === 'patient' ? 'Your Recovery Journey' : 'Clinic Portal'}
        </p>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
                isActive
                  ? 'bg-[#2C2E6F] text-white shadow-lg shadow-[#2C2E6F]/20'
                  : 'text-gray-600 hover:bg-[#E9E6F9] hover:text-[#2C2E6F]'
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="pt-4 border-t border-gray-200 space-y-2">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#E9E6F9]">
          <div className="w-10 h-10 bg-gradient-to-br from-[#4DD2C1] to-[#2C2E6F] rounded-full flex items-center justify-center text-white font-semibold">
            {getUserInitial()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[#2C2E6F] truncate font-medium">
              {getUserDisplayName()}
            </p>
            <p className="text-xs text-gray-500">
              {user?.email || (userRole === 'patient' ? 'Patient' : 'Clinician')}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
