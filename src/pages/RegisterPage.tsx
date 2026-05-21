import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import { Plane } from 'lucide-react';
import { useIsMobile } from '../hooks/useMediaQuery';
import { useTranslation } from 'react-i18next';

const registerSchema = z
  .object({
    email: z.string().email('Introduce un email válido'),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(/[A-Z]/, 'Debe tener al menos una mayúscula')
      .regex(/[a-z]/, 'Debe tener al menos una minúscula')
      .regex(/\d/, 'Debe tener al menos un número'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const { t } = useTranslation();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const { signUp, signInWithGoogle } = useAuth();
  const isMobile = useIsMobile();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      setError('');
      await signUp(data.email, data.password);
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrar');
    }
  };

  const handleGoogleRegister = async () => {
    try {
      setError('');
      setLoadingGoogle(true);
      await signInWithGoogle();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error con Google');
      setLoadingGoogle(false);
    }
  };

  const containerCls = isMobile
    ? 'min-h-dynamic bg-white dark:bg-stone-950 flex flex-col px-5 pt-12 keyboard-aware'
    : 'auth-page';

  const cardCls = isMobile ? 'w-full' : 'auth-card sm:max-w-md';

  if (success) {
    return (
      <div className={containerCls}>
        <Helmet>
          <title>Registro | Trip Planner</title>
        </Helmet>
        <div className={`${cardCls} text-center`}>
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-green-500 text-2xl">✓</span>
          </div>
          <h2 className="text-2xl font-semibold mb-2 text-stone-900 dark:text-white">{t('auth.register.success')}</h2>
          <p className="text-stone-600 dark:text-stone-400 mb-6">{t('auth.register.success.desc')}</p>
          <Link to="/login" className="text-emerald-600 hover:underline font-medium">
            {t('auth.backToLogin')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={containerCls}>
      <Helmet>
        <title>Registro | Trip Planner</title>
      </Helmet>
      <div className={cardCls}>
        <div className="flex items-center justify-center mb-8">
          <Plane className="w-10 h-10 text-emerald-600" />
          <h1 className={`font-bold text-stone-800 dark:text-white ml-3 ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
            {t('app.name')}
          </h1>
        </div>

        <h2 className="auth-title">{t('auth.register.title')}</h2>

        <button
          type="button"
          onClick={handleGoogleRegister}
          disabled={loadingGoogle}
          className="w-full flex items-center justify-center gap-3 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-200 py-3 px-4 rounded-xl font-medium hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors disabled:opacity-50 mb-4"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {loadingGoogle ? t('auth.login.loading') : t('auth.google.register')}
        </button>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            {' '}
            <div className="w-full border-t border-stone-300 dark:border-stone-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-stone-900 text-stone-500">{t('auth.orEmail')}</span>
          </div>
        </div>

        {error && <div className="form-error mb-4">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="form-label">{t('auth.email')}</label>
            <input {...register('email')} type="email" className="input" placeholder={t('auth.email.placeholder')} />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="form-label">{t('auth.password')}</label>
            <input {...register('password')} type="password" className="input" placeholder="••••••" />
            {errors.password && <div className="text-red-500 text-sm mt-1">{errors.password.message}</div>}
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">{t('auth.password.requirements')}</p>
          </div>
          <div>
            <label className="form-label">{t('auth.password.confirm')}</label>
            <input {...register('confirmPassword')} type="password" className="input" placeholder="••••••" />
            {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>}
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center">
            {isSubmitting ? t('auth.register.loading') : t('auth.register.title')}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-stone-600 dark:text-stone-400">
          {t('auth.hasAccount')}{' '}
          <Link to="/login" className="text-emerald-600 hover:underline font-medium">
            {t('auth.loginLink')}
          </Link>
        </div>
      </div>
    </div>
  );
}
