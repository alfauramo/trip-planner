import { useState, useRef, useEffect } from 'react';

interface Country {
  code: string;
  name: string;
}

const countries: Country[] = [
  { code: 'ES', name: 'España' },
  { code: 'FR', name: 'Francia' },
  { code: 'IT', name: 'Italia' },
  { code: 'DE', name: 'Alemania' },
  { code: 'GB', name: 'Reino Unido' },
  { code: 'PT', name: 'Portugal' },
  { code: 'NL', name: 'Países Bajos' },
  { code: 'BE', name: 'Bélgica' },
  { code: 'CH', name: 'Suiza' },
  { code: 'AT', name: 'Austria' },
  { code: 'GR', name: 'Grecia' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'MX', name: 'México' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colombia' },
  { code: 'BR', name: 'Brasil' },
  { code: 'JP', name: 'Japón' },
  { code: 'CN', name: 'China' },
  { code: 'KR', name: 'Corea del Sur' },
  { code: 'TH', name: 'Tailandia' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'IN', name: 'India' },
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'Nueva Zelanda' },
  { code: 'ZA', name: 'Sudáfica' },
  { code: 'EG', name: 'Egipto' },
  { code: 'MA', name: 'Marruecos' },
  { code: 'TR', name: 'Turquía' },
  { code: 'AE', name: 'Emiratos Árabes' },
  { code: 'SE', name: 'Suecia' },
  { code: 'NO', name: 'Noruega' },
  { code: 'DK', name: 'Dinamarca' },
  { code: 'FI', name: 'Finlandia' },
  { code: 'PL', name: 'Polonia' },
  { code: 'CZ', name: 'República Checa' },
  { code: 'HU', name: 'Hungría' },
  { code: 'HR', name: 'Croacia' },
  { code: 'IE', name: 'Irlanda' },
  { code: 'IS', name: 'Islandia' },
];

interface CoverSelectorProps {
  value?: string;
  onChange: (imageUrl: string) => void;
}

export function CoverSelector({ value, onChange }: CoverSelectorProps) {
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [internalValue, setInternalValue] = useState(value || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    setInternalValue(value || '');
  }, [value]);
  
  const filteredCountries = countries.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCountrySelect = (country: Country) => {
    const url = `https://flagcdn.com/w1280/${country.code.toLowerCase()}.png`;
    onChange(url);
    setShowCountryPicker(false);
    setSearchQuery('');
  };

  const handleCustomUrlChange = (url: string) => {
    setCustomUrl(url);
    if (url) {
      onChange(url);
    }
  };

  const compressImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxWidth = 1600;
          const maxHeight = 900;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const compressedDataUrl = canvas.toDataURL('image/png');
          resolve(compressedDataUrl);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const compressedUrl = await compressImage(file);
      onChange(compressedUrl);
      setCustomUrl('');
    } catch (err) {
      console.error('Error al comprimir imagen:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveImage = () => {
    onChange('');
    setCustomUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isFlagUrl = (url: string): boolean => {
    return url.includes('flagcdn.com');
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Imagen de portada
      </label>
      
      {internalValue ? (
        <div className="relative h-32 bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={internalValue}
            alt="Cover"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-300">
          <span className="text-sm">Sin imagen</span>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setShowCountryPicker(true)}
          className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
        >
          🏳️ País
        </button>
        <label className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 text-center cursor-pointer">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          {loading ? '...' : '📷 Subir'}
        </label>
        <button
          type="button"
          onClick={() => document.getElementById('custom-url-input')?.focus()}
          className="px-3 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
        >
          🔗
        </button>
      </div>

      {(!internalValue || !isFlagUrl(internalValue)) && (
        <input
          id="custom-url-input"
          type="url"
          value={customUrl}
          onChange={(e) => handleCustomUrlChange(e.target.value)}
          placeholder="O pega una URL de imagen..."
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      )}

      {showCountryPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={(e) => e.target === e.currentTarget && setShowCountryPicker(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-96 overflow-hidden flex flex-col">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold mb-2">Seleccionar país</h3>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar país..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <div className="grid grid-cols-2 gap-1">
                {filteredCountries.map((country) => (
                  <button
                    key={country.code}
                    onClick={() => handleCountrySelect(country)}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 text-left"
                  >
                    <img
                      src={`https://flagcdn.com/w40/${country.code.toLowerCase()}.png`}
                      alt={country.name}
                      className="w-6 h-4 rounded"
                    />
                    <span className="text-sm truncate">{country.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 border-t">
              <button
                type="button"
                onClick={() => {
                  setShowCountryPicker(false);
                  setSearchQuery('');
                }}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
