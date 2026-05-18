import { useState } from 'react';

export function AddDayForm({
  startDate,
  lastDate,
  onSave,
}: {
  startDate?: string;
  lastDate?: string;
  onSave: (date: string, notes?: string) => void;
}) {
  const getDefaultDate = () => {
    if (lastDate) {
      const d = new Date(lastDate);
      d.setDate(d.getDate() + 1);
      return d.toISOString().split('T')[0];
    }
    if (startDate) return startDate;
    return new Date().toISOString().split('T')[0];
  };
  const [date, setDate] = useState(getDefaultDate());
  const [notes, setNotes] = useState('');

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha del día</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Descripción (opcional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="Notas sobre este día..."
        />
      </div>
      <button
        onClick={() => onSave(date, notes || undefined)}
        className="w-full bg-blue-500 text-white py-3 rounded-xl font-medium hover:bg-blue-600 active:bg-blue-700"
      >
        Añadir Día
      </button>
    </div>
  );
}

export function EditDayForm({
  day,
  onSave,
}: {
  day: { id: string; date: string; notes?: string };
  onSave: (updates: { date: string; notes?: string }) => void;
}) {
  const [date, setDate] = useState(day.date);
  const [notes, setNotes] = useState(day.notes || '');

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha del día</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Descripción (opcional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="Notas sobre este día..."
        />
      </div>
      <button
        onClick={() => onSave({ date, notes: notes || undefined })}
        className="w-full bg-blue-500 text-white py-3 rounded-xl font-medium hover:bg-blue-600"
      >
        Guardar
      </button>
    </div>
  );
}
