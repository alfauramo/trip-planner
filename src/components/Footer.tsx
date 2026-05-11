import { Link } from 'react-router-dom';
import { Plane } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 mt-auto">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <Plane className="w-4 h-4" />
            <span>Trip Planner</span>
          </div>
          
          <span>Hecho por Alf</span>
          
          <Link to="/profile" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
            Mi perfil
          </Link>
        </div>
      </div>
    </footer>
  );
}
