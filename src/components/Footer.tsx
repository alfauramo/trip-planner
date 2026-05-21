import { Link } from 'react-router-dom';
import { Plane } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="bg-white/90 dark:bg-stone-950/90 backdrop-blur-xl border-t border-stone-100 dark:border-stone-800 mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-stone-500 dark:text-stone-400">
          <div className="flex items-center gap-2">
            <Plane className="w-4 h-4 text-brand-500" />
            <span className="font-medium">{t('app.name')}</span>
          </div>
          <span className="text-xs sm:text-sm text-stone-400 dark:text-stone-500">{t('footer.tagline')}</span>
          <Link to="/profile" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors font-medium">
            {t('nav.profile')}
          </Link>
        </div>
      </div>
    </footer>
  );
}
