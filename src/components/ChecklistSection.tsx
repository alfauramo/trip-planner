import { useState, useEffect } from 'react';
import { Plus, CheckSquare, Check, Trash2, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useToast } from './Toast';
import { ProgressBar } from './ProgressBar';

export function ChecklistSection({ tripId, isViewer }: { tripId: string; isViewer?: boolean }) {
  const { t } = useTranslation();
  const [items, setItems] = useState<
    {
      id: string;
      trip_id: string;
      name: string;
      checked: boolean;
      completed: boolean;
      order: number;
      description?: string;
    }[]
  >([]);
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const [addingItem, setAddingItem] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchItems();
  }, [tripId]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('todo_items')
        .select('*')
        .eq('trip_id', tripId)
        .is('event_id', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setItems(data || []);
    } catch {
      showToast(t('errors.load'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const addItem = async () => {
    if (!newItem.trim()) return;
    setAddingItem(true);
    const { data, error } = await supabase
      .from('todo_items')
      .insert({ trip_id: tripId, name: newItem.trim(), completed: false })
      .select()
      .single();
    if (error) {
      showToast(t('errors.save'), 'error');
    } else {
      setItems((prev) => [data, ...prev]);
      setNewItem('');
    }
    setAddingItem(false);
  };

  const toggleItem = async (item: { id: string; completed: boolean }) => {
    setTogglingIds((prev) => new Set(prev).add(item.id));
    const { error } = await supabase.from('todo_items').update({ completed: !item.completed }).eq('id', item.id);
    if (!error) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, completed: !i.completed } : i)));
    } else {
      showToast(t('errors.save'), 'error');
    }
    setTogglingIds((prev) => {
      const next = new Set(prev);
      next.delete(item.id);
      return next;
    });
  };

  const deleteItem = async (id: string) => {
    setDeletingIds((prev) => new Set(prev).add(id));
    const { error } = await supabase.from('todo_items').delete().eq('id', id);
    if (!error) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    } else {
      showToast(t('errors.save'), 'error');
    }
    setDeletingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const completedCount = items.filter((i) => i.completed).length;
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  const cardCls = 'card p-4';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-stone-800 dark:text-white flex items-center gap-1.5">
          <CheckSquare className="w-4 h-4" /> {t('checklist.title')}
        </h2>
        {items.length > 0 && (
          <span className="text-xs text-stone-500">
            {completedCount}/{items.length}
          </span>
        )}
      </div>
      {items.length > 0 && (
        <div className={cardCls}>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-stone-600 dark:text-stone-300">{t('common.progress')}</span>
            <span className="font-medium text-stone-800 dark:text-white">{Math.round(progress)}%</span>
          </div>
          <ProgressBar value={progress} barClassName="bg-green-500" />
        </div>
      )}
      {!isViewer && (
        <div className={cardCls}>
          <div className="flex gap-2">
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addItem()}
              placeholder={t('checklist.addTask')}
              className="input flex-1"
            />
            <button
              type="button"
              onClick={addItem}
              disabled={!newItem.trim() || addingItem}
              aria-label={t('checklist.addTask')}
              className="btn-primary px-4"
            >
              {addingItem ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            </button>
          </div>
        </div>
      )}
      {loading ? (
        <div className="text-center py-6 text-sm text-stone-500">Cargando...</div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon-bg">
            <CheckSquare className="empty-state-icon" />
          </div>
          <p className="empty-state-title">No hay tareas en tu checklist</p>
        </div>
      ) : (
        <div className="card list-item-divider">
          {items.map((item) => (
            <div key={item.id} className="list-item list-enter">
              <button
                type="button"
                onClick={() => toggleItem(item)}
                disabled={togglingIds.has(item.id)}
                aria-label={item.completed ? 'Marcar como pendiente' : 'Marcar como completado'}
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${item.completed ? 'bg-green-500 border-green-500 text-white' : 'border-stone-300 dark:border-stone-600'} ${togglingIds.has(item.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {togglingIds.has(item.id) ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  item.completed && <Check className="w-3 h-3" />
                )}
              </button>
              <span
                className={`flex-1 text-sm ${item.completed ? 'text-stone-400 line-through' : 'text-stone-800 dark:text-white'}`}
              >
                {item.description}
              </span>
              {!isViewer && (
                <button
                  type="button"
                  onClick={() => deleteItem(item.id)}
                  disabled={deletingIds.has(item.id)}
                  aria-label="Eliminar tarea"
                  className={`p-1 ${deletingIds.has(item.id) ? 'text-stone-300 cursor-not-allowed' : 'text-stone-400 hover:text-red-500'}`}
                >
                  {deletingIds.has(item.id) ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
