import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { StatsProvider } from './contexts/StatsContext';
import ProtectedRoute from './components/ProtectedRoute';
import { LoginOnboarding } from './components/LoginOnboarding';
import { Navigation } from './components/Navigation';
import { PatientDashboard } from './components/PatientDashboard';
import Dashboard from './components/Dashboard';
import { AIPlanReader } from './components/AIPlanReader';
import { LiveSession } from './components/LiveSession';
import { QuestsGamification } from './components/QuestsGamification';
import { FutureSelfLetter } from './components/FutureSelfLetter';
import { RehabClarityHub } from './components/RehabClarityHub';
import { ExerciseLibrary } from './components/ExerciseLibrary';
import { Settings } from './components/Settings';
import { ClinicianDashboard } from './components/ClinicianDashboard';
import { PatientManagement } from './components/PatientManagement';
import { AnalyticsPrediction } from './components/AnalyticsPrediction';
import ActuarialInsights from './components/ActuarialInsights';
import { EchoBodyScene } from './components/EchoBodyScene';
import { ScanToAvatar } from './components/ScanToAvatar';
import { Messages } from './components/Messages';
import { FriendRequests } from './components/FriendRequests';
import { FriendsAndMessages } from './components/FriendsAndMessages';
import { Toaster } from './components/ui/sonner';

function AppContent() {
  const { isAuthenticated, user } = useAuth();
  const [userRole, setUserRole] = useState<'patient' | 'clinician'>('patient');
  const [currentPage, setCurrentPage] = useState('dashboard');
  const navigate = useNavigate();
  const location = useLocation();

  // Sync currentPage with route
  useEffect(() => {
    const path = location.pathname.replace('/', '') || 'dashboard';
    setCurrentPage(path);
  }, [location]);

  // Determine role from user
  useEffect(() => {
    if (user) {
      // Map backend roles to frontend roles
      // Backend uses: 'clinician', 'patient', or 'user' (default)
      // Frontend uses: 'clinician' or 'patient'
      const backendRole = (user as { role?: string })?.role;
      const role = backendRole === 'clinician' ? 'clinician' : 'patient';
      setUserRole(role);
      
      // Navigate to correct dashboard based on role when on root dashboard
      const path = location.pathname.replace('/', '') || 'dashboard';
      if (path === 'dashboard' && backendRole === 'clinician') {
        navigate('/clinician-dashboard');
      } else if (path === 'clinician-dashboard' && role === 'patient') {
        navigate('/dashboard');
      }
    }
  }, [user, location.pathname, navigate]);

  const handleLogin = (role: 'patient' | 'clinician') => {
    setUserRole(role);
    const defaultPage = role === 'patient' ? 'dashboard' : 'clinician-dashboard';
    setCurrentPage(defaultPage);
    navigate(`/${defaultPage}`);
  };

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
    navigate(`/${page}`);
  };

  if (!isAuthenticated) {
    return <LoginOnboarding onLogin={handleLogin} />;
  }

  const renderPage = () => {
    // Patient Pages
    if (userRole === 'patient') {
      switch (currentPage) {
        case 'dashboard':
          return <Dashboard />;
        case 'ai-plan':
          return <AIPlanReader />;
        case 'live-session':
          return <LiveSession />;
        case 'quests':
          return <QuestsGamification />;
        case 'friends':
          return <FriendsAndMessages />;
        case 'friends-messages':
          return <FriendsAndMessages />;
        case 'friend-requests':
          return <FriendRequests />;
        case 'messages':
          return <Messages />;
        case 'future-self':
          return <FutureSelfLetter />;
        case 'clarity-hub':
          return <RehabClarityHub userRole="patient" />;
        case 'body-scan':
          return <ScanToAvatar />;
        case 'echo-body':
          return <EchoBodyScene />;
        case 'exercises':
          return <ExerciseLibrary />;
        case 'settings':
          return <Settings />;
        default:
          return <Dashboard />;
      }
    }
    
    // Clinician Pages
    if (userRole === 'clinician') {
      switch (currentPage) {
        case 'clinician-dashboard':
        case 'dashboard':
          return <ClinicianDashboard onNavigate={handlePageChange} />;
        case 'patients':
          return <PatientManagement />;
        case 'clarity-hub':
          return <RehabClarityHub userRole="clinician" />;
        case 'exercises':
          return <ExerciseLibrary />;
        case 'analytics':
          return <AnalyticsPrediction />;
        case 'actuarial-insights':
          return <ActuarialInsights onBack={() => handlePageChange('clinician-dashboard')} />;
        case 'settings':
          return <Settings />;
        default:
          return <ClinicianDashboard onNavigate={handlePageChange} />;
      }
    }
    
    return <PatientDashboard />;
  };

  // Check if current page should be full screen (only body-scan during scanning, echo-body shows sidebar)
  const isFullScreen = currentPage === 'body-scan';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E9E6F9] via-white to-white">
      {!isFullScreen && (
        <Navigation 
          currentPage={currentPage}
          onPageChange={handlePageChange}
          userRole={userRole}
        />
      )}
      
      <main className={isFullScreen ? 'w-full h-screen' : 'ml-64 p-8'}>
        {renderPage()}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <StatsProvider>
        <Toaster />
        <Router>
          <Routes>
            <Route path="/login" element={<LoginOnboarding />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppContent />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </StatsProvider>
    </AuthProvider>
  );
}

export default App;
