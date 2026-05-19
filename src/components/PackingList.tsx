import { useState } from 'react';
import { Check, Trash2, Plus, Package, Shirt, Pill, Laptop, FileText, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePackingList, PackingItem } from '../hooks/usePackingList';
import { ProgressBar } from './ProgressBar';
import { useConfirm } from './ConfirmModal';

const categoryIcons: Record<string, typeof Package> = {
  ropa: Shirt,
  cuidado: Pill,
  tecnología: Laptop,
  documentos: FileText,
  general: Package,
  accesorios: Sparkles,
  otros: Package,
};

const categoryColors: Record<string, string> = {
  ropa: 'bg-pink-100 text-pink-600',
  cuidado: 'bg-red-100 text-red-600',
  tecnología: 'bg-blue-100 text-blue-600',
  documentos: 'bg-yellow-100 text-yellow-600',
  general: 'bg-stone-100 text-stone-600',
  accesorios: 'bg-purple-100 text-purple-600',
  otros: 'bg-green-100 text-green-600',
};

interface PackingListProps {
  tripId: string;
}

export function PackingList({ tripId }: PackingListProps) {
  const { t } = useTranslation();
  const { items, loading, addItem, togglePacked, deleteItem, addTemplateItems } = usePackingList(tripId);
  const { confirm } = useConfirm();
  const [newItem, setNewItem] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [showTemplates, setShowTemplates] = useState(false);

  const categories = ['general', 'ropa', 'cuidado', 'tecnología', 'documentos', 'accesorios', 'otros'];

  const handleAdd = async () => {
    if (!newItem.trim()) return;
    await addItem(newItem.trim(), selectedCategory);
    setNewItem('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  const groupedItems = items.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, PackingItem[]>,
  );

  const packedCount = items.filter((i) => i.packed).length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? (packedCount / totalCount) * 100 : 0;

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded w-1/3" />
        <div className="h-12 bg-stone-200 dark:bg-stone-700 rounded" />
        <div className="h-12 bg-stone-200 dark:bg-stone-700 rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="section-title flex items-center gap-2">
            <Package className="w-5 h-5" />
            {t('packing.title')}
          </h3>
          {totalCount > 0 && (
            <p className="text-sm text-stone-500 mt-1">
              {t('packing.progress', { packed: packedCount, total: totalCount })}
            </p>
          )}
        </div>
        <div className="relative">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-all duration-150"
          >
            <Sparkles className="w-4 h-4" />
            {t('packing.templates')}
          </button>
          {showTemplates && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-stone-800 rounded-lg shadow-lg z-10">
              <button
                onClick={() => {
                  addTemplateItems('beach');
                  setShowTemplates(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-stone-100 dark:hover:bg-stone-700 text-sm transition-all duration-150"
              >
                {t('packing.template.beach')}
              </button>
              <button
                onClick={() => {
                  addTemplateItems('city');
                  setShowTemplates(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-stone-100 dark:hover:bg-stone-700 text-sm transition-all duration-150"
              >
                {t('packing.template.city')}
              </button>
              <button
                onClick={() => {
                  addTemplateItems('mountain');
                  setShowTemplates(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-stone-100 dark:hover:bg-stone-700 text-sm transition-all duration-150"
              >
                {t('packing.template.mountain')}
              </button>
              <button
                onClick={() => {
                  addTemplateItems('winter');
                  setShowTemplates(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-stone-100 dark:hover:bg-stone-700 text-sm transition-all duration-150"
              >
                {t('packing.template.winter')}
              </button>
            </div>
          )}
        </div>
      </div>

      {totalCount > 0 && <ProgressBar value={progress} barClassName="bg-gradient-to-r from-emerald-500 to-teal-500" />}

      <div className="flex gap-2">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={t('packing.add')}
          className="flex-1 px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-stone-700 dark:text-white transition-all duration-150"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg dark:bg-stone-700 dark:text-white transition-all duration-150"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <button onClick={handleAdd} className="btn-primary px-4 py-2 rounded-lg" aria-label="Añadir artículo">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {totalCount === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon-bg">
            <Package className="empty-state-icon" />
          </div>
          <p className="empty-state-title">{t('packing.empty')}</p>
          <p className="empty-state-desc">{t('packing.empty.desc')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedItems).map(([category, categoryItems]) => {
            const CategoryIcon = categoryIcons[category] || Package;
            return (
              <div key={category}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`p-1.5 rounded-lg ${categoryColors[category]}`}>
                    <CategoryIcon className="w-4 h-4" />
                  </span>
                  <span className="font-medium text-stone-700 dark:text-stone-300 capitalize">{category}</span>
                  <span className="text-xs text-stone-400">
                    ({categoryItems.filter((i) => i.packed).length}/{categoryItems.length})
                  </span>
                </div>
                <div className="space-y-1">
                  {categoryItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 bg-white dark:bg-stone-800 rounded-lg list-enter"
                    >
                      <button
                        onClick={() => togglePacked(item.id)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          item.packed
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-stone-300 hover:border-green-400'
                        }`}
                      >
                        {item.packed && <Check className="w-4 h-4" />}
                      </button>
                      <span
                        className={`flex-1 ${item.packed ? 'line-through text-stone-400' : 'text-stone-800 dark:text-white'}`}
                      >
                        {item.name}
                        {item.quantity > 1 && <span className="ml-2 text-sm text-stone-500">x{item.quantity}</span>}
                      </span>
                      <button
                        onClick={async () => {
                          if (await confirm(t('common.confirmDelete'))) deleteItem(item.id);
                        }}
                        className="p-1 text-stone-400 hover:text-red-500 transition-all duration-150"
                        aria-label="Eliminar artículo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
