import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CoverSelector } from './CoverSelector';
import { useToast } from './Toast';

export function EditCoverForm({
  trip,
  onSave,
}: {
  trip: { id: string; cover_image?: string };
  onSave: (coverImage: string) => void;
}) {
  const { t } = useTranslation();
  const [coverImage, setCoverImage] = useState(trip.cover_image || '');
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  return (
    <div className="space-y-4">
      <CoverSelector value={coverImage} onChange={(url) => setCoverImage(url)} />
      <button
        type="button"
        onClick={async () => {
          setSaving(true);
          try {
            await onSave(coverImage);
          } catch {
            showToast(t('errors.save'), 'error');
          } finally {
            setSaving(false);
          }
        }}
        disabled={saving}
        className="btn-primary w-full"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t('common.save')}
      </button>
    </div>
  );
}
