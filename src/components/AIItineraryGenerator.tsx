import { useState, useCallback, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useAIItinerary, type AIItineraryResult, type AIItineraryInput } from '../hooks/useAIItinerary';
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

  const doGenerate = useCallback(
    async (params: AIItineraryInput) => {
      const data = await generate(params);
      if (data) setResult(data);
    },
    [generate],
  );

  const presets = [
    {
      label: t('trip.ai.presets.weekend'),
      destination: 'París',
      days: 2,
      travelers: 2,
      interests: 'romántico, gastronomía, arte',
    },
    {
      label: t('trip.ai.presets.tokyo'),
      destination: 'Tokio',
      days: 7,
      travelers: 2,
      interests: 'cultura, tecnología, comida callejera',
    },
    {
      label: t('trip.ai.presets.beach'),
      destination: 'Bali',
      days: 5,
      travelers: 2,
      interests: 'playa, relax, naturaleza',
    },
  ];

  function handlePreset(preset: (typeof presets)[0]) {
    setDestination(preset.destination);
    setDays(preset.days);
    setTravelers(preset.travelers);
    setBudget('');
    setInterests(preset.interests);
    doGenerate({
      destination: preset.destination,
      days: preset.days,
      travelers: preset.travelers,
      budget: '',
      interests: preset.interests,
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await doGenerate({ destination, days, travelers, budget, interests });
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t('trip.generateAI')}</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        {!destination && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-stone-500 dark:text-stone-400">Quick start</p>
            <div className="flex flex-wrap gap-2">
              {presets.map((p) => (
                <button
                  key={p.destination}
                  type="button"
                  onClick={() => handlePreset(p)}
                  disabled={loading}
                  className="px-3 py-1 text-xs rounded-full border border-stone-200 hover:border-brand-400 hover:bg-brand-50 dark:border-stone-600 dark:hover:border-brand-500 dark:hover:bg-brand-900/20 text-stone-600 dark:text-stone-300 transition-colors disabled:opacity-50"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}
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
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              min={1}
              max={30}
              value={days}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v) && v >= 1 && v <= 30) setDays(v);
                else if (e.target.value === '') setDays(1);
              }}
              className="w-full rounded-lg border border-stone-300 p-2 dark:border-stone-600 dark:bg-stone-800"
            />
          </label>
          <label className="flex-1">
            <span className="text-sm text-stone-500">{t('trip.ai.travelers')}</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              min={1}
              value={travelers}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v) && v >= 1) setTravelers(v);
                else if (e.target.value === '') setTravelers(1);
              }}
              className="w-full rounded-lg border border-stone-300 p-2 dark:border-stone-600 dark:bg-stone-800"
            />
          </label>
        </div>
        <details className="text-sm">
          <summary className="cursor-pointer text-stone-500 hover:text-stone-700 py-1 select-none">
            {t('trip.ai.moreOptions')}
          </summary>
          <div className="mt-2 space-y-2">
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
          </div>
        </details>
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
