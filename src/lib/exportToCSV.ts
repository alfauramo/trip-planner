import { TripEvent, TripMember, ExpenseCategory, EXPENSE_CATEGORIES } from '../types';
import { getMemberDisplayName } from '../components/EventHelpers';

export function exportToCSV(events: TripEvent[], members: TripMember[], days: { id: string; date: string }[]) {
  const memberMap = new Map(members.map((m) => [m.user_id, getMemberDisplayName(m)]));
  const dayMap = new Map(days.map((d) => [d.id, d.date]));
  const headers = ['Fecha', 'Concepto', 'Categoría', 'Importe', 'Moneda', 'Pagado por', 'Participantes', 'Notas'];
  const rows = events.map((e) => [
    dayMap.get(e.day_id) || '',
    e.name,
    EXPENSE_CATEGORIES[e.expense_category as ExpenseCategory]?.label || 'Otros',
    e.cost_amount || 0,
    e.cost_currency || 'EUR',
    memberMap.get(e.payer_id) || 'N/A',
    (e.participants || []).map((p: string) => memberMap.get(p) || p).join(', '),
    e.notes || '',
  ]);
  const csvContent = [headers, ...rows]
    .map((row: (string | number)[]) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const csvBlob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(csvBlob);
  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  downloadLink.download = `gastos-viaje-${new Date().toISOString().split('T')[0]}.csv`;
  try {
    downloadLink.click();
  } catch {
    window.open(url, '_blank');
  } finally {
    URL.revokeObjectURL(url);
  }
}
