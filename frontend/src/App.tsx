import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { LoginOnboarding } from './components/LoginOnboarding';
import { Navigation } from './components/Navigation';
import { PatientDashboard } from './components/PatientDashboard';
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

function AppContent() {
  const { isAuthenticated, user, logout } = useAuth();
  const [userRole, setUserRole] = useState<'patient' | 'clinician'>('patient');
  const [currentPage, setCurrentPage] = useState('dashboard');
  const navigate = useNavigate();
  const location = useLocation();

  // Sync currentPage with route
  useEffect(() => {
    const path = location.pathname.replace('/', '') || 'dashboard';
    setCurrentPage(path);
  }, [location]);

  // Determine role from user (you can extend your user model to include role)
  useEffect(() => {
    if (user) {
      // Assuming role is stored in user object or default to patient
      // You can modify this based on your actual user model
      const role = (user as any).role === 'clinician' ? 'clinician' : 'patient';
      setUserRole(role);
    }
  }, [user]);

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
          return <PatientDashboard />;
        case 'ai-plan':
          return <AIPlanReader />;
        case 'live-session':
          return <LiveSession />;
        case 'quests':
          return <QuestsGamification />;
        case 'future-self':
          return <FutureSelfLetter />;
        case 'clarity-hub':
          return <RehabClarityHub userRole="patient" />;
        case 'exercises':
          return <ExerciseLibrary />;
        case 'settings':
          return <Settings />;
        default:
          return <PatientDashboard />;
      }
    }
    
    // Clinician Pages
    if (userRole === 'clinician') {
      switch (currentPage) {
        case 'clinician-dashboard':
        case 'dashboard':
          return <ClinicianDashboard />;
        case 'patients':
          return <PatientManagement />;
        case 'clarity-hub':
          return <RehabClarityHub userRole="clinician" />;
        case 'exercises':
          return <ExerciseLibrary />;
        case 'analytics':
          return <AnalyticsPrediction />;
        case 'settings':
          return <Settings />;
        default:
          return <ClinicianDashboard />;
      }
    }
    
    return <PatientDashboard />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E9E6F9] via-white to-white">
      <Navigation 
        currentPage={currentPage}
        onPageChange={handlePageChange}
        userRole={userRole}
      />
      
      <main className="ml-64 p-8">
        {renderPage()}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
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
    </AuthProvider>
  );
}

export default App;
