import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Plane } from 'lucide-react';
import { useIsMobile } from '../hooks/useMediaQuery';

const updatePasswordSchema = z.object({
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type UpdatePasswordForm = z.infer<typeof updatePasswordSchema>;

export function UpdatePasswordPage() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<UpdatePasswordForm>({
    resolver: zodResolver(updatePasswordSchema),
  });

  const onSubmit = async (data: UpdatePasswordForm) => {
    try {
      setError('');
      await updatePassword(data.password);
      setSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar la contraseña');
    }
  };

  const containerCls = isMobile
    ? 'min-h-dynamic bg-white dark:bg-gray-900 flex flex-col px-5 pt-12 keyboard-aware'
    : 'min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-4';

  const cardCls = isMobile
    ? 'w-full'
    : 'max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8';

  if (success) {
    return (
      <div className={containerCls}>
        <div className={`${cardCls} text-center`}>
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-green-500 text-2xl">✓</span>
          </div>
          <h2 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white">Contraseña actualizada</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Tu contraseña ha sido actualizada correctamente.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={containerCls}>
      <div className={cardCls}>
        <div className="flex items-center justify-center mb-8">
          <Plane className="w-10 h-10 text-blue-500" />
          <h1 className={`font-bold text-gray-800 dark:text-white ml-3 ${isMobile ? 'text-2xl' : 'text-3xl'}`}>Trip Planner</h1>
        </div>

        <h2 className="text-xl font-semibold text-center mb-6">Nueva Contraseña</h2>

        {error && <div className="bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-400 p-3 rounded-xl mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nueva Contraseña</label>
            <input {...register('password')} type="password" className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="••••••" />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirmar Contraseña</label>
            <input {...register('confirmPassword')} type="password" className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="••••••" />
            {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>}
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full bg-blue-500 text-white py-3 rounded-xl font-medium hover:bg-blue-600 active:bg-blue-700 transition-colors disabled:opacity-50">
            {isSubmitting ? 'Actualizando...' : 'Actualizar Contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
