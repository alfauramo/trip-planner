import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NewTripForm } from './NewTripForm';
import { AIItineraryGenerator } from './AIItineraryGenerator';
import { useTrips } from '../hooks/useTrips';
import { useToast } from './Toast';
import { supabase } from '../lib/supabase';
import type { AIItineraryResult } from '../hooks/useAIItinerary';

type CreationMode = 'choose' | 'manual' | 'ai';

export function TripCreationSheet({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<CreationMode>('choose');
  const { createTrip } = useTrips();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleAICreate = async (result: AIItineraryResult) => {
    try {
      const startDate = new Date(Date.now() + 7 * 86400000);
      const endDate = new Date(Date.now() + (7 + result.days.length - 1) * 86400000);
      const trip = await createTrip({
        title: result.days[0]?.title || t('trip.new'),
        description: result.days.map((d) => `Día ${d.day}: ${d.title}`).join('. '),
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
      });
      if (trip) {
        // Create days and events from AI result
        for (let i = 0; i < result.days.length; i++) {
          const aiDay = result.days[i];
          const dayDate = new Date(startDate);
          dayDate.setDate(dayDate.getDate() + i);
          const dateStr = dayDate.toISOString().split('T')[0];

          const { data: dayData } = await supabase
            .from('days')
            .insert({ trip_id: trip.id, date: dateStr, day_number: i + 1, notes: aiDay.description || undefined })
            .select()
            .single();

          if (dayData && aiDay.activities.length > 0) {
            const events = aiDay.activities.map((act, j) => ({
              day_id: dayData.id,
              name: act.description,
              event_type: 'activity',
              start_time: act.time || undefined,
              order: j + 1,
            }));
            await supabase.from('events').insert(events);
          }
        }
        showToast(t('trip.ai.created'));
        onClose();
        navigate(`/trips/${trip.id}`);
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : t('common.error'), 'error');
    }
  };

  if (mode === 'manual') {
    return (
      <div>
        <button
          type="button"
          onClick={() => setMode('choose')}
          className="text-xs text-stone-500 hover:text-stone-700 mb-3"
        >
          ← {t('common.back')}
        </button>
        <NewTripForm />
      </div>
    );
  }

  if (mode === 'ai') {
    return (
      <div>
        <button
          type="button"
          onClick={() => setMode('choose')}
          className="text-xs text-stone-500 hover:text-stone-700 mb-3"
        >
          ← {t('common.back')}
        </button>
        <p className="text-sm text-stone-500 mb-3">{t('trip.ai.desc')}</p>
        <AIItineraryGenerator onSelect={handleAICreate} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-stone-500 text-center">{t('trip.creation.choose')}</p>
      <button
        type="button"
        onClick={() => setMode('manual')}
        className="w-full flex items-center gap-3 p-4 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
          <Pencil className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <div className="font-medium text-stone-800 dark:text-white">{t('trip.creation.manual')}</div>
          <div className="text-xs text-stone-500 mt-0.5">{t('trip.creation.manualDesc')}</div>
        </div>
      </button>
      <button
        type="button"
        onClick={() => setMode('ai')}
        className="w-full flex items-center gap-3 p-4 rounded-xl border border-purple-200 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-900/10 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <div className="font-medium text-stone-800 dark:text-white">{t('trip.creation.ai')}</div>
          <div className="text-xs text-stone-500 mt-0.5">{t('trip.creation.aiDesc')}</div>
        </div>
      </button>
    </div>
  );
}
