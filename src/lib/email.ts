export async function sendInviteEmail(
  to: string,
  tripTitle: string,
  invitedBy: string,
  acceptUrl: string
): Promise<void> {
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-invite-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      email: to,
      tripTitle,
      invitedBy,
      acceptUrl,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al enviar email');
  }
}
