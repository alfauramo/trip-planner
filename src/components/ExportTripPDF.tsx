import { FileText } from 'lucide-react';
import { TripWithDetails } from '../types';

interface ExportPDFProps {
  trip: TripWithDetails;
}

export function ExportTripPDF({ trip }: ExportPDFProps) {
  const generatePDF = () => {
    const formatDate = (dateStr: string) => {
      return new Date(dateStr).toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    };

    const formatTime = (time?: string) => time || '-';

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${trip.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1f2937; line-height: 1.6; }
    h1 { font-size: 28px; color: #3b82f6; margin-bottom: 8px; }
    h2 { font-size: 18px; color: #374151; margin: 24px 0 12px 0; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; }
    .subtitle { color: #6b7280; margin-bottom: 24px; }
    .header { margin-bottom: 32px; }
    .meta { display: flex; gap: 24px; margin-top: 12px; color: #6b7280; font-size: 14px; }
    .day { margin-bottom: 24px; page-break-inside: avoid; }
    .day-header { background: #f3f4f6; padding: 12px 16px; border-radius: 8px; margin-bottom: 12px; }
    .day-title { font-weight: 600; font-size: 16px; }
    .day-date { color: #6b7280; font-size: 14px; }
    .event { padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
    .event:last-child { border-bottom: none; }
    .event-header { display: flex; justify-content: space-between; align-items: center; }
    .event-name { font-weight: 500; }
    .event-time { color: #6b7280; font-size: 14px; }
    .event-type { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; background: #e0e7ff; color: #3730a3; }
    .event-address { color: #6b7280; font-size: 13px; margin-top: 4px; }
    .event-cost { font-weight: 500; color: #059669; }
    .notes { background: #fef3c7; padding: 8px 12px; border-radius: 6px; margin-top: 8px; font-size: 13px; }
    .budget { background: #ecfdf5; padding: 16px; border-radius: 8px; margin-top: 24px; }
    .budget-title { font-weight: 600; margin-bottom: 8px; }
    .total { font-size: 20px; color: #059669; font-weight: 600; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px; }
    @media print { body { padding: 20px; } .day { page-break-inside: avoid; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>✈️ ${trip.title}</h1>
    ${trip.description ? `<p class="subtitle">${trip.description}</p>` : ''}
    <div class="meta">
      ${trip.start_date ? `<span>📅 ${formatDate(trip.start_date)}</span>` : ''}
      ${trip.end_date ? `<span>→ ${formatDate(trip.end_date)}</span>` : ''}
      ${trip.total_budget ? `<span>💰 Presupuesto: €${trip.total_budget}</span>` : ''}
    </div>
  </div>

  ${trip.days
    .map(
      (day) => `
    <div class="day">
      <div class="day-header">
        <div class="day-title">Día ${day.day_number}</div>
        <div class="day-date">${formatDate(day.date)}</div>
      </div>
      ${day.notes ? `<div class="notes">📝 ${day.notes}</div>` : ''}
      ${day.events
        .map(
          (event) => `
        <div class="event">
          <div class="event-header">
            <span class="event-name">${event.name}</span>
            <span class="event-time">${formatTime(event.start_time)} - ${formatTime(event.end_time)}</span>
          </div>
          <div class="event-address">📍 ${event.address || 'Sin dirección'}</div>
          ${event.cost_amount ? `<div class="event-cost">💰 €${event.cost_amount} ${event.cost_paid ? '(Pagado)' : ''}</div>` : ''}
          ${event.notes ? `<div class="notes">📝 ${event.notes}</div>` : ''}
        </div>
      `,
        )
        .join('')}
    </div>
  `,
    )
    .join('')}
  
  ${
    trip.total_budget
      ? `
    <div class="budget">
      <div class="budget-title">💰 Resumen del presupuesto</div>
      <div class="total">€${trip.total_budget}</div>
    </div>
  `
      : ''
  }

  <div class="footer">
    Generado por Trip Planner • ${new Date().toLocaleDateString('es-ES')}
  </div>
</body>
</html>
    `;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${trip.title.replace(/\s+/g, '_')}_itinerario.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={generatePDF}
      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
    >
      <FileText className="w-4 h-4" />
      Exportar Itinerario
    </button>
  );
}
