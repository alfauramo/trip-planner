import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Cloud, CloudRain, Sun, CloudSnow, Droplets } from 'lucide-react';
import { TripWithDetails } from '../types';
import { formatDate } from '../lib/date-utils';

interface WeatherDay {
  date: string;
  tempMax: number;
  tempMin: number;
  precipitation: number;
  weathercode: number;
}

interface WeatherForecastProps {
  trip: TripWithDetails;
}

const weatherIcons: Record<number, typeof Sun> = {
  0: Sun,
  1: Sun,
  2: Cloud,
  3: Cloud,
  45: Cloud,
  48: Cloud,
  51: CloudRain,
  53: CloudRain,
  55: CloudRain,
  61: CloudRain,
  63: CloudRain,
  65: CloudRain,
  71: CloudSnow,
  73: CloudSnow,
  75: CloudSnow,
  77: CloudSnow,
  80: CloudRain,
  81: CloudRain,
  82: CloudRain,
  85: CloudSnow,
  86: CloudSnow,
  95: CloudRain,
  96: CloudRain,
  99: CloudRain,
};

export function WeatherForecast({ trip }: WeatherForecastProps) {
  const { t } = useTranslation();
  const [weather, setWeather] = useState<WeatherDay[]>([]);
  const [showForecast, setShowForecast] = useState(false);

  const tripCoords = useMemo(() => {
    const allEvents = trip.days.flatMap((d) => d.events);
    const eventsWithCoords = allEvents.filter((e) => e.latitude && e.longitude);

    if (eventsWithCoords.length === 0) return null;

    const lat = eventsWithCoords.reduce((sum, e) => sum + (e.latitude || 0), 0) / eventsWithCoords.length;
    const lng = eventsWithCoords.reduce((sum, e) => sum + (e.longitude || 0), 0) / eventsWithCoords.length;

    return { lat, lng };
  }, [trip]);

  const startDate = trip.start_date ? new Date(trip.start_date) : null;
  const endDate = trip.end_date ? new Date(trip.end_date) : null;

  useEffect(() => {
    if (!tripCoords || !startDate) {
      return;
    }

    const fetchWeather = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tripStart = new Date(startDate);
      tripStart.setHours(0, 0, 0, 0);

      if (tripStart < today) {
        return;
      }

      const daysToFetch = endDate
        ? Math.min(Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)), 16)
        : Math.min(Math.ceil((tripStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)), 16);

      if (daysToFetch <= 0) {
        return;
      }

      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${tripCoords.lat}&longitude=${tripCoords.lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&timezone=auto&forecast_days=${daysToFetch}`,
        );

        if (!response.ok) throw new Error('Error fetching weather');

        const data = await response.json();

        const weatherData: WeatherDay[] = data.daily.time.map((date: string, i: number) => ({
          date,
          tempMax: Math.round(data.daily.temperature_2m_max[i]),
          tempMin: Math.round(data.daily.temperature_2m_min[i]),
          precipitation: data.daily.precipitation_sum[i],
          weathercode: data.daily.weathercode[i],
        }));

        setWeather(weatherData);
      } catch {
        // Silently fail - weather is optional
      }
    };

    fetchWeather();
  }, [tripCoords, startDate, endDate]);

  if (!tripCoords) {
    const hasEvents = trip.days.some((d) => d.events.length > 0);
    if (hasEvents) {
      return (
        <div className="mt-4 bg-gradient-to-r from-stone-50 to-stone-50/50 dark:from-stone-800 dark:to-stone-700 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <Sun className="w-5 h-5 text-yellow-500" />
            <span className="text-sm text-stone-500">{t('weather.addLocations')}</span>
          </div>
        </div>
      );
    }
    return null;
  }

  if (weather.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 bg-gradient-to-r from-emerald-50 to-emerald-50/50 dark:from-stone-800 dark:to-stone-700 rounded-xl p-4">
      <button onClick={() => setShowForecast(!showForecast)} className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sun className="w-5 h-5 text-yellow-500" />
          <span className="font-medium text-stone-800 dark:text-white">{t('weather.title')}</span>
        </div>
        <span className="text-sm text-stone-500">{showForecast ? t('common.hide') : t('common.show')}</span>
      </button>

      {showForecast && (
        <div className="mt-3 grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {weather.map((day, i) => {
            const Icon = weatherIcons[day.weathercode] || Cloud;
            return (
              <div key={i} className="bg-white/80 dark:bg-stone-700/80 rounded-lg p-2 text-center">
                <div className="text-xs font-medium text-stone-600 dark:text-stone-300">{formatDate(day.date)}</div>
                <Icon className="w-5 h-5 sm:w-7 sm:h-7 mx-auto my-1.5 text-emerald-600" />
                <div className="flex items-center justify-center gap-1.5 text-xs">
                  <span className="font-medium text-red-500">{day.tempMax}°</span>
                  <span className="text-stone-400 text-[10px]">/</span>
                  <span className="text-emerald-600">{day.tempMin}°</span>
                </div>
                {day.precipitation > 0 && (
                  <div className="flex items-center justify-center gap-0.5 mt-0.5 text-[10px] text-stone-500">
                    <Droplets className="w-2.5 h-2.5" />
                    {day.precipitation}mm
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
