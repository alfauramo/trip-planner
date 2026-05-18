import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ErrorBoundary, ProtectedRoute, MobileNav, LoadingPage } from './components';
import { useIsMobile } from './hooks';

const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const UpdatePasswordPage = lazy(() => import('./pages/UpdatePasswordPage').then(m => ({ default: m.UpdatePasswordPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const TripDetailPage = lazy(() => import('./pages/TripDetailPage').then(m => ({ default: m.TripDetailPage })));
const InvitationsPage = lazy(() => import('./pages/InvitationsPage').then(m => ({ default: m.InvitationsPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));

function AppRoutes() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const showMobileNav = isMobile && user;

  return (
    <div className={showMobileNav ? 'pb-16' : ''}>
      <Suspense fallback={<LoadingPage />}>
        <ErrorBoundary>
          <Routes>
            <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
            <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/update-password" element={<UpdatePasswordPage />} />
            <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/trips/:id" element={<ProtectedRoute><TripDetailPage /></ProtectedRoute>} />
            <Route path="/invitations" element={<ProtectedRoute><InvitationsPage /></ProtectedRoute>} />
            <Route path="/invite/:tripId" element={<ProtectedRoute><InvitationsPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          </Routes>
        </ErrorBoundary>
      </Suspense>
      {showMobileNav && <MobileNav />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter basename="/trip-planner">
      <ThemeProvider>
        <AuthProvider>
          <ErrorBoundary>
            <AppRoutes />
          </ErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
