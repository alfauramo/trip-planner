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

const forgotSchema = z.object({
  email: z.string().email('Email inválido'),
});

type ForgotForm = z.infer<typeof forgotSchema>;

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { resetPassword } = useAuth();
  const isMobile = useIsMobile();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotForm) => {
    try {
      setError('');
      await resetPassword(data.email);
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al enviar el email');
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
          <title>Recuperar Contraseña | Trip Planner</title>
        </Helmet>
        <div className={`${cardCls} text-center`}>
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-green-500 text-2xl">✓</span>
          </div>
          <h2 className="text-2xl font-semibold mb-2 text-stone-900 dark:text-white">
            {t('auth.resetPassword.emailSent')}
          </h2>
          <p className="text-stone-600 dark:text-stone-400 mb-6">{t('auth.resetPassword.emailSent.desc')}</p>
          <Link to="/login" className="text-brand-600 hover:underline font-medium">
            {t('auth.backToLogin')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={containerCls}>
      <Helmet>
        <title>Recuperar Contraseña | Trip Planner</title>
      </Helmet>
      <div className={cardCls}>
        <div className="flex items-center justify-center mb-8">
          <Plane className="w-10 h-10 text-brand-600" />
          <h1 className={`font-bold text-stone-800 dark:text-white ml-3 ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
            {t('app.name')}
          </h1>
        </div>

        <h2 className="auth-title">{t('auth.resetPassword')}</h2>
        <p className="auth-subtitle">{t('auth.resetPassword.desc')}</p>

        {error && <div className="form-error mb-4">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="form-label">{t('auth.email')}</label>
            <input {...register('email')} type="email" className="input" placeholder={t('auth.email.placeholder')} />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full btn-primary">
            {isSubmitting ? t('common.loading') : t('auth.sendEmail')}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <Link to="/login" className="text-brand-600 hover:underline font-medium">
            {t('auth.backToLogin')}
          </Link>
        </div>
      </div>
    </div>
  );
}
