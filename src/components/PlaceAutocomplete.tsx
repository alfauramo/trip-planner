import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Loader2, Search } from 'lucide-react';

interface PlaceResult {
  place_id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  google_maps_url?: string;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
}

interface PlaceAutocompleteProps {
  value?: string;
  onSelect: (place: PlaceResult) => void;
  placeholder?: string;
  className?: string;
}

export function PlaceAutocomplete({ value = '', onSelect, placeholder, className = '' }: PlaceAutocompleteProps) {
  const { t } = useTranslation();
  const resolvedPlaceholder = placeholder || t('event.searchPlace');
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchPlaces = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
        {
          headers: {
            Accept: 'application/json',
          },
        },
      );

      if (response.ok) {
        const data: NominatimResult[] = await response.json();
        setSuggestions(data);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error searching places:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      setInputValue(query);
      setSelectedPlace(null);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      if (!query.trim()) {
        setSuggestions([]);
        return;
      }

      debounceRef.current = setTimeout(() => {
        searchPlaces(query);
      }, 300);
    },
    [searchPlaces],
  );

  const handleSelect = useCallback(
    (result: NominatimResult) => {
      const place: PlaceResult = {
        place_id: result.place_id.toString(),
        name: result.display_name.split(',')[0],
        address: result.display_name,
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        google_maps_url: `https://www.openstreetmap.org/?mlat=${result.lat}&mlon=${result.lon}#map=16/${result.lat}/${result.lon}`,
      };

      setSelectedPlace(place);
      setInputValue(place.name);
      setSuggestions([]);
      setShowSuggestions(false);
      onSelect(place);
    },
    [onSelect],
  );

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-stone-500" />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={resolvedPlaceholder}
          className="w-full pl-10 pr-10 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 text-stone-800 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-stone-500 animate-spin" />
        )}
        {selectedPlace && !loading && (
          <button
            type="button"
            onClick={() => {
              setSelectedPlace(null);
              setInputValue('');
              onSelect({ place_id: '', name: '', address: '', latitude: 0, longitude: 0 });
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:text-stone-500"
          >
            <span className="text-xs">✕</span>
          </button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg shadow-lg max-h-60 overflow-auto">
          {suggestions.map((result) => (
            <li
              key={result.place_id}
              onClick={() => handleSelect(result)}
              className="px-4 py-3 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-700 border-b border-stone-100 dark:border-stone-700 last:border-b-0"
            >
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-stone-800 dark:text-white">{result.display_name.split(',')[0]}</div>
                  <div className="text-sm text-stone-500 dark:text-stone-400 line-clamp-2">
                    {result.display_name.split(',').slice(1).join(',').trim()}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
