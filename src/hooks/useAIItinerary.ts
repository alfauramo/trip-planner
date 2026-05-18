import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface AIItineraryInput {
  destination: string;
  days: number;
  travelers: number;
  budget?: string;
  interests?: string;
}

export interface DayPlan {
  day: number;
  title: string;
  description: string;
  activities: { time: string; description: string }[];
}

export interface AIItineraryResult {
  days: DayPlan[];
  tips: string[];
}

export function useAIItinerary() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (input: AIItineraryInput): Promise<AIItineraryResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-itinerary', {
        body: input,
      });
      if (fnError) throw fnError;
      return data as AIItineraryResult;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error generando itinerario';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { generate, loading, error };
}
