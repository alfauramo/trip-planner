import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useToast } from './Toast';
import { Loader2 } from 'lucide-react';

const addDaySchema = z.object({
  date: z.string().min(1),
  notes: z.string().optional(),
});
type AddDayFormData = z.infer<typeof addDaySchema>;

const editDaySchema = z.object({
  date: z.string().min(1),
  notes: z.string().optional(),
});
type EditDayFormData = z.infer<typeof editDaySchema>;

export function AddDayForm({
  startDate,
  lastDate,
  onSave,
}: {
  startDate?: string;
  lastDate?: string;
  onSave: (date: string, notes?: string) => void;
}) {
  const getDefaultDate = () => {
    if (lastDate) {
      const d = new Date(lastDate);
      d.setDate(d.getDate() + 1);
      return d.toISOString().split('T')[0];
    }
    if (startDate) return startDate;
    return new Date().toISOString().split('T')[0];
  };
  const { t } = useTranslation();
  const { showToast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddDayFormData>({
    resolver: zodResolver(addDaySchema),
    defaultValues: { date: getDefaultDate(), notes: '' },
  });

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        try {
          await onSave(data.date, data.notes || undefined);
          showToast(t('common.saved'), 'success');
        } catch {
          showToast(t('errors.save'), 'error');
        }
      })}
      className="space-y-4"
    >
      <div>
        <label className="form-label">{t('day.date')}</label>
        <input type="date" {...register('date')} className="input" min={startDate || undefined} />
        {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>}
      </div>
      <div>
        <label className="form-label">{t('day.description')}</label>
        <textarea {...register('notes')} rows={3} className="textarea" placeholder={t('day.notes')} />
      </div>
      <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t('day.add')}
      </button>
    </form>
  );
}

export function EditDayForm({
  day,
  onSave,
}: {
  day: { id: string; date: string; notes?: string };
  onSave: (updates: { date: string; notes?: string }) => void;
}) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditDayFormData>({
    resolver: zodResolver(editDaySchema),
    defaultValues: { date: day.date, notes: day.notes || '' },
  });

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        try {
          await onSave({ date: data.date, notes: data.notes || undefined });
          showToast(t('common.saved'), 'success');
        } catch {
          showToast(t('errors.save'), 'error');
        }
      })}
      className="space-y-4"
    >
      <div>
        <label className="form-label">{t('day.date')}</label>
        <input type="date" {...register('date')} className="input" />
        {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>}
      </div>
      <div>
        <label className="form-label">{t('day.description')}</label>
        <textarea {...register('notes')} rows={3} className="textarea" placeholder={t('day.notes')} />
      </div>
      <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t('common.save')}
      </button>
    </form>
  );
}
