import { useState, useRef } from 'react';
import { Paperclip, X, Upload, FileText, Image, File, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Attachment } from '../types';
import { uploadAttachment, deleteAttachment } from '../lib/attachments';
import { useToast } from './Toast';
import { useConfirm } from './ConfirmModal';

interface FileUploaderProps {
  eventId: string;
  attachments: Attachment[];
  onAttachmentsChange: () => void;
}

export function FileUploader({ eventId, attachments, onAttachmentsChange }: FileUploaderProps) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
  const MAX_SIZE = 5 * 1024 * 1024;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError('');

    for (const file of Array.from(files)) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(t('file.upload.invalidType', { name: file.name }));
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      if (file.size > MAX_SIZE) {
        setError(t('file.upload.tooLarge', { name: file.name }));
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
    }

    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        await uploadAttachment(eventId, file);
      }
      showToast(t('file.upload.count', { count: files.length }));
      onAttachmentsChange();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : t('file.upload.error'), 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (attachment: Attachment) => {
    if (!(await confirm(t('file.delete.confirm')))) return;

    try {
      await deleteAttachment(attachment);
      showToast(t('file.deleted'));
      onAttachmentsChange();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error al eliminar', 'error');
    }
  };

  const getIcon = (type: Attachment['type']) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-500" />;
      case 'image':
        return <Image className="w-5 h-5 text-emerald-500" />;
      default:
        return <File className="w-5 h-5 text-stone-500 dark:text-stone-400" />;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
          <Paperclip className="w-4 h-4 inline mr-1" />
          {t('file.attachments')}
        </label>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
        >
          {uploading ? (
            <>
              <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              {t('common.uploading')}
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              {t('file.upload.add')}
            </>
          )}
        </button>
      </div>

      {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}

      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-2 p-2 bg-stone-50 dark:bg-stone-700 rounded-lg group"
            >
              {getIcon(attachment.type)}
              <div className="flex-1 min-w-0">
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-stone-700 dark:text-stone-200 hover:text-emerald-600 truncate block"
                >
                  {attachment.name}
                </a>
              </div>
              <a
                href={attachment.url}
                download={attachment.name}
                className="p-1 text-stone-400 hover:text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Download className="w-4 h-4" />
              </a>
              <button
                onClick={() => handleDelete(attachment)}
                className="p-1 text-stone-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                title={t('file.remove')}
                aria-label={t('file.remove')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {attachments.length === 0 && (
        <p className="text-sm text-stone-400 dark:text-stone-500 text-center py-2">{t('file.empty')}</p>
      )}
    </div>
  );
}
