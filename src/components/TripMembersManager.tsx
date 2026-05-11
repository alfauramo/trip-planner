import { useState } from 'react';
import { UserPlus, Mail, Crown, Eye, Edit, X, Send, Loader2, Link as LinkIcon } from 'lucide-react';
import { TripMember } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from './ConfirmModal';
import { useToast } from './Toast';
import { sendInviteEmail } from '../lib/email';

function getMemberDisplayName(member: TripMember): string {
  if (member.profile?.full_name) return member.profile.full_name;
  if (member.profile?.alias) return member.profile.alias;
  return member.email.split('@')[0];
}

interface TripMembersManagerProps {
  tripId: string;
  tripTitle: string;
  members: TripMember[];
  onMembersChange: () => void;
}

export function TripMembersManager({ tripId, tripTitle, members, onMembersChange }: TripMembersManagerProps) {
  const { user } = useAuth();
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'viewer' | 'editor'>('viewer');
  const [loading, setLoading] = useState(false);

  const handleInvite = async () => {
    if (!email.trim() || !user) return;
    
    setLoading(true);

    try {
      const { data, error: funcError } = await supabase.rpc('invite_trip_member', {
        p_trip_id: tripId,
        p_email: email.trim(),
        p_role: role,
        p_invited_by: user.id,
      });

      if (funcError) throw funcError;

      const result = data as { success: boolean; message: string; needs_email?: boolean };
      
      if (result.success) {
        if (result.needs_email) {
          try {
            const acceptUrl = `${window.location.origin}/invite/${tripId}`;
            await sendInviteEmail(
              email.trim(),
              tripTitle,
              user.email || 'Alguien',
              acceptUrl
            );
            showToast('Invitación enviada correctamente');
          } catch (emailError) {
            console.error('Error enviando email:', emailError);
            showToast('Invitación creada (email no enviado)', 'error');
          }
        } else {
          showToast('Usuario añadido al viaje');
        }
        
        setEmail('');
        onMembersChange();
        setShowInvite(false);
      }
    } catch (err: any) {
      showToast(err.message || 'Error al enviar invitación', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!await confirm('¿Eliminar a este miembro del viaje?')) return;

    try {
      const { error } = await supabase
        .from('trip_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
      onMembersChange();
      showToast('Miembro eliminado');
    } catch (err: any) {
      showToast(err.message || 'Error al eliminar', 'error');
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: 'viewer' | 'editor') => {
    try {
      const { error } = await supabase
        .from('trip_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;
      onMembersChange();
      showToast('Rol actualizado');
    } catch (err: any) {
      showToast(err.message || 'Error al actualizar', 'error');
    }
  };

  const getShareLink = () => {
    return `${window.location.origin}/invite/${tripId}`;
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(getShareLink());
    showToast('Enlace copiado al portapapeles');
  };

  const roleIcons = {
    owner: <Crown className="w-4 h-4 text-yellow-500" />,
    editor: <Edit className="w-4 h-4 text-blue-500" />,
    viewer: <Eye className="w-4 h-4 text-gray-500 dark:text-gray-400" />,
  };

  const roleLabels = {
    owner: 'Propietario',
    editor: 'Editor',
    viewer: 'Visor',
  };

  const owner = members.find(m => m.role === 'owner');

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800 dark:text-white">
            <UserPlus className="w-5 h-5" />
            Miembros del viaje
          </h3>
          <button
            onClick={() => setShowInvite(!showInvite)}
            className="flex items-center gap-1 text-sm bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600"
          >
            <Mail className="w-4 h-4" />
            Invitar
          </button>
        </div>

        <div className="space-y-2">
          {owner && (
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                {roleIcons.owner}
                <div>
                  <p className="font-medium text-sm text-gray-800 dark:text-white">{getMemberDisplayName(owner)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{roleLabels.owner}</p>
                </div>
              </div>
            </div>
          )}

          {members
            .filter(m => m.role !== 'owner')
            .map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  {roleIcons[member.role]}
                  <div>
                    <p className="font-medium text-sm text-gray-800 dark:text-white">{getMemberDisplayName(member)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {roleLabels[member.role]}
                      {member.status === 'pending' && ' (pendiente)'}
                    </p>
                  </div>
                </div>
                {member.role !== 'owner' && (
                  <div className="flex items-center gap-2">
                    <select
                      value={member.role}
                      onChange={(e) => handleUpdateRole(member.id, e.target.value as 'viewer' | 'editor')}
                      className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                      disabled={member.status === 'pending'}
                    >
                      <option value="editor">Editor</option>
                      <option value="viewer">Visor</option>
                    </select>
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="p-1 text-gray-400 hover:text-red-500"
                      title="Eliminar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
        </div>

        {members.filter(m => m.role !== 'owner').length === 0 && (
          <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-4">
            No hay otros miembros todavía
          </p>
        )}
      </div>

      {/* Enlace para compartir */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-3 text-gray-800 dark:text-white">
          <LinkIcon className="w-5 h-5" />
          Compartir viaje
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Copia este enlace para invitar a alguien:
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={getShareLink()}
            readOnly
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white"
          />
          <button
            onClick={copyShareLink}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-sm"
          >
            Copiar
          </button>
        </div>
      </div>

      {showInvite && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={(e) => e.target === e.currentTarget && setShowInvite(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Invitar a "{tripTitle}"</h3>
              <button
                onClick={() => setShowInvite(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Si el usuario ya tiene cuenta, se añadirá directamente. Si no, recibirá un email de invitación con el enlace.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@ejemplo.com"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rol del invitado
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="viewer"
                      checked={role === 'viewer'}
                      onChange={() => setRole('viewer')}
                      className="text-blue-500"
                    />
                    <Eye className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Visor</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="editor"
                      checked={role === 'editor'}
                      onChange={() => setRole('editor')}
                      className="text-blue-500"
                    />
                    <Edit className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Editor</span>
                  </label>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {role === 'viewer' 
                    ? 'Solo podrá ver el viaje y su itinerario' 
                    : 'Podrá editar días, lugares y notas del viaje'}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowInvite(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleInvite}
                disabled={loading || !email.trim()}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Enviar invitación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
