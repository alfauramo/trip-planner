import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Plane } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useIsMobile } from '../hooks/useMediaQuery';

const loginSchema = z.object({
  email: z.string().email('Introduce un email válido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const [error, setError] = useState('');
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [justLoggedIn, setJustLoggedIn] = useState(false);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const { signIn, signInWithGoogle, user, profile } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setError(''); setEmailNotVerified(false);
      await signIn(data.email, data.password);
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user && !userData.user.email_confirmed_at) {
        setEmailNotVerified(true);
        await supabase.auth.signOut();
      } else {
        setJustLoggedIn(true);
      }
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    }
  };

  const handleResendVerification = async (email: string) => {
    setResending(true);
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    setResending(false);
    if (!error) setResent(true);
  };

  useEffect(() => {
    if (justLoggedIn && user && profile) {
      setJustLoggedIn(false);
      navigate(!profile.full_name && !profile.alias ? '/profile' : '/', { replace: true });
    }
  }, [justLoggedIn, user, profile]);

  const handleGoogleLogin = async () => {
    try {
      setError(''); setLoadingGoogle(true);
      sessionStorage.setItem('justRegistered', 'true');
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Error con Google');
      setLoadingGoogle(false);
    }
  };

  const containerCls = isMobile
    ? 'min-h-dynamic bg-white dark:bg-gray-900 flex flex-col px-5 pt-12 keyboard-aware'
    : 'min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-4';

  const cardCls = isMobile
    ? 'w-full'
    : 'max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8';

  return (
    <div className={containerCls}>
      <div className={cardCls}>
        <div className="flex items-center justify-center mb-8">
          <Plane className="w-10 h-10 text-blue-500" />
          <h1 className={`font-bold text-gray-800 dark:text-white ml-3 ${isMobile ? 'text-2xl' : 'text-3xl'}`}>Trip Planner</h1>
        </div>

        <h2 className="text-xl font-semibold text-center mb-6">Iniciar Sesión</h2>

        <button
          onClick={handleGoogleLogin}
          disabled={loadingGoogle}
          className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-3 px-4 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 mb-4"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loadingGoogle ? 'Conectando...' : 'Continuar con Google'}
        </button>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300 dark:border-gray-600"></div></div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">o con email</span>
          </div>
        </div>

        {error && <div className="bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-400 p-3 rounded-xl mb-4 text-sm">{error}</div>}

        {emailNotVerified && (
          <div className="bg-amber-50 dark:bg-amber-900/50 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200 p-4 rounded-xl mb-4">
            <p className="font-medium mb-2 text-sm">Email no verificado</p>
            <p className="text-xs mb-3">Hemos enviado un enlace de confirmación a tu email.</p>
            {resent ? (
              <p className="text-xs text-green-600 font-medium">¡Email reenviado!</p>
            ) : (
              <button type="button" onClick={() => handleResendVerification(watch('email'))} disabled={resending} className="text-xs text-blue-600 hover:underline disabled:opacity-50">
                {resending ? 'Reenviando...' : 'Reenviar email de confirmación'}
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input {...register('email')} type="email" className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="tu@email.com" />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contraseña</label>
            <input {...register('password')} type="password" className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="••••••" />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full bg-blue-500 text-white py-3 rounded-xl font-medium hover:bg-blue-600 active:bg-blue-700 transition-colors disabled:opacity-50">
            {isSubmitting ? 'Cargando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <Link to="/forgot-password" className="text-blue-500 hover:underline">¿Olvidaste tu contraseña?</Link>
        </div>
        <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="text-blue-500 hover:underline font-medium">Regístrate</Link>
        </div>
      </div>
    </div>
  );
}
