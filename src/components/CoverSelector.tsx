import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, X } from 'lucide-react';
import { ImageWithFallback } from './ImageWithFallback';
import { Modal } from './Modal';
import { useToast } from './Toast';
import { compressImage } from '../lib/image-utils';

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
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [internalValue, setInternalValue] = useState(value || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInternalValue(value || '');
  }, [value]);

  const filteredCountries = countries.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const compressedUrl = await compressImage(file, 1600);
      onChange(compressedUrl);
      setCustomUrl('');
    } catch (err) {
      console.error('Error al comprimir imagen:', err);
      showToast(t('cover.uploadError'), 'error');
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
      <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">{t('cover.title')}</label>

      {internalValue ? (
        <div className="relative h-32 bg-stone-100 dark:bg-stone-700 rounded-lg overflow-hidden">
          <ImageWithFallback src={internalValue} alt="Cover" className="w-full h-full object-cover" fallback={null} />
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-150"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="h-32 bg-stone-100 dark:bg-stone-700 rounded-lg flex items-center justify-center text-stone-400 dark:text-stone-400 border-2 border-dashed border-stone-300 dark:border-stone-600">
          <span className="text-sm">{t('cover.noImage')}</span>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setShowCountryPicker(true)}
          className="flex-1 px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 transition-all duration-150"
        >
          {t('cover.country')}
        </button>
        <label className="flex-1 px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 transition-all duration-150 text-center cursor-pointer">
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          {loading ? '...' : t('cover.upload')}
        </label>
        <button
          type="button"
          onClick={() => document.getElementById('custom-url-input')?.focus()}
          className="px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 transition-all duration-150"
        >
          <Link className="w-4 h-4" />
        </button>
      </div>

      {(!internalValue || !isFlagUrl(internalValue)) && (
        <input
          id="custom-url-input"
          type="url"
          value={customUrl}
          onChange={(e) => handleCustomUrlChange(e.target.value)}
          placeholder={t('cover.urlPlaceholder')}
          className="w-full px-3 py-2 text-sm border border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white dark:bg-stone-700 text-stone-900 dark:text-white placeholder-gray-400 dark:placeholder-stone-400 transition-all duration-150"
        />
      )}

      {showCountryPicker && (
        <Modal
          title={t('cover.selectCountry')}
          onClose={() => {
            setShowCountryPicker(false);
            setSearchQuery('');
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-stone-800 dark:text-white">{t('cover.selectCountry')}</h3>
            <button
              type="button"
              onClick={() => {
                setShowCountryPicker(false);
                setSearchQuery('');
              }}
              className="p-1 text-stone-400 hover:text-stone-600 transition-all duration-150"
              aria-label={t('common.close')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('cover.searchCountry')}
            className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white dark:bg-stone-700 text-stone-900 dark:text-white placeholder-gray-400 dark:placeholder-stone-400 transition-all duration-150 mb-4"
            autoFocus
          />
          <div className="grid grid-cols-2 gap-1 max-h-64 overflow-y-auto">
            {filteredCountries.map((country) => (
              <button
                key={country.code}
                onClick={() => handleCountrySelect(country)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 text-left text-stone-700 dark:text-stone-300 transition-all duration-150"
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
        </Modal>
      )}
    </div>
  );
}
