import { useLocation, useNavigate } from 'react-router-dom';
import { Plane, Mail, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const navItems = [
    { path: '/', label: t('nav.trips'), icon: Plane },
    { path: '/invitations', label: t('nav.invitations'), icon: Mail },
    { path: '/profile', label: t('nav.profile'), icon: User },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-stone-950/90 backdrop-blur-xl border-t border-stone-100/50 dark:border-stone-800/50 pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 min-w-0 rounded-xl transition-all duration-200 ${
                active
                  ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400'
                  : 'text-stone-400 dark:text-stone-500'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium leading-none">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
