
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import MainLayout from './components/layout/MainLayout';
import HomePage from './pages/HomePage';
import AttendancePage from './pages/AttendancePage';
import WorkPage from './pages/WorkPage';
import MaterialsPage from './pages/MaterialsPage';
import MaterialDetailPage from './pages/MaterialDetailPage';
import TasksPage from './pages/TasksPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';
import SplashScreen from './components/SplashScreen';
import BoardDashboardPage from './pages/BoardDashboardPage';
import { UserRole } from './types';
import BoardProjectDetailPage from './pages/BoardProjectDetailPage';
import EditProfilePage from './pages/EditProfilePage';
import AttendanceHistoryPage from './pages/AttendanceHistoryPage';
import WorkHistoryPage from './pages/WorkHistoryPage';

const App: React.FC = () => {
  const [splashVisible, setSplashVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setSplashVisible(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AuthProvider>
      <AppWrapper splashVisible={splashVisible} />
    </AuthProvider>
  );
};

const AppWrapper: React.FC<{ splashVisible: boolean }> = ({ splashVisible }) => {
  const { loading } = useAuth();

  if (loading || splashVisible) {
    return <SplashScreen />;
  }

  return (
    <div className="h-screen w-screen overflow-x-hidden antialiased text-neutral-800">
      <AppRoutes />
    </div>
  );
};

const AppRoutes: React.FC = () => {
  const { user } = useAuth();

  return (
    <HashRouter>
      <Routes>
        {!user ? (
          <>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </>
        ) : (
          <Route element={<MainLayout />}>
            {/* Role-based default routes */}
            {user.role === UserRole.Board && <Route path="/" element={<Navigate to="/board-dashboard" />} />}
            {user.role === UserRole.Admin && <Route path="/" element={<Navigate to="/admin" />} />}
            
            {/* Engineer-specific pages, including their default homepage */}
            {(user.role === UserRole.Engineer || user.role === UserRole.Supervisor || user.role === UserRole.Storekeeper) && (
              <>
                <Route path="/" element={<HomePage />} />
                <Route path="/attendance" element={<AttendancePage />} />
                <Route path="/attendance/history" element={<AttendanceHistoryPage />} />
                <Route path="/work" element={<WorkPage />} />
                <Route path="/work/history" element={<WorkHistoryPage />} />
                <Route path="/materials" element={<MaterialsPage />} />
                <Route path="/materials/:id" element={<MaterialDetailPage />} />
                <Route path="/tasks" element={<TasksPage />} />
              </>
            )}

            {/* Board Routes */}
            {user.role === UserRole.Board && (
                <>
                    <Route path="/board-dashboard" element={<BoardDashboardPage />} />
                    <Route path="/board/projects/:id" element={<BoardProjectDetailPage />} />
                </>
            )}
            
            {/* Common Routes for All Authenticated Users */}
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/edit" element={<EditProfilePage />} />

            {/* Admin Only Route */}
            {user.role === UserRole.Admin && <Route path="/admin" element={<AdminPage />} />}
            
            <Route path="*" element={<Navigate to="/" />} />
          </Route>
        )}
      </Routes>
    </HashRouter>
  );
};

export default App;
