import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import { Plane } from 'lucide-react';
import { useIsMobile } from '../hooks/useMediaQuery';
import { useTranslation } from 'react-i18next';

const updatePasswordSchema = z
  .object({
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type UpdatePasswordForm = z.infer<typeof updatePasswordSchema>;

export function UpdatePasswordPage() {
  const { t } = useTranslation();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePasswordForm>({
    resolver: zodResolver(updatePasswordSchema),
  });

  const onSubmit = async (data: UpdatePasswordForm) => {
    try {
      setError('');
      await updatePassword(data.password);
      setSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al actualizar la contraseña');
    }
  };

  const containerCls = isMobile
    ? 'min-h-dynamic bg-white dark:bg-stone-900 flex flex-col px-5 pt-12 keyboard-aware'
    : 'auth-page';

  const cardCls = isMobile ? 'w-full' : 'auth-card sm:max-w-md';

  if (success) {
    return (
      <div className={containerCls}>
        <Helmet>
          <title>Actualizar Contraseña | Trip Planner</title>
        </Helmet>
        <div className={`${cardCls} text-center`}>
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-green-500 text-2xl">✓</span>
          </div>
          <h2 className="text-2xl font-semibold mb-2 text-stone-900 dark:text-white">{t('auth.password.updated')}</h2>
          <p className="text-stone-600 dark:text-stone-400 mb-6">{t('auth.password.updated.desc')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={containerCls}>
      <Helmet>
        <title>Actualizar Contraseña | Trip Planner</title>
      </Helmet>
      <div className={cardCls}>
        <div className="flex items-center justify-center mb-8">
          <Plane className="w-10 h-10 text-emerald-600" />
          <h1 className={`font-bold text-stone-800 dark:text-white ml-3 ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
            {t('app.name')}
          </h1>
        </div>

        <h2 className="auth-title">{t('auth.password.new')}</h2>

        {error && <div className="form-error mb-4">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="form-label">{t('auth.password.new')}</label>
            <input
              {...register('password')}
              type="password"
              className="w-full px-4 py-3 border border-stone-300 dark:border-stone-600 rounded-xl dark:bg-stone-700 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="••••••"
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
          </div>
          <div>
            <label className="form-label">{t('auth.password.confirm')}</label>
            <input
              {...register('confirmPassword')}
              type="password"
              className="w-full px-4 py-3 border border-stone-300 dark:border-stone-600 rounded-xl dark:bg-stone-700 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="••••••"
            />
            {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>}
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center">
            {isSubmitting ? t('auth.password.updating') : t('auth.password.update')}
          </button>
        </form>
      </div>
    </div>
  );
}
