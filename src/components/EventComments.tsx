import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [tableExists, setTableExists] = useState<boolean | null>(null);
  const sendingRef = useRef(false);
  const tableExistsRef = useRef<boolean | null>(null);
  const eventIdRef = useRef(eventId);

  sendingRef.current = sending;
  tableExistsRef.current = tableExists;
  eventIdRef.current = eventId;

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
    const text = newComment.trim();
    if (!text || sendingRef.current || !tableExistsRef.current) return;
    setSending(true);

    const optimistic: Comment = {
      id: crypto.randomUUID(),
      event_id: eventIdRef.current,
      user_id: 'local',
      content: text,
      created_at: new Date().toISOString(),
      user_name: t('comments.you'),
    };

    setComments((prev) => [...prev, optimistic]);

    try {
      const { error } = await supabase
        .from('event_comments')
        .insert({ event_id: eventIdRef.current, content: optimistic.content });

      if (error) throw error;
      setNewComment('');
    } catch {
      setComments((prev) => prev.filter((c) => c.id !== optimistic.id));
    } finally {
      setSending(false);
    }
  }, [newComment, t]);

  if (loading) {
    return null;
  }

  if (!tableExists) {
    return (
      <div className="card p-5 opacity-60">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-4 h-4 text-stone-400" />
          <h3 className="text-sm font-semibold text-stone-500 dark:text-stone-400">{t('comments.title')}</h3>
        </div>
        <p className="text-xs text-stone-400 dark:text-stone-500">{t('comments.notAvailable')}</p>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-4 h-4 text-emerald-600" />
        <h3 className="text-sm font-semibold text-stone-800 dark:text-white">{t('comments.title')}</h3>
      </div>

      <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
        {comments.length === 0 && (
          <p className="text-xs text-stone-400 dark:text-stone-500 text-center py-4">{t('comments.empty')}</p>
        )}
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="bg-stone-50 dark:bg-stone-700 rounded-lg p-3 transition-all duration-150 hover:bg-stone-100 dark:hover:bg-stone-600"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-stone-700 dark:text-stone-300">
                {comment.user_name || t('comments.user')}
              </span>
              <span className="text-[10px] text-stone-400 dark:text-stone-500">
                {new Date(comment.created_at).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <p className="text-sm text-stone-600 dark:text-stone-300">{comment.content}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder={t('comments.placeholder')}
          className="flex-1 px-3 py-2 text-sm border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 text-stone-800 dark:text-white placeholder-gray-400 dark:placeholder-stone-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-150"
          disabled={sending}
        />
        <button
          onClick={handleSubmit}
          disabled={sending || !newComment.trim()}
          className="btn-primary px-3 py-2 rounded-lg"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
