import { useLocation, useNavigate } from 'react-router-dom';
import { Plane, Mail, User } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Viajes', icon: Plane },
  { path: '/invitations', label: 'Invitaciones', icon: Mail },
  { path: '/profile', label: 'Perfil', icon: User },
];

export function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-t dark:border-gray-700 pb-safe">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center gap-0.5 px-4 py-2 min-w-0 transition-colors ${
                active
                  ? 'text-blue-500'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
