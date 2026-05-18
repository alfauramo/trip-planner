import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['packing-list', tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('packing_items')
        .select('*')
        .eq('trip_id', tripId)
        .order('category', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!tripId,
  });

  const addItemMutation = useMutation({
    mutationFn: async ({ name, category, quantity }: { name: string; category: string; quantity: number }) => {
      const { data, error } = await supabase
        .from('packing_items')
        .insert([{ trip_id: tripId, name, category, quantity }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (newItem) => {
      await queryClient.cancelQueries({ queryKey: ['packing-list', tripId] });
      const previous = queryClient.getQueryData<PackingItem[]>(['packing-list', tripId]);
      if (previous) {
        queryClient.setQueryData<PackingItem[]>(['packing-list', tripId], (old) => [
          ...(old || []),
          { ...newItem, id: 'temp-' + Date.now(), trip_id: tripId, packed: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        ]);
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['packing-list', tripId], context.previous);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['packing-list', tripId] }),
  });

  const togglePackedMutation = useMutation({
    mutationFn: async (id: string) => {
      const existing = queryClient.getQueryData<PackingItem[]>(['packing-list', tripId]);
      const item = existing?.find(i => i.id === id);
      if (!item) return;

      const { error } = await supabase
        .from('packing_items')
        .update({ packed: !item.packed })
        .eq('id', id);

      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['packing-list', tripId] });
      const previous = queryClient.getQueryData<PackingItem[]>(['packing-list', tripId]);
      if (previous) {
        queryClient.setQueryData<PackingItem[]>(['packing-list', tripId], (old) =>
          old?.map(i => i.id === id ? { ...i, packed: !i.packed } : i)
        );
      }
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['packing-list', tripId], context.previous);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['packing-list', tripId] }),
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('packing_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['packing-list', tripId] });
      const previous = queryClient.getQueryData<PackingItem[]>(['packing-list', tripId]);
      if (previous) {
        queryClient.setQueryData<PackingItem[]>(['packing-list', tripId], (old) =>
          old?.filter(i => i.id !== id)
        );
      }
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['packing-list', tripId], context.previous);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['packing-list', tripId] }),
  });

  const addTemplateItemsMutation = useMutation({
    mutationFn: async (template: string) => {
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
      if (itemsToAdd.length === 0) return [];

      const { data, error } = await supabase
        .from('packing_items')
        .insert(itemsToAdd.map(item => ({ ...item, trip_id: tripId, quantity: 1 })))
        .select();

      if (error) throw error;
      return data || [];
    },
    onMutate: async (_template) => {
      await queryClient.cancelQueries({ queryKey: ['packing-list', tripId] });
      const previous = queryClient.getQueryData<PackingItem[]>(['packing-list', tripId]);
      return { previous };
    },
    onError: (_err, _template, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['packing-list', tripId], context.previous);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['packing-list', tripId] }),
  });

  return {
    items: (query.data || []) as PackingItem[],
    loading: query.isLoading,
    addItem: async (name: string, category: string = 'general', quantity: number = 1) =>
      addItemMutation.mutateAsync({ name, category, quantity }),
    togglePacked: async (id: string) => togglePackedMutation.mutateAsync(id),
    deleteItem: async (id: string) => deleteItemMutation.mutateAsync(id),
    addTemplateItems: async (template: string) => addTemplateItemsMutation.mutateAsync(template),
    refresh: async () => { await query.refetch(); },
  };
}
