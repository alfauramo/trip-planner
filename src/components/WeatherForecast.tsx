import { useState, useEffect, useMemo } from 'react';
import { Cloud, CloudRain, Sun, CloudSnow, Droplets } from 'lucide-react';
import { TripWithDetails } from '../types';

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

const weatherDescriptions: Record<number, string> = {
  0: 'Despejado',
  1: 'Mayormente despejado',
  2: 'Parcialmente nublado',
  3: 'Nublado',
  45: 'Niebla',
  48: 'Niebla',
  51: 'Llovizna',
  53: 'Llovizna',
  55: 'Llovizna',
  61: 'Lluvia',
  63: 'Lluvia moderada',
  65: 'Lluvia fuerte',
  71: 'Nieve',
  73: 'Nieve moderada',
  75: 'Nieve fuerte',
  77: 'Granizo',
  80: 'Chubascos',
  81: 'Chubascos',
  82: 'Chubascos fuertes',
  85: 'Chubascos de nieve',
  86: 'Chubascos de nieve',
  95: 'Tormenta',
  96: 'Tormenta',
  99: 'Tormenta',
};

export function WeatherForecast({ trip }: WeatherForecastProps) {
  const [weather, setWeather] = useState<WeatherDay[]>([]);
  const [showForecast, setShowForecast] = useState(false);

  const tripCoords = useMemo(() => {
    const allEvents = trip.days.flatMap(d => d.events);
    const eventsWithCoords = allEvents.filter(e => e.latitude && e.longitude);
    
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
          `https://api.open-meteo.com/v1/forecast?latitude=${tripCoords.lat}&longitude=${tripCoords.lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&timezone=auto&forecast_days=${daysToFetch}`
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

  if (!tripCoords || weather.length === 0) {
    return null;
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
  };

  return (
    <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4">
      <button
        onClick={() => setShowForecast(!showForecast)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Sun className="w-5 h-5 text-yellow-500" />
          <span className="font-medium text-gray-800 dark:text-white">Pronóstico del tiempo</span>
        </div>
        <span className="text-sm text-gray-500">{showForecast ? 'Ocultar' : 'Ver'}</span>
      </button>

      {showForecast && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {weather.map((day, i) => {
            const Icon = weatherIcons[day.weathercode] || Cloud;
            return (
              <div
                key={i}
                className="bg-white/80 dark:bg-gray-700/80 rounded-lg p-3 text-center"
              >
                <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {formatDate(day.date)}
                </div>
                <Icon className="w-8 h-8 mx-auto my-2 text-blue-500" />
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {weatherDescriptions[day.weathercode] || 'N/A'}
                </div>
                <div className="flex items-center justify-center gap-2 text-sm">
                  <span className="font-medium text-red-500">{day.tempMax}°</span>
                  <span className="text-gray-400">/</span>
                  <span className="text-blue-500">{day.tempMin}°</span>
                </div>
                {day.precipitation > 0 && (
                  <div className="flex items-center justify-center gap-1 mt-1 text-xs text-gray-500">
                    <Droplets className="w-3 h-3" />
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
