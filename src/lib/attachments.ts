import { supabase } from '../lib/supabase';
import { Attachment } from '../types';

export async function uploadAttachment(
  eventId: string,
  file: File
): Promise<Attachment | null> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `${eventId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('trip-attachments')
    .upload(filePath, file);

  if (uploadError) {
    throw uploadError;
  }

  const { data: urlData } = supabase.storage
    .from('trip-attachments')
    .getPublicUrl(filePath);

  const type = file.type.includes('pdf') ? 'pdf' :
               file.type.includes('image') ? 'image' :
               file.type.includes('ticket') ? 'ticket' : 'other';

  const { data: attachmentData, error: attachmentError } = await supabase
    .from('attachments')
    .insert({
      event_id: eventId,
      name: file.name,
      url: urlData.publicUrl,
      type,
    })
    .select()
    .single();

  if (attachmentError) {
    await supabase.storage.from('trip-attachments').remove([filePath]);
    throw attachmentError;
  }

  return attachmentData;
}

export async function deleteAttachment(attachment: Attachment): Promise<void> {
  const path = attachment.url.split('/trip-attachments/')[1];
  
  await supabase.storage.from('trip-attachments').remove([path]);
  await supabase.from('attachments').delete().eq('id', attachment.id);
}

export async function getEventAttachments(eventId: string): Promise<Attachment[]> {
  const { data, error } = await supabase
    .from('attachments')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}
