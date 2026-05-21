import { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import {
  ErrorBoundary,
  ProtectedRoute,
  MobileNav,
  LoadingPage,
  ConfirmProvider,
  ToastProvider,
  CommandPalette,
} from './components';
import { useIsMobile, useRealtimeSync, useOnlineStatus } from './hooks';
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
const LandingPage = lazy(() => import('./pages/LandingPage').then((m) => ({ default: m.LandingPage })));

function AppRoutes() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  useRealtimeSync();
  const showMobileNav = isMobile && user;
  const { isOnline, justReconnected } = useOnlineStatus();
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setCommandOpen((v) => !v);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={`animate-fade-in ${showMobileNav ? 'pb-16' : ''}`}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[999] focus:px-4 focus:py-2 focus:bg-brand-600 focus:text-white focus:rounded-xl focus:text-sm focus:font-medium focus:shadow-lg"
      >
        Saltar al contenido principal
      </a>
      <main id="main-content">
        {!isOnline && (
          <div className="sticky top-0 z-[80] bg-amber-500 text-white text-center py-2 px-4 text-sm font-medium shadow-lg">
            Sin conexión — los cambios se sincronizarán al reconectar
          </div>
        )}
        {justReconnected && (
          <div className="sticky top-0 z-[80] bg-brand-500 text-white text-center py-2 px-4 text-sm font-medium shadow-lg animate-fade-in">
            Conexión restaurada — tus datos están actualizados
          </div>
        )}
        <Suspense fallback={<LoadingPage />}>
          <ErrorBoundary>
            <Routes>
              <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
              <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/update-password" element={<UpdatePasswordPage />} />
              <Route path="/" element={user ? <DashboardPage /> : <LandingPage />} />
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
      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />
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
