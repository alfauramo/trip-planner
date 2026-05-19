import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Plane, ArrowRight, LogOut } from 'lucide-react';
import { useTrips } from '../hooks/useTrips';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

interface Props {
  open: boolean;
  onClose: () => void;
}

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  group: 'navigation' | 'actions' | 'trips';
}

export function CommandPalette({ open, onClose }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { trips } = useTrips();
  const { signOut } = useAuth();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (open) onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const commands = useMemo(() => {
    const q = query.toLowerCase();

    const actions: Command[] = [
      {
        id: 'new-trip',
        label: t('trip.new'),
        description: t('command.newTripDesc'),
        icon: <Plus className="w-4 h-4" />,
        action: () => {
          onClose();
          navigate('/');
          setTimeout(
            () => document.querySelector<HTMLButtonElement>('[aria-label="' + t('trip.new') + '"]')?.click(),
            100,
          );
        },
        group: 'actions',
      },
      {
        id: 'profile',
        label: t('nav.profile'),
        description: t('command.profileDesc'),
        icon: <ArrowRight className="w-4 h-4" />,
        action: () => {
          onClose();
          navigate('/profile');
        },
        group: 'navigation',
      },
      {
        id: 'invitations',
        label: t('nav.invitations'),
        description: t('command.invitationsDesc'),
        icon: <ArrowRight className="w-4 h-4" />,
        action: () => {
          onClose();
          navigate('/invitations');
        },
        group: 'navigation',
      },
      {
        id: 'logout',
        label: t('auth.logout'),
        icon: <LogOut className="w-4 h-4" />,
        action: async () => {
          onClose();
          await signOut();
          navigate('/login');
        },
        group: 'actions',
      },
    ];

    const tripCommands: Command[] = trips
      .filter((trip) => !q || trip.title.toLowerCase().includes(q))
      .slice(0, 8)
      .map((trip) => ({
        id: `trip-${trip.id}`,
        label: trip.title,
        description: trip.description || t('command.noDescription'),
        icon: <Plane className="w-4 h-4" />,
        action: () => {
          onClose();
          navigate(`/trips/${trip.id}`);
        },
        group: 'trips' as const,
      }));

    const all = [...actions, ...tripCommands];
    if (!q) return all;
    return all.filter(
      (c) => c.label.toLowerCase().includes(q) || (c.description && c.description.toLowerCase().includes(q)),
    );
  }, [query, trips, t, navigate, onClose, signOut]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, commands.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && commands[selectedIndex]) {
        e.preventDefault();
        commands[selectedIndex].action();
      } else if (e.key === 'Escape') {
        onClose();
      }
    },
    [commands, selectedIndex, onClose],
  );

  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!open) return null;

  const grouped = commands.reduce(
    (acc, cmd) => {
      if (!acc[cmd.group]) acc[cmd.group] = [];
      acc[cmd.group].push(cmd);
      return acc;
    },
    {} as Record<string, Command[]>,
  );

  let globalIndex = 0;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4" onClick={onClose}>
      <div className="fixed inset-0 bg-black/40" />
      <div
        className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-stone-100 dark:border-stone-800">
          <Search className="w-5 h-5 text-stone-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('command.placeholder')}
            className="flex-1 bg-transparent border-none outline-none text-stone-800 dark:text-white placeholder-stone-400 text-sm"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="hidden sm:inline px-2 py-0.5 text-[10px] font-mono text-stone-400 bg-stone-100 dark:bg-stone-800 rounded">
            esc
          </kbd>
        </div>
        <div ref={listRef} className="max-h-80 overflow-y-auto py-2">
          {commands.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-stone-400">{t('command.noResults')}</div>
          )}
          {Object.entries(grouped).map(([group, cmds]) => (
            <div key={group}>
              <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                {group === 'trips'
                  ? t('command.trips')
                  : group === 'actions'
                    ? t('command.actions')
                    : t('command.navigation')}
              </div>
              {cmds.map((cmd) => {
                const idx = globalIndex++;
                const selected = idx === selectedIndex;
                return (
                  <button
                    key={cmd.id}
                    onClick={cmd.action}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      selected
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                        : 'text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    <span className={selected ? 'text-emerald-600' : 'text-stone-400'}>{cmd.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{cmd.label}</div>
                      {cmd.description && <div className="text-xs text-stone-400 truncate">{cmd.description}</div>}
                    </div>
                    {selected && <span className="text-[10px] text-stone-400">↵</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div className="px-4 py-2 border-t border-stone-100 dark:border-stone-800 flex items-center gap-4 text-[10px] text-stone-400">
          <span>↑↓ {t('command.navigate')}</span>
          <span>↵ {t('command.select')}</span>
          <span>Esc {t('command.close')}</span>
        </div>
      </div>
    </div>
  );
}
