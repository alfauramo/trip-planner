import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const rateLimit = new Map<string, { count: number; resetAt: number }>();
const MAX_REQUESTS = 10;
const WINDOW_MS = 60 * 60 * 1000;

Deno.serve(async (req: Request) => {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
  const now = Date.now();
  const entry = rateLimit.get(ip);

  if (entry && now < entry.resetAt && entry.count >= MAX_REQUESTS) {
    return new Response(JSON.stringify({ error: 'Demasiadas peticiones. Intenta de nuevo en una hora.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!entry || now >= entry.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    entry.count++;
  }

  const { destination, days, travelers, budget, interests } = await req.json();

  const prompt = `Crea un itinerario de viaje detallado para ${destination}.
- Duración: ${days} días
- Viajeros: ${travelers}
${budget ? `- Presupuesto: ${budget}` : ''}
${interests ? `- Intereses: ${interests}` : ''}

Responde SOLO con JSON válido sin markdown en este formato:
{
  "days": [
    {
      "day": 1,
      "title": "Título del día",
      "description": "Resumen del día",
      "activities": [
        { "time": "09:00", "description": "Actividad" }
      ]
    }
  ],
  "tips": ["tip 1", "tip 2"]
}`;

  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'OPENAI_API_KEY no configurada' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return new Response(JSON.stringify({ error: `OpenAI error: ${err}` }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content ?? '';
  const json = JSON.parse(raw.replace(/```json|```/g, '').trim());

  return new Response(JSON.stringify(json), {
    headers: { 'Content-Type': 'application/json' },
  });
});
