import { useState } from 'react';
import { UserPlus, Mail, Crown, Eye, Edit, X, Send, Loader2, Link as LinkIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TripMember } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Modal } from './Modal';
import { useConfirm } from './ConfirmModal';
import { useToast } from './Toast';
import { sendInviteEmail } from '../lib/email';
import { appUrl } from '../lib/urls';
import { getMemberDisplayName } from './EventHelpers';

interface TripMembersManagerProps {
  tripId: string;
  tripTitle: string;
  members: TripMember[];
  onMembersChange: () => void;
  isViewer?: boolean;
}

export function TripMembersManager({ tripId, tripTitle, members, onMembersChange, isViewer }: TripMembersManagerProps) {
  const { user } = useAuth();
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const { t } = useTranslation();
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
            const acceptUrl = appUrl(`/invite/${tripId}`);
            await sendInviteEmail(email.trim(), tripTitle, user.email || 'Alguien', acceptUrl);
            showToast(t('member.invite.sent'));
          } catch (emailError) {
            console.error('Error enviando email:', emailError);
            showToast(t('member.invite.created'), 'error');
          }
        } else {
          showToast(t('member.invite.added'));
        }

        setEmail('');
        onMembersChange();
        setShowInvite(false);
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : t('member.invite.error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!(await confirm(t('member.delete.confirm')))) return;

    try {
      const { error } = await supabase.from('trip_members').delete().eq('id', memberId);

      if (error) throw error;
      onMembersChange();
      showToast(t('member.deleted'));
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error al eliminar', 'error');
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: 'viewer' | 'editor') => {
    try {
      const { error } = await supabase.from('trip_members').update({ role: newRole }).eq('id', memberId);

      if (error) throw error;
      onMembersChange();
      showToast(t('member.updated'));
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error al actualizar', 'error');
    }
  };

  const getShareLink = () => {
    return appUrl(`/invite/${tripId}`);
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(getShareLink());
    showToast(t('trip.shared'));
  };

  const roleIcons = {
    owner: <Crown className="w-4 h-4 text-yellow-500" />,
    editor: <Edit className="w-4 h-4 text-emerald-600" />,
    viewer: <Eye className="w-4 h-4 text-stone-500 dark:text-stone-400" />,
  };

  const roleLabels = {
    owner: t('member.role.owner'),
    editor: t('member.role.editor'),
    viewer: t('member.role.viewer'),
  };

  const owner = members.find((m) => m.role === 'owner');

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-stone-800 dark:text-white">
            <UserPlus className="w-5 h-5" />
            {t('member.title')}
          </h3>
          {!isViewer && (
            <button onClick={() => setShowInvite(!showInvite)} className="btn-primary text-sm px-3 py-1.5 rounded-lg">
              <Mail className="w-4 h-4" />
              {t('member.invite')}
            </button>
          )}
        </div>

        <div className="space-y-2">
          {owner && (
            <div className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-700 rounded-lg transition-all duration-150 hover:bg-stone-100 dark:hover:bg-stone-600">
              <div className="flex items-center gap-3">
                {roleIcons.owner}
                <div>
                  <p className="font-medium text-sm text-stone-800 dark:text-white">{getMemberDisplayName(owner)}</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">{roleLabels.owner}</p>
                </div>
              </div>
            </div>
          )}

          {members
            .filter((m) => m.role !== 'owner')
            .map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-700 rounded-lg transition-all duration-150 hover:bg-stone-100 dark:hover:bg-stone-600"
              >
                <div className="flex items-center gap-3">
                  {roleIcons[member.role]}
                  <div>
                    <p className="font-medium text-sm text-stone-800 dark:text-white">{getMemberDisplayName(member)}</p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {roleLabels[member.role]}
                      {member.status === 'pending' && t('member.pending')}
                    </p>
                  </div>
                </div>
                {member.role !== 'owner' && !isViewer && (
                  <div className="flex items-center gap-2">
                    <select
                      value={member.role}
                      onChange={(e) => handleUpdateRole(member.id, e.target.value as 'viewer' | 'editor')}
                      className="text-sm border border-stone-300 dark:border-stone-600 rounded px-2 py-1 bg-white dark:bg-stone-800 text-stone-800 dark:text-white transition-all duration-150"
                      disabled={member.status === 'pending'}
                    >
                      <option value="editor">{t('member.role.editor')}</option>
                      <option value="viewer">{t('member.role.viewer')}</option>
                    </select>
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="p-1 text-stone-400 hover:text-red-500 transition-all duration-150"
                      title={t('member.remove')}
                      aria-label={t('member.remove')}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
        </div>

        {members.filter((m) => m.role !== 'owner').length === 0 && (
          <p className="text-stone-400 dark:text-stone-500 text-sm text-center py-4">{t('member.empty')}</p>
        )}
      </div>

      {/* Enlace para compartir */}
      <div className="card p-5">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-3 text-stone-800 dark:text-white">
          <LinkIcon className="w-5 h-5" />
          {t('member.share.title')}
        </h3>
        <p className="text-sm text-stone-600 dark:text-stone-400 mb-3">{t('member.share.desc')}</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={getShareLink()}
            readOnly
            className="flex-1 px-3 py-2 text-sm border border-stone-300 dark:border-stone-600 rounded-lg bg-stone-50 dark:bg-stone-700 text-stone-800 dark:text-white"
          />
          <button
            onClick={copyShareLink}
            className="px-4 py-2 bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-200 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-600 text-sm transition-all duration-150"
          >
            {t('common.copy')}
          </button>
        </div>
      </div>

      {showInvite && (
        <Modal title={t('member.invite.to', { title: tripTitle })} onClose={() => setShowInvite(false)}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-stone-800 dark:text-white">
              {t('member.invite.to', { title: tripTitle })}
            </h3>
            <button
              onClick={() => setShowInvite(false)}
              className="p-1 text-stone-400 hover:text-stone-600 transition-all duration-150"
              aria-label={t('common.close')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">{t('member.invite.desc')}</p>

          <div className="space-y-4">
            <div>
              <label className="form-label">
                {t('member.invite.email')} <span className="form-required">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('member.invite.email.placeholder')}
                className="input rounded-lg"
              />
            </div>

            <div>
              <label className="form-label">{t('member.invite.role')}</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="viewer"
                    checked={role === 'viewer'}
                    onChange={() => setRole('viewer')}
                    className="text-emerald-600"
                  />
                  <Eye className="w-4 h-4 text-stone-500 dark:text-stone-400" />
                  <span className="text-sm text-stone-700 dark:text-stone-300">{t('member.role.viewer')}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="editor"
                    checked={role === 'editor'}
                    onChange={() => setRole('editor')}
                    className="text-emerald-600"
                  />
                  <Edit className="w-4 h-4 text-stone-500 dark:text-stone-400" />
                  <span className="text-sm text-stone-700 dark:text-stone-300">{t('member.role.editor')}</span>
                </label>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                {role === 'viewer' ? t('member.role.viewer.desc') : t('member.role.editor.desc')}
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setShowInvite(false)}
              className="flex-1 px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-lg font-medium hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-all duration-150"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleInvite}
              disabled={loading || !email.trim()}
              className="btn-primary flex-1 px-4 py-2 rounded-lg"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {t('member.invite.send')}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
