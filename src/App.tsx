import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ErrorBoundary, ProtectedRoute, MobileNav, LoadingPage, ConfirmProvider, ToastProvider } from './components';
import { useIsMobile, useRealtimeSync } from './hooks';
import { queryClient, persister } from './lib/queryClient';

const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() =>
  import('./pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })),
);
const UpdatePasswordPage = lazy(() =>
  import('./pages/UpdatePasswordPage').then((m) => ({ default: m.UpdatePasswordPage })),
);
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const TripDetailPage = lazy(() => import('./pages/TripDetailPage').then((m) => ({ default: m.TripDetailPage })));
const InvitationsPage = lazy(() => import('./pages/InvitationsPage').then((m) => ({ default: m.InvitationsPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));

function AppRoutes() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  useRealtimeSync();
  const showMobileNav = isMobile && user;

  return (
    <div className={`animate-fade-in ${showMobileNav ? 'pb-16' : ''}`}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[999] focus:px-4 focus:py-2 focus:bg-emerald-600 focus:text-white focus:rounded-xl focus:text-sm focus:font-medium focus:shadow-lg"
      >
        Saltar al contenido principal
      </a>
      <main id="main-content">
        <Suspense fallback={<LoadingPage />}>
          <ErrorBoundary>
            <Routes>
              <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
              <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/update-password" element={<UpdatePasswordPage />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/trips/:id"
                element={
                  <ProtectedRoute>
                    <TripDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/invitations"
                element={
                  <ProtectedRoute>
                    <InvitationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/invite/:tripId"
                element={
                  <ProtectedRoute>
                    <InvitationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </ErrorBoundary>
        </Suspense>
      </main>
      {showMobileNav && <MobileNav />}
    </div>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter basename="/trip-planner">
        <PersistQueryClientProvider client={queryClient} persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24 }}>
          <ThemeProvider>
            <AuthProvider>
              <ErrorBoundary>
                <ToastProvider>
                  <ConfirmProvider>
                    <AppRoutes />
                  </ConfirmProvider>
                </ToastProvider>
              </ErrorBoundary>
            </AuthProvider>
          </ThemeProvider>
        </PersistQueryClientProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}
