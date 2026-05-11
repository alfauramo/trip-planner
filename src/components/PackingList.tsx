import { useState } from 'react';
import { Check, Trash2, Plus, Package, Shirt, Pill, Laptop, FileText, Sparkles } from 'lucide-react';
import { usePackingList, PackingItem } from '../hooks/usePackingList';

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
  general: 'bg-gray-100 text-gray-600',
  accesorios: 'bg-purple-100 text-purple-600',
  otros: 'bg-green-100 text-green-600',
};

interface PackingListProps {
  tripId: string;
}

export function PackingList({ tripId }: PackingListProps) {
  const { items, loading, addItem, togglePacked, deleteItem, addTemplateItems } = usePackingList(tripId);
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

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, PackingItem[]>);

  const packedCount = items.filter(i => i.packed).length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? (packedCount / totalCount) * 100 : 0;

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
            <Package className="w-5 h-5" />
            Lista de equipaje
          </h3>
          {totalCount > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              {packedCount} de {totalCount} objetos empacados
            </p>
          )}
        </div>
        <div className="relative">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200"
          >
            <Sparkles className="w-4 h-4" />
            Templates
          </button>
          {showTemplates && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border z-10">
              <button
                onClick={() => { addTemplateItems('beach'); setShowTemplates(false); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
              >
                🏖️ Playa
              </button>
              <button
                onClick={() => { addTemplateItems('city'); setShowTemplates(false); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
              >
                🏙️ Ciudad
              </button>
              <button
                onClick={() => { addTemplateItems('mountain'); setShowTemplates(false); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
              >
                ⛰️ Montaña
              </button>
              <button
                onClick={() => { addTemplateItems('winter'); setShowTemplates(false); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
              >
                ❄️ Invierno
              </button>
            </div>
          )}
        </div>
      </div>

      {totalCount > 0 && (
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Añadir objeto..."
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {totalCount === 0 ? (
        <div className="text-center py-8">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Tu lista de equipaje está vacía</p>
          <p className="text-sm text-gray-400 mt-1">Añade objetos o usa un template</p>
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
                  <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">
                    {category}
                  </span>
                  <span className="text-xs text-gray-400">
                    ({categoryItems.filter(i => i.packed).length}/{categoryItems.length})
                  </span>
                </div>
                <div className="space-y-1">
                  {categoryItems.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg"
                    >
                      <button
                        onClick={() => togglePacked(item.id)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          item.packed
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 hover:border-green-400'
                        }`}
                      >
                        {item.packed && <Check className="w-4 h-4" />}
                      </button>
                      <span className={`flex-1 ${item.packed ? 'line-through text-gray-400' : 'text-gray-800 dark:text-white'}`}>
                        {item.name}
                        {item.quantity > 1 && <span className="ml-2 text-sm text-gray-500">x{item.quantity}</span>}
                      </span>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="p-1 text-gray-400 hover:text-red-500"
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
