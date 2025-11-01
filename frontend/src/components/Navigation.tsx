import React from 'react';
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
    <aside 
      className="fixed left-0 top-0 h-screen w-64 text-white flex flex-col"
      style={{
        background: 'linear-gradient(to bottom, #6F66FF, #8C7BFF)',
        backgroundColor: '#6F66FF',
        backgroundImage: 'linear-gradient(to bottom, #6F66FF, #8C7BFF)',
        zIndex: 50,
      } as React.CSSProperties}
    >
      <div className="p-6">
        <h1 className="text-xl">RehabQuest AI+</h1>
        <p className="text-sm opacity-80 mt-1">{userRole === 'patient' ? 'Smart Recovery' : 'Clinic Portal'}</p>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-all',
                isActive
                  ? 'bg-white/20 shadow-lg'
                  : 'hover:bg-white/10'
              )}
            >
              <Icon size={20} />
              <span className="text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Card */}
      <div className="p-4 border-t border-white/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            {getUserInitial()}
          </div>
          <div>
            <p className="text-sm">{getUserDisplayName()}</p>
            <p className="text-xs opacity-70">
              {userRole === 'patient' ? (user?.email || 'Patient') : (user?.email || 'Clinician')}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full text-xs bg-white/10 hover:bg-white/20 rounded-lg px-3 py-2 transition-colors border-white/20 text-white"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
