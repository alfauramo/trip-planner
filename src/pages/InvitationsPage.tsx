import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Calendar, Plane, Check, X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../components/ConfirmModal';

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
  const navigate = useNavigate();
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (user?.email) {
      fetchInvitations();
    }
  }, [user?.email]);

  const fetchInvitations = async () => {
    if (!user?.email) return;
    
    try {
      const { data, error } = await supabase
        .from('trip_invitations')
        .select(`
          *,
          trip:trip_id (
            title,
            start_date,
            cover_image
          )
        `)
        .eq('email', user.email)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (err) {
      console.error('Error fetching invitations:', err);
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async (invitation: PendingInvitation) => {
    if (!user) return;
    
    setActionLoading(invitation.id);
    
    try {
      const { error: memberError } = await supabase
        .from('trip_members')
        .insert([{
          trip_id: invitation.trip_id,
          user_id: user.id,
          email: user.email,
          role: invitation.role,
          status: 'accepted'
        }]);

      if (memberError) throw memberError;

      await supabase
        .from('trip_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id);

      navigate(`/trips/${invitation.trip_id}`);
    } catch (err) {
      console.error('Error accepting invitation:', err);
      alert('Error al aceptar la invitación');
    } finally {
      setActionLoading(null);
    }
  };

  const declineInvitation = async (invitationId: string) => {
    if (!await confirm('¿Declinar esta invitación?')) return;
    
    setActionLoading(invitationId);
    
    try {
      await supabase
        .from('trip_invitations')
        .update({ status: 'declined' })
        .eq('id', invitationId);

      setInvitations(prev => prev.filter(i => i.id !== invitationId));
    } catch (err) {
      console.error('Error declining invitation:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5 text-gray-600" />
            </Link>
            <div className="flex items-center gap-2">
              <Mail className="w-6 h-6 text-blue-500" />
              <h1 className="text-xl font-bold text-gray-800">Invitaciones</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {invitations.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              No hay invitaciones pendientes
            </h2>
            <p className="text-gray-500 mb-6">
              Cuando alguien te invite a un viaje, aparecerá aquí.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-blue-500 hover:underline"
            >
              <Plane className="w-4 h-4" />
              Ir a Mis Viajes
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600 mb-4">
              Tienes {invitations.length} invitación(es) pendiente(s):
            </p>
            
            {invitations.map((invitation) => (
              <div key={invitation.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                {invitation.trip?.cover_image && (
                  <div className="h-32 overflow-hidden">
                    <img
                      src={invitation.trip.cover_image}
                      alt={invitation.trip.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {invitation.trip?.title || 'Viaje sin título'}
                      </h3>
                      <p className="text-sm text-gray-500 capitalize">
                        Te han invitado como {invitation.role}
                      </p>
                      {invitation.trip?.start_date && (
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(invitation.trip.start_date)}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {formatDate(invitation.created_at)}
                    </span>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => acceptInvitation(invitation)}
                      disabled={actionLoading === invitation.id}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-green-600 disabled:opacity-50"
                    >
                      {actionLoading === invitation.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      Aceptar
                    </button>
                    <button
                      onClick={() => declineInvitation(invitation.id)}
                      disabled={actionLoading === invitation.id}
                      className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50"
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
