import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';

import { queryClient } from './core/data/queryClient';
import { rqPersister } from './core/data/persist';
import { installResumeHandlers } from './core/lifecycle/resume';
import { AuthGate, useAuth } from './core/auth/AuthGate';

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
import BoardDashboardPage from './pages/BoardDashboardPage';
import { UserRole } from './types';
import BoardProjectDetailPage from './pages/BoardProjectDetailPage';
import EditProfilePage from './pages/EditProfilePage';
import AttendanceHistoryPage from './pages/AttendanceHistoryPage';
import WorkHistoryPage from './pages/WorkHistoryPage';

const App: React.FC = () => {
  // install lifecycle handlers once
  useEffect(() => {
    const cleanup = installResumeHandlers(queryClient);
    return cleanup;
  }, []);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: rqPersister }}
    >
      <QueryClientProvider client={queryClient}>
        <HashRouter>
          <AuthGate>
            <AppRoutes />
          </AuthGate>
        </HashRouter>
      </QueryClientProvider>
    </PersistQueryClientProvider>
  );
};

const AppRoutes: React.FC = () => {
  const { user } = useAuth();

  return (
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
          {user.role === UserRole.Board && (
            <Route path="/" element={<Navigate to="/board-dashboard" />} />
          )}
          {user.role === UserRole.Admin && (
            <Route path="/" element={<Navigate to="/admin" />} />
          )}

          {/* Engineer-specific pages */}
          {(user.role === UserRole.Engineer ||
            user.role === UserRole.Supervisor ||
            user.role === UserRole.Storekeeper) && (
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

          {/* Board routes */}
          {user.role === UserRole.Board && (
            <>
              <Route path="/board-dashboard" element={<BoardDashboardPage />} />
              <Route path="/board/projects/:id" element={<BoardProjectDetailPage />} />
            </>
          )}

          {/* Common routes */}
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/edit" element={<EditProfilePage />} />

          {/* Admin only */}
          {user.role === UserRole.Admin && (
            <Route path="/admin" element={<AdminPage />} />
          )}

          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      )}
    </Routes>
  );
};

export default App;