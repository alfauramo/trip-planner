import { useState } from 'react';
import { Clock, User, Plus, Edit2, Trash2, Check } from 'lucide-react';
import { useTripActivities, formatActivity } from '../hooks/useTripActivities';

const activityIcons: Record<string, typeof Plus> = {
  created: Plus,
  updated: Edit2,
  deleted: Trash2,
  added: Plus,
  completed: Check,
  invited: User,
};

const activityColors: Record<string, string> = {
  created: 'bg-green-100 text-green-600',
  updated: 'bg-blue-100 text-blue-600',
  deleted: 'bg-red-100 text-red-600',
  added: 'bg-purple-100 text-purple-600',
  completed: 'bg-green-100 text-green-600',
  invited: 'bg-yellow-100 text-yellow-600',
};

interface ActivityTimelineProps {
  tripId: string;
}

export function ActivityTimeline({ tripId }: ActivityTimelineProps) {
  const { activities, loading } = useTripActivities(tripId);
  const [showAll, setShowAll] = useState(false);

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-6">
        <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500 text-sm">Aún no hay actividad</p>
      </div>
    );
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes}min`;
    if (hours < 24) return `Hace ${hours}h`;
    if (days < 7) return `Hace ${days}d`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  const displayedActivities = showAll ? activities : activities.slice(0, 10);

  return (
    <div className="space-y-3">
      <h3 className="font-medium text-gray-800 dark:text-white flex items-center gap-2">
        <Clock className="w-4 h-4" />
        Actividad reciente
      </h3>

      <div className="space-y-2">
        {displayedActivities.map((activity, index) => {
          const Icon = activityIcons[activity.action] || Plus;
          const colorClass = activityColors[activity.action] || 'bg-gray-100 text-gray-600';
          const isLast = index === displayedActivities.length - 1;

          return (
            <div key={activity.id} className="flex items-start gap-3">
              <div className={`p-2 rounded-full ${colorClass} flex-shrink-0`}>
                <Icon className="w-3 h-3" />
              </div>
              <div className={`flex-1 min-w-0 ${isLast ? '' : 'border-b border-gray-100 dark:border-gray-700 pb-2'}`}>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {formatActivity(activity)}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatTime(activity.created_at)}
                </p>
              </div>
              {activity.profile?.avatar_url && (
                <img
                  src={activity.profile.avatar_url}
                  alt=""
                  className="w-6 h-6 rounded-full flex-shrink-0"
                />
              )}
            </div>
          );
        })}
      </div>

      {activities.length > 10 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-sm text-blue-500 hover:text-blue-600 mt-2"
        >
          {showAll ? 'Ver menos' : `Ver ${activities.length - 10} más`}
        </button>
      )}
    </div>
  );
}
