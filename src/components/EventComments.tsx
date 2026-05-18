import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { MessageSquare, Send, Loader2 } from 'lucide-react';

interface Comment {
  id: string;
  event_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_name?: string;
}

interface EventCommentsProps {
  eventId: string;
}

export function EventComments({ eventId }: EventCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [tableExists, setTableExists] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadComments() {
      try {
        const { error: tableCheck } = await supabase
          .from('event_comments')
          .select('id', { count: 'exact', head: true })
          .limit(1);

        if (tableCheck && tableCheck.code === '42P01') {
          if (mounted) setTableExists(false);
          return;
        }

        if (mounted) setTableExists(true);

        const { data, error } = await supabase
          .from('event_comments')
          .select('*')
          .eq('event_id', eventId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        if (mounted && data) setComments(data as Comment[]);
      } catch {
        if (mounted) setTableExists(false);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadComments();
    return () => {
      mounted = false;
    };
  }, [eventId]);

  const handleSubmit = useCallback(async () => {
    if (!newComment.trim() || sending || !tableExists) return;
    setSending(true);

    const optimistic: Comment = {
      id: crypto.randomUUID(),
      event_id: eventId,
      user_id: 'local',
      content: newComment.trim(),
      created_at: new Date().toISOString(),
      user_name: 'Tú',
    };

    setComments((prev) => [...prev, optimistic]);
    setNewComment('');

    try {
      const { error } = await supabase
        .from('event_comments')
        .insert({ event_id: eventId, content: optimistic.content });

      if (error) throw error;
    } catch {
      setComments((prev) => prev.filter((c) => c.id !== optimistic.id));
    } finally {
      setSending(false);
    }
  }, [newComment, sending, tableExists, eventId]);

  if (loading) {
    return null;
  }

  if (!tableExists) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 opacity-60">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Comentarios</h3>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Los comentarios no están disponibles. Ejecuta la migración{' '}
          <code className="text-gray-500">event_comments</code> en Supabase.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-4 h-4 text-blue-500" />
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Comentarios</h3>
      </div>

      <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
        {comments.length === 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">No hay comentarios todavía</p>
        )}
        {comments.map((comment) => (
          <div key={comment.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {comment.user_name || 'Usuario'}
              </span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500">
                {new Date(comment.created_at).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">{comment.content}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Añadir comentario..."
          className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={sending}
        />
        <button
          onClick={handleSubmit}
          disabled={sending || !newComment.trim()}
          className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
