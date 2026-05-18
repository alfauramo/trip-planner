import { useState, type FormEvent } from 'react';
import { useAIItinerary, type AIItineraryResult } from '../hooks/useAIItinerary';
import { Spinner } from './Loading';

interface Props {
  onSelect?: (result: AIItineraryResult) => void;
}

export function AIItineraryGenerator({ onSelect }: Props) {
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
      <h3 className="text-lg font-semibold">Generar itinerario con IA</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          placeholder="Destino (ej: Buenos Aires)"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          required
          className="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-800"
        />
        <div className="flex gap-3">
          <label className="flex-1">
            <span className="text-sm text-gray-500">Días</span>
            <input
              type="number"
              min={1}
              max={30}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-800"
            />
          </label>
          <label className="flex-1">
            <span className="text-sm text-gray-500">Viajeros</span>
            <input
              type="number"
              min={1}
              value={travelers}
              onChange={(e) => setTravelers(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-800"
            />
          </label>
        </div>
        <input
          type="text"
          placeholder="Presupuesto (opcional, ej: 50000 ARS)"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          className="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-800"
        />
        <textarea
          placeholder="Intereses (opcional, ej: gastronomía, historia, naturaleza)"
          value={interests}
          onChange={(e) => setInterests(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-800"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? <Spinner /> : 'Generar itinerario'}
        </button>
      </form>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {result && (
        <div className="space-y-4">
          {result.days.map((day) => (
            <div key={day.day} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
              <h4 className="font-medium">
                Día {day.day}: {day.title}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{day.description}</p>
              <ul className="mt-2 space-y-1">
                {day.activities.map((act, i) => (
                  <li key={i} className="text-sm">
                    <span className="font-medium text-gray-500">{act.time}</span> – {act.description}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <details className="text-sm">
            <summary className="cursor-pointer text-gray-500">Tips de viaje</summary>
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
              Usar este itinerario
            </button>
          )}
        </div>
      )}
    </div>
  );
}
