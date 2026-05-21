import { useState } from 'react';
import { Clock, User, Plus, Edit2, Trash2, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTripActivities, formatActivity } from '../hooks/useTripActivities';
import { formatRelativeTime } from '../lib/date-utils';

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
  const { t } = useTranslation();
  const { activities, loading } = useTripActivities(tripId);
  const [showAll, setShowAll] = useState(false);

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded w-1/3" />
        <div className="h-12 bg-stone-200 dark:bg-stone-700 rounded" />
        <div className="h-12 bg-stone-200 dark:bg-stone-700 rounded" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="empty-state py-8">
        <div className="empty-state-icon-bg">
          <Clock className="empty-state-icon" />
        </div>
        <p className="empty-state-title">{t('activity.empty')}</p>
      </div>
    );
  }

  const displayedActivities = showAll ? activities : activities.slice(0, 10);

  return (
    <div className="space-y-3">
      <h3 className="font-medium text-stone-800 dark:text-white flex items-center gap-2">
        <Clock className="w-4 h-4" />
        {t('activity.title')}
      </h3>

      <div className="space-y-2">
        {displayedActivities.map((activity, index) => {
          const Icon = activityIcons[activity.action] || Plus;
          const colorClass = activityColors[activity.action] || 'bg-stone-100 text-stone-600';
          const isLast = index === displayedActivities.length - 1;

          return (
            <div key={activity.id} className="flex items-start gap-3">
              <div className={`p-2 rounded-full ${colorClass} flex-shrink-0`}>
                <Icon className="w-3 h-3" />
              </div>
              <div className={`flex-1 min-w-0 ${isLast ? '' : 'border-b border-stone-100 dark:border-stone-700 pb-2'}`}>
                <p className="text-sm text-stone-700 dark:text-stone-300">{formatActivity(activity)}</p>
                <p className="text-xs text-stone-400 mt-0.5">{formatRelativeTime(activity.created_at)}</p>
              </div>
              {activity.profile?.avatar_url && (
                <img src={activity.profile.avatar_url} alt="" className="w-6 h-6 rounded-full flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {activities.length > 10 && (
        <button onClick={() => setShowAll(!showAll)} className="text-sm text-brand-600 hover:text-brand-700 mt-2">
          {showAll ? t('activity.showLess') : t('activity.showMore', { count: activities.length - 10 })}
        </button>
      )}
    </div>
  );
}
