import React, { useState, useEffect, Suspense, lazy, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { kpiService, TeamMember, KPIMetric } from './services/kpiService';
import { UserProfile } from './types';
import { UserRole } from './types/common';
import { Notification } from './types/notification';
import { 
  markNotificationAsReadService,
  markAllNotificationsAsReadService,
  clearNotificationService,
  clearAllNotificationsService
} from './services/notificationService';
import { EmployeePerformanceData } from '../types';

// Lazy load components for better performance
const Sidebar = lazy(() => import('./components/Sidebar'));
const DashboardPage = lazy(() => import('./components/DashboardPage'));
const PerformancePage = lazy(() => import('./components/PerformancePage'));
const ProfilePage = lazy(() => import('./components/ProfilePage'));
const EmployeeGoalsPage = lazy(() => import('./components/EmployeeGoalsPage'));
const AdminPanelPage = lazy(() => import('./components/AdminPanelPage'));
const SettingsPage = lazy(() => import('./components/SettingsPage'));
const LoginPage = lazy(() => import('./components/LoginPage'));
const NotificationBell = lazy(() => import('./components/NotificationBell'));

// Icons
import { SearchIcon, UserCircleIcon } from './components/icons/Icons';
import TestConnection from './components/TestConnection';

// Constants
const APP_TITLE = 'KPI Dashboard';
const DEFAULT_USER_PROFILE: UserProfile = {
  id: 'guest',
  name: 'Guest User',
  email: 'guest@example.com',
  role: 'Staff',
  department: 'Guest',
  position: 'Guest',
  displayName: 'Guest',
  avatarUrl: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y',
  workEmail: 'guest@example.com',
  phoneNumber: '',
  dateOfBirth: '',
  hireDate: new Date().toISOString(),
  avatar: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y',
  team: 'Guest',
  joinDate: new Date().toISOString(),
  lastActive: new Date().toISOString(),
  nationality: '',
  address: {},
  emergencyContacts: [],
  identityDocuments: [],
  accessibilityNeeds: [],
  skills: [],
  certifications: [],
  languages: []
};

// Helper function to ensure we have a valid UserProfile
const ensureUserProfile = (user: any): UserProfile => {
  if (!user) return DEFAULT_USER_PROFILE;
  
  return {
    id: user.id || 'guest',
    name: user.name || 'Guest User',
    email: user.email || 'guest@example.com',
    role: (user.role as UserRole) || 'Staff',
    department: user.department || 'Guest',
    position: user.position || 'Guest',
    displayName: user.displayName || user.name || 'Guest',
    avatarUrl: user.avatarUrl || user.avatar || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y',
    workEmail: user.workEmail || user.email || 'guest@example.com',
    phoneNumber: user.phoneNumber || '',
    dateOfBirth: user.dateOfBirth || '',
    hireDate: user.hireDate || new Date().toISOString(),
    avatar: user.avatar || user.avatarUrl || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y',
    team: user.team || 'Guest',
    joinDate: user.joinDate || new Date().toISOString(),
    lastActive: user.lastActive || new Date().toISOString()
  };
};

// Extended interface for the frontend with additional UI-specific properties
interface TeamKPIExtended {
  // Core team properties
  teamId: string;
  teamName: string;
  overallScore: number;
  // Ensure metrics have value and unit properties for the UI
  metrics: Array<KPIMetric & { value: number; unit: string }>;
  // Team members are now properly typed from the kpiService
  teamMembers: TeamMember[];
}

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // Show a loading spinner or nothing while auth state is being determined
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    // Only redirect if we are sure the user is not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Main application component
const AppContent: React.FC = () => {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [teamKPI, setTeamKPI] = useState<TeamKPIExtended | null>(null);
  const [employeePerformanceData, setEmployeePerformanceData] = useState<EmployeePerformanceData[]>([]);
  // These states are now managed within the DashboardPage component
  const [, setIsLoading] = useState<boolean>(false);
  const [, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotificationPanel, setShowNotificationPanel] = useState<boolean>(false);
  
  // Using user directly from useAuth hook
  
  // Handle navigation
  const handleNavItemSelect = useCallback((itemId: string) => {
    // Map sidebar item IDs to routes
    let path = '/';
    switch (itemId) {
      case 'dashboard':
        path = '/dashboard';
        break;
      case 'performance':
        path = '/performance';
        break;
      case 'employeeGoals':
        path = '/goals';
        break;
      case 'profile':
        path = '/profile';
        break;
      case 'settings':
        path = '/settings';
        break;
      case 'admin-panel':
        path = '/admin';
        break;
      case 'logout':
        // Handle logout: clear auth and redirect to login
        window.localStorage.clear(); // Optional: clear all localStorage
        window.location.href = '/login';
        return;
      default:
        path = '/';
    }
    navigate(path);
  }, [navigate]);
  
  // Toggle notification panel
  const toggleNotificationPanel = useCallback(() => {
    setShowNotificationPanel(prev => !prev);
  }, []);

  // Logout handler is managed by the Sidebar component
  
  // Handle team change - handles both direct string and ChangeEvent
  const handleTeamChange = useCallback((teamOrEvent: string | React.ChangeEvent<HTMLSelectElement>) => {
    const team = typeof teamOrEvent === 'string' 
      ? teamOrEvent 
      : teamOrEvent.target.value;
    setSelectedTeam(team);
  }, []);

  // Load team KPI data
  useEffect(() => {
    const loadTeamKPI = async () => {
      if (!user) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Try to fetch team KPI data
        const data = await kpiService.getTeamKPI();
        if (data) {
          // Transform the data to match TeamKPIExtended type with proper defaults
          const transformedData: TeamKPIExtended = {
            teamId: data.teamId || 'default-team',
            teamName: data.teamName || 'Default Team',
            overallScore: data.overallScore || 0,
            // Ensure metrics have all required properties with defaults
            metrics: (data.metrics || []).map((metric: KPIMetric) => ({
              id: metric.id || `metric-${Math.random().toString(36).substr(2, 9)}`,
              name: metric.name || 'Unnamed Metric',
              target: metric.target || 0,
              weight: metric.weight || 0,
              currentValue: metric.currentValue || 0,
              progress: metric.progress || 0,
              unit: metric.unit || '',
              // UI-specific properties
              value: metric.currentValue || 0
            })),
            // Ensure teamMembers is always an array
            teamMembers: data.teamMembers || []
          };
          setTeamKPI(transformedData);
        }
      } catch (err: any) {
        console.error('Team KPI endpoint not available:', err.message);
        // Optionally, setTeamKPI(null) or show an error UI
      } finally {
        setIsLoading(false);
      }
    };

    loadTeamKPI();
  }, [user]);

  // Load employee performance data
  useEffect(() => {
    const loadEmployeePerformanceData = async () => {
      if (!user) return;
      
      try {
        // TODO: Replace with actual API call to fetch employee performance data
        const data = await import('./services/apiService').then(m => m.fetchEmployeePerformanceData());
        setEmployeePerformanceData(data);
      } catch (err) {
        console.error('Failed to load employee performance data:', err);
        // Optionally, setEmployeePerformanceData([]) or show an error UI
      }
    };

    loadEmployeePerformanceData();
  }, [user]);
  
  // Handle authentication state changes
  useEffect(() => {
    // Only redirect to login if we're not already on the login page
    // and we've finished checking the auth state
    if (!isAuthLoading && !isAuthenticated && location.pathname !== '/login') {
      // Store the current path to redirect back after login
      const redirectPath = location.pathname !== '/' ? location.pathname + location.search : '/';
      localStorage.setItem('postLoginRedirect', redirectPath);
      navigate('/login', { 
        state: { from: redirectPath },
        replace: true 
      });
    }
    // Only depend on isAuthLoading, isAuthenticated, location.pathname, and navigate
  }, [isAuthLoading, isAuthenticated, location.pathname, navigate]);

  const handleMarkNotificationRead = async (notificationId: string) => {
    if (!user) return;
    await markNotificationAsReadService(notificationId); // Only pass notificationId
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
  };

  const handleMarkAllNotificationsRead = async () => {
    if (!user) return;
    await markAllNotificationsAsReadService(user.id); // Only pass user.id
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleClearNotification = async (notificationId: string) => {
    if (!user) return;
    await clearNotificationService(notificationId); // Only pass notificationId
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const handleClearAllNotifications = async () => {
    if (!user) return;
    await clearAllNotificationsService(user.id);
    setNotifications([]);
  };

  const handleNotificationNavigate = useCallback((link?: string) => {
    if (link) {
      navigate(link);
      setShowNotificationPanel(false);
    }
  }, [navigate]);

  return (
    <div className="app h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      }>
        {isAuthenticated && location.pathname !== '/login' && (
          <Sidebar 
            activeItem={location.pathname} 
            onNavItemClick={handleNavItemSelect}
            uniqueTeams={Array.from(new Set(teamKPI?.teamMembers?.map(m => m.team) || []))}
            onTeamSelect={handleTeamChange}
            currentUser={ensureUserProfile(user)}
          />
        )}
        <div className="flex-1 flex flex-col h-0 ml-72">
          {/* Fixed Header */}
          {isAuthenticated && location.pathname !== '/login' && (
            <header className="bg-white dark:bg-gray-800 shadow-sm">
              <div className="w-full px-4 sm:px-6 lg:px-8 py-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <h1 className="text-xl font-semibold text-gray-800 dark:text-white">{APP_TITLE}</h1>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input 
                        type="text" 
                        placeholder="Search..." 
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <NotificationBell 
                      notifications={notifications}
                      onTogglePanel={toggleNotificationPanel}
                      showPanel={showNotificationPanel}
                      onMarkRead={handleMarkNotificationRead}
                      onMarkAllRead={handleMarkAllNotificationsRead}
                      onClear={handleClearNotification}
                      onClearAll={handleClearAllNotifications}
                      onNavigate={handleNotificationNavigate}
                    />
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <UserCircleIcon className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white">
                          {user?.displayName || user?.email?.split('@')[0] || 'User'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </header>
          )}
          
          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4">
            <Routes>
              <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
              <Route path="/test-connection" element={<TestConnection />} />
              <Route 
                path="/login" 
                element={
                  isAuthenticated ? (
                    <Navigate to={(location.state as any)?.from || '/'} replace />
                  ) : (
                    <LoginPage />
                  )
                } 
              />
              <Route 
                path="*" 
                element={
                  <Navigate to={isAuthenticated ? location.pathname : '/login'} 
                    state={{ from: location.pathname }} 
                    replace 
                  />
                } 
              />
              <Route 
                path="/" 
                element={
                  <Navigate 
                    to="/dashboard" 
                    replace 
                    state={{ from: location.state?.from || '/' }}
                  />
                } 
              />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardPage 
                    employeePerformanceData={employeePerformanceData}
                    selectedTeam={selectedTeam}
                    onTeamChange={handleTeamChange}
                    uniqueTeamsForFilter={Array.from(new Set(teamKPI?.teamMembers?.map(m => m.team) || []))}
                    addAppNotification={async (targetUserId: string, details: any) => {
                      // Implement notification logic here
                      console.log('Adding notification:', { targetUserId, details });
                    }}
                    currentUserId={user?.id || ''}
                  />
                </ProtectedRoute>
              } />
              <Route path="/performance" element={
                <ProtectedRoute>
                  <PerformancePage />
                </ProtectedRoute>
              } />
              <Route path="/goals" element={
                <ProtectedRoute>
                  <EmployeeGoalsPage 
                    currentUser={ensureUserProfile(user)}
                    addAppNotification={async (targetUserId: string, details: any) => {
                      // Implement notification logic here
                      console.log('Adding notification:', { targetUserId, details });
                    }}
                  />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfilePage 
                    currentUser={ensureUserProfile(user)}
                    addAppNotification={async (targetUserId: string, details: any) => {
                      // Implement notification logic here
                      console.log('Adding notification:', { targetUserId, details });
                    }}
                  />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute>
                  {user
                    ? (["Super Admin", "Admin", "Leader", "Sub-Leader"].includes(user.role)
                        ? <AdminPanelPage 
                            currentUser={ensureUserProfile(user)}
                            addAppNotification={async (targetUserId: string, details: any) => {
                              // Implement notification logic here
                              console.log('Adding notification:', { targetUserId, details });
                            }}
                          />
                        : <Navigate to="/dashboard" replace />)
                    : null // or a loading spinner
                  }
                </ProtectedRoute>
              } />
            </Routes>
          </div>
        </div>
      </Suspense>
    </div>
  );
};

// Main App component that wraps everything with AuthProvider and Router
const App: React.FC = () => (
  <Router>
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  </Router>
);

export default App;
