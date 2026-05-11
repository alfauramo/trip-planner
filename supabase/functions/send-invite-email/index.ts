import { Resend } from 'npm:resend';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, tripTitle, invitedBy, acceptUrl } = await req.json();

    await resend.emails.send({
      from: 'Trip Planner <onboarding@resend.dev>',
      to: email,
      subject: `Te han invitado a "${tripTitle}"`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #3b82f6;">¡Te han invitado a un viaje!</h1>
          <p>Hola,</p>
          <p><strong>${invitedBy}</strong> te ha invitado a unirte al viaje <strong>"${tripTitle}"</strong> en Trip Planner.</p>
          <p style="margin: 30px 0;">
            <a href="${acceptUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
              Unirme al viaje
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">
            Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:<br>
            <a href="${acceptUrl}">${acceptUrl}</a>
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">
            Este email fue enviado porque fuiste invitado a un viaje en Trip Planner.
          </p>
        </div>
      `,
    });

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
