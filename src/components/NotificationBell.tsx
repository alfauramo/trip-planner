import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, Check, MapPin } from 'lucide-react';
import { useNotifications, Notification } from '../hooks/useNotifications';
import { useAuth } from '../context/AuthContext';

export function NotificationBell() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(user?.id);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) return t('notifications.justNow');
    if (hours < 24) return `Hace ${hours}h`;
    if (days < 7) return `Hace ${days}d`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    setShowDropdown(false);
    if (notification.trip_id) {
      navigate(`/trips/${notification.trip_id}`);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-stone-600 hover:text-brand-600 transition-colors"
        aria-label={t('notifications.title')}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border z-50 overflow-hidden">
            <div className="px-4 py-3 border-b bg-stone-50 flex items-center justify-between">
              <h3 className="font-semibold text-stone-800">{t('notifications.title')}</h3>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  {t('notifications.markAllRead')}
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-stone-500">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{t('notifications.empty')}</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full px-4 py-3 text-left hover:bg-stone-50 transition-colors ${
                        !notification.read ? 'bg-brand-50/50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 p-1.5 rounded-full ${
                            notification.type === 'trip_invitation'
                              ? 'bg-blue-100 text-blue-600'
                              : 'bg-stone-100 text-stone-600'
                          }`}
                        >
                          {notification.type === 'trip_invitation' ? (
                            <MapPin className="w-4 h-4" />
                          ) : (
                            <Bell className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-stone-800">{notification.title}</p>
                          {notification.message && (
                            <p className="text-xs text-stone-500 mt-0.5 line-clamp-2">{notification.message}</p>
                          )}
                          <p className="text-xs text-stone-400 mt-1">{formatDate(notification.created_at)}</p>
                        </div>
                        {!notification.read && <div className="w-2 h-2 bg-brand-500 rounded-full mt-2" />}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="px-4 py-2 border-t bg-stone-50">
              <button
                onClick={() => {
                  setShowDropdown(false);
                  navigate('/invitations');
                }}
                className="text-sm text-brand-600 hover:text-brand-700 font-medium"
              >
                {t('notifications.viewAll')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
