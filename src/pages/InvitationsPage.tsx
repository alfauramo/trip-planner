import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Mail, Calendar, Plane, Check, X, Loader2, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../components/ConfirmModal';
import { useToast } from '../components/Toast';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../lib/date-utils';
import { ImageWithFallback } from '../components/ImageWithFallback';

interface PendingInvitation {
  id: string;
  trip_id: string;
  email: string;
  role: string;
  token: string;
  created_at: string;
  trip?: {
    title: string;
    start_date?: string;
    cover_image?: string;
  };
}

export function InvitationsPage() {
  const { user } = useAuth();
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { tripId } = useParams<{ tripId?: string }>();
  const [tripTitle, setTripTitle] = useState('');
  const [tripTitleLoading, setTripTitleLoading] = useState(false);

  useEffect(() => {
    if (tripId) {
      setTripTitleLoading(true);
      supabase
        .from('trips')
        .select('title')
        .eq('id', tripId)
        .single()
        .then(({ data, error }) => {
          if (!error && data) setTripTitle(data.title);
          setTripTitleLoading(false);
        });
    }
  }, [tripId]);

  useEffect(() => {
    if (user?.email) fetchInvitations();
  }, [user?.email]);

  const fetchInvitations = async () => {
    if (!user?.email) return;
    try {
      const { data, error } = await supabase
        .from('trip_invitations')
        .select(`*, trip:trip_id (title, start_date, cover_image)`)
        .eq('email', user.email)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setInvitations(data || []);
    } catch (err) {
      console.error('Error fetching invitations:', err);
      setFetchError(err instanceof Error ? err.message : t('member.invitation.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async (invitation: PendingInvitation) => {
    if (!user) return;
    setActionLoading(invitation.id);
    try {
      const { error: memberError } = await supabase.from('trip_members').insert([
        {
          trip_id: invitation.trip_id,
          user_id: user.id,
          email: user.email,
          role: invitation.role,
          status: 'accepted',
        },
      ]);
      if (memberError) throw memberError;
      await supabase.from('trip_invitations').update({ status: 'accepted' }).eq('id', invitation.id);
      navigate(`/trips/${invitation.trip_id}`);
    } catch (err) {
      console.error('Error accepting invitation:', err);
      showToast(t('member.invitation.error'), 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const declineInvitation = async (invitationId: string) => {
    if (!(await confirm(t('member.invitation.decline.confirm')))) return;
    setActionLoading(invitationId);
    try {
      await supabase.from('trip_invitations').update({ status: 'declined' }).eq('id', invitationId);
      setInvitations((prev) => prev.filter((i) => i.id !== invitationId));
    } catch (err) {
      console.error('Error declining invitation:', err);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      <Helmet>
        <title>Invitaciones | Trip Planner</title>
      </Helmet>
      <header className="bg-white dark:bg-stone-800 border-b dark:border-stone-700 md:border-b-0 md:shadow-sm">
        <div className="px-4 py-3 md:page-container md:py-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label={t('common.back')}
            className="p-1.5 -ml-1.5 md:p-2 md:ml-0 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-stone-600 dark:text-stone-300" />
          </button>
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 md:w-6 md:h-6 text-emerald-600" />
            <h1 className="text-lg md:text-xl font-bold text-stone-800 dark:text-white">
              {t('member.invitation.title')}
            </h1>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 md:page-container md:py-8">
        {tripId && tripTitle && !tripTitleLoading && (
          <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 p-4 rounded-xl mb-4">
            <p className="text-emerald-800 dark:text-emerald-200 text-sm">
              Te han invitado a unirte a <strong>{tripTitle}</strong>
            </p>
          </div>
        )}
        {fetchError && <div className="form-error mb-4">{fetchError}</div>}
        {invitations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon-bg">
              <Mail className="empty-state-icon" />
            </div>
            <p className="empty-state-title">{t('member.invitation.empty')}</p>
            <p className="empty-state-desc">{t('member.invitation.empty.desc')}</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-emerald-600 text-sm font-medium hover:underline"
            >
              <Plane className="w-4 h-4" /> {t('member.invitation.goToTrips')}
            </Link>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            <p className="text-sm text-stone-600 dark:text-stone-400 mb-3 md:mb-4">
              {t('member.invitation.count', { count: invitations.length })}
            </p>
            {invitations.map((invitation) => (
              <div key={invitation.id} className="card overflow-hidden list-enter">
                {invitation.trip?.cover_image && (
                  <div className="h-28 md:h-32 overflow-hidden">
                    <ImageWithFallback
                      src={invitation.trip.cover_image}
                      alt={invitation.trip.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                      fallback={null}
                    />
                  </div>
                )}
                <div className="p-4 md:p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0 md:flex-none">
                      <h3 className="font-semibold md:text-lg text-stone-800 dark:text-white">
                        {invitation.trip?.title || t('trip.noTitle')}
                      </h3>
                      <p className="text-xs md:text-sm text-stone-500 capitalize mt-0.5">
                        {t('member.invitation.invitedAs', { role: invitation.role })}
                      </p>
                      {invitation.trip?.start_date && (
                        <p className="text-xs md:text-sm text-stone-500 flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3 md:w-4 md:h-4" /> {formatDate(invitation.trip.start_date)}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] md:text-xs text-stone-400 shrink-0">
                      {formatDate(invitation.created_at)}
                    </span>
                  </div>
                  <div className="flex gap-2 md:gap-3">
                    <button
                      onClick={() => acceptInvitation(invitation)}
                      disabled={actionLoading === invitation.id}
                      className="flex-1 flex items-center justify-center gap-1.5 md:gap-2 bg-green-500 text-white py-2.5 rounded-xl md:px-4 md:rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-50"
                    >
                      {actionLoading === invitation.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      {t('member.invitation.accept')}
                    </button>
                    <button
                      onClick={() => declineInvitation(invitation.id)}
                      disabled={actionLoading === invitation.id}
                      className="px-4 py-2.5 border border-stone-200 dark:border-stone-600 md:border-stone-300 md:dark:border-stone-600 rounded-xl md:rounded-lg text-stone-500 md:text-stone-600 md:dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-700 disabled:opacity-50"
                      aria-label="Rechazar invitación"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
