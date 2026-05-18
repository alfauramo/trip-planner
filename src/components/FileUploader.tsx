import { useState, useRef } from 'react';
import { Paperclip, X, Upload, FileText, Image, File, Download } from 'lucide-react';
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
        setError(`Formato no permitido: ${file.name}. Solo imágenes (PNG, JPEG, WebP, GIF)`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      if (file.size > MAX_SIZE) {
        setError(`Archivo demasiado grande: ${file.name}. Máximo 5MB`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
    }

    setUploading(true);
    
    try {
      for (const file of Array.from(files)) {
        await uploadAttachment(eventId, file);
      }
      showToast(`${files.length} archivo(s) adjuntado(s)`);
      onAttachmentsChange();
    } catch (err: any) {
      showToast(err.message || 'Error al subir archivo', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (attachment: Attachment) => {
    if (!await confirm('¿Eliminar este archivo?')) return;
    
    try {
      await deleteAttachment(attachment);
      showToast('Archivo eliminado');
      onAttachmentsChange();
    } catch (err: any) {
      showToast(err.message || 'Error al eliminar', 'error');
    }
  };

  const getIcon = (type: Attachment['type']) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-500" />;
      case 'image':
        return <Image className="w-5 h-5 text-blue-500" />;
      default:
        return <File className="w-5 h-5 text-gray-500 dark:text-gray-400" />;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          <Paperclip className="w-4 h-4 inline mr-1" />
          Archivos adjuntos
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
          className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1"
        >
          {uploading ? (
            <>
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              Subiendo...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Añadir
            </>
          )}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      )}

      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg group"
            >
              {getIcon(attachment.type)}
              <div className="flex-1 min-w-0">
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-700 dark:text-gray-200 hover:text-blue-500 truncate block"
                >
                  {attachment.name}
                </a>
              </div>
              <a
                href={attachment.url}
                download={attachment.name}
                className="p-1 text-gray-400 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Download className="w-4 h-4" />
              </a>
              <button
                onClick={() => handleDelete(attachment)}
                className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Eliminar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {attachments.length === 0 && (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-2">
          No hay archivos adjuntos
        </p>
      )}
    </div>
  );
}
