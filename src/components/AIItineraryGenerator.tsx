import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useAIItinerary, type AIItineraryResult } from '../hooks/useAIItinerary';
import { Spinner } from './Loading';

interface Props {
  onSelect?: (result: AIItineraryResult) => void;
}

export function AIItineraryGenerator({ onSelect }: Props) {
  const { t } = useTranslation();
  const [destination, setDestination] = useState('');
  const [days, setDays] = useState(3);
  const [travelers, setTravelers] = useState(2);
  const [budget, setBudget] = useState('');
  const [interests, setInterests] = useState('');
  const { generate, loading, error } = useAIItinerary();
  const [result, setResult] = useState<AIItineraryResult | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const data = await generate({ destination, days, travelers, budget, interests });
    if (data) setResult(data);
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t('trip.generateAI')}</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          placeholder={t('trip.ai.destination')}
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          required
          className="w-full rounded-lg border border-stone-300 p-2 dark:border-stone-600 dark:bg-stone-800"
        />
        <div className="flex gap-3">
          <label className="flex-1">
            <span className="text-sm text-stone-500">{t('trip.ai.days')}</span>
            <input
              type="number"
              min={1}
              max={30}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-full rounded-lg border border-stone-300 p-2 dark:border-stone-600 dark:bg-stone-800"
            />
          </label>
          <label className="flex-1">
            <span className="text-sm text-stone-500">{t('trip.ai.travelers')}</span>
            <input
              type="number"
              min={1}
              value={travelers}
              onChange={(e) => setTravelers(Number(e.target.value))}
              className="w-full rounded-lg border border-stone-300 p-2 dark:border-stone-600 dark:bg-stone-800"
            />
          </label>
        </div>
        <input
          type="text"
          placeholder={t('trip.ai.budget')}
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          className="w-full rounded-lg border border-stone-300 p-2 dark:border-stone-600 dark:bg-stone-800"
        />
        <textarea
          placeholder={t('trip.ai.interests')}
          value={interests}
          onChange={(e) => setInterests(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-stone-300 p-2 dark:border-stone-600 dark:bg-stone-800"
        />
        <button type="submit" disabled={loading} className="btn-primary w-full rounded-lg px-4 py-2">
          {loading ? <Spinner /> : t('trip.ai.generate')}
        </button>
      </form>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {result && (
        <div className="space-y-4">
          {result.days.map((day) => (
            <div key={day.day} className="rounded-lg border border-stone-200 p-3 dark:border-stone-700">
              <h4 className="font-medium">{t('trip.ai.day', { day: day.day, title: day.title })}</h4>
              <p className="text-sm text-stone-600 dark:text-stone-400">{day.description}</p>
              <ul className="mt-2 space-y-1">
                {day.activities.map((act, i) => (
                  <li key={i} className="text-sm">
                    <span className="font-medium text-stone-500">{act.time}</span> – {act.description}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <details className="text-sm">
            <summary className="cursor-pointer text-stone-500">{t('trip.ai.tips')}</summary>
            <ul className="mt-1 list-inside list-disc space-y-1">
              {result.tips.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          </details>
          {onSelect && (
            <button
              onClick={() => onSelect(result)}
              className="w-full rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
            >
              {t('trip.ai.use')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
