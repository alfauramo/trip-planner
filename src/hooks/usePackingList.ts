import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface PackingItem {
  id: string;
  trip_id: string;
  name: string;
  category: string;
  packed: boolean;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export function usePackingList(tripId: string) {
  const [items, setItems] = useState<PackingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    if (!tripId) return;
    
    setLoading(true);
    const { data } = await supabase
      .from('packing_items')
      .select('*')
      .eq('trip_id', tripId)
      .order('category', { ascending: true });
    
    setItems(data || []);
    setLoading(false);
  }, [tripId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const addItem = async (name: string, category: string = 'general', quantity: number = 1) => {
    const { data, error } = await supabase
      .from('packing_items')
      .insert([{ trip_id: tripId, name, category, quantity }])
      .select()
      .single();
    
    if (error) throw error;
    setItems(prev => [...prev, data]);
    return data;
  };

  const togglePacked = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    const { error } = await supabase
      .from('packing_items')
      .update({ packed: !item.packed })
      .eq('id', id);
    
    if (error) throw error;
    setItems(prev => prev.map(i => i.id === id ? { ...i, packed: !i.packed } : i));
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase
      .from('packing_items')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const addTemplateItems = async (template: string) => {
    const templates: Record<string, { name: string; category: string }[]> = {
      beach: [
        { name: 'Traje de baño', category: 'ropa' },
        { name: 'Protector solar', category: 'cuidado' },
        { name: 'Gafas de sol', category: 'accesorios' },
        { name: 'Toalla de playa', category: 'otros' },
        { name: 'Crema solar', category: 'cuidado' },
      ],
      city: [
        { name: 'Cámara de fotos', category: 'tecnología' },
        { name: 'Mapa de la ciudad', category: 'documentos' },
        { name: 'Adaptador de enchufe', category: 'tecnología' },
        { name: 'Zapatos cómodos', category: 'ropa' },
      ],
      mountain: [
        { name: 'Botas de montaña', category: 'ropa' },
        { name: 'Impermeable', category: 'ropa' },
        { name: 'Cantimplora', category: 'otros' },
        { name: 'Mapa de senderos', category: 'documentos' },
      ],
      winter: [
        { name: 'Abrigo', category: 'ropa' },
        { name: 'Guantes', category: 'ropa' },
        { name: 'Bufanda', category: 'ropa' },
        { name: 'Gorro', category: 'ropa' },
        { name: 'Botas de nieve', category: 'ropa' },
      ],
    };

    const itemsToAdd = templates[template] || [];
    if (itemsToAdd.length === 0) return;

    const { data, error } = await supabase
      .from('packing_items')
      .insert(itemsToAdd.map(item => ({ ...item, trip_id: tripId, quantity: 1 })))
      .select();

    if (error) throw error;
    setItems(prev => [...prev, ...(data || [])]);
  };

  return {
    items,
    loading,
    addItem,
    togglePacked,
    deleteItem,
    addTemplateItems,
    refresh: fetchItems,
  };
}
