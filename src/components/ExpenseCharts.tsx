import { useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TripEvent, TripMember } from '../types';

interface ExpenseChartsProps {
  events: TripEvent[];
  members: TripMember[];
}

const CATEGORY_COLORS: Record<string, string> = {
  food: '#f97316',
  transport: '#3b82f6',
  accommodation: '#a855f7',
  activities: '#22c55e',
  shopping: '#ec4899',
  other: '#6b7280',
};

const CATEGORY_LABELS: Record<string, string> = {
  food: 'Comida',
  transport: 'Transporte',
  accommodation: 'Alojamiento',
  activities: 'Actividades',
  shopping: 'Compras',
  other: 'Otros',
};

function getMemberName(memberId: string | undefined, members: TripMember[]): string {
  if (!memberId) return 'Desconocido';
  const member = members.find(m => m.id === memberId);
  if (!member) return memberId.slice(0, 8);
  if (member.profile?.full_name) return member.profile.full_name;
  if (member.profile?.alias) return member.profile.alias;
  return member.email.split('@')[0];
}

export function ExpenseCharts({ events, members }: ExpenseChartsProps) {
  const categoryData = useMemo(() => {
    const totals: Record<string, number> = {};
    events.forEach(event => {
      if (event.cost_amount && event.expense_category) {
        const cat = event.expense_category;
        totals[cat] = (totals[cat] || 0) + event.cost_amount;
      }
    });
    return Object.entries(totals)
      .map(([name, value]) => ({ name: CATEGORY_LABELS[name] || name, value, rawName: name }))
      .filter(d => d.value > 0);
  }, [events]);

  const memberData = useMemo(() => {
    const totals: Record<string, number> = {};
    events.forEach(event => {
      if (event.cost_amount && event.payer_id) {
        totals[event.payer_id] = (totals[event.payer_id] || 0) + event.cost_amount;
      }
    });
    return Object.entries(totals)
      .map(([id, value]) => ({ name: getMemberName(id, members), value }))
      .filter(d => d.value > 0);
  }, [events, members]);

  const hasCategoryData = categoryData.length > 0;
  const hasMemberData = memberData.length > 0;

  const totalSpent = useMemo(() => {
    return events.reduce((sum, e) => sum + (e.cost_amount || 0), 0);
  }, [events]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 text-sm">
          <p className="font-medium text-gray-800 dark:text-white">{payload[0].name}</p>
          <p className="text-gray-600 dark:text-gray-300">
            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (!hasCategoryData && !hasMemberData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <p className="text-gray-400 dark:text-gray-500 text-center text-sm">
          No hay gastos registrados
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {totalSpent > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium mb-1">
            Total gastado
          </p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">
            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(totalSpent)}
          </p>
        </div>
      )}

      {hasCategoryData && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-4">
            Gastos por categoría
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {categoryData.map((entry) => (
                  <Cell
                    key={entry.rawName}
                    fill={CATEGORY_COLORS[entry.rawName] || '#6b7280'}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value: string) => (
                  <span className="text-xs text-gray-700 dark:text-gray-300">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {hasMemberData && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-4">
            Gastos por miembro
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={memberData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={false}
                className="dark:fill-gray-400"
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={false}
                className="dark:fill-gray-400"
                tickFormatter={(v: number) => `${v}€`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
