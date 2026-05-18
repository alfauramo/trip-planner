import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Save, User, MapPin, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/Toast';
import { Footer } from '../components/Footer';
import { useIsMobile } from '../hooks/useMediaQuery';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [fullName, setFullName] = useState('');
  const [alias, setAlias] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setAlias(profile.alias || '');
      setBio(profile.bio || '');
      setLocation(profile.location || '');
      setWebsite(profile.website || '');
    }
  }, [profile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
      await refreshProfile();
      showToast('Foto de perfil actualizada');
    } catch (error: any) {
      showToast(error.message || 'Error al subir la imagen', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const updates: Record<string, any> = {
        full_name: fullName || null, alias: alias || null, bio: bio || null,
        location: location || null, website: website || null,
      };
      const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
      showToast('Perfil actualizado');
    } catch (error: any) {
      showToast(error.message || 'Error al guardar', 'error');
    } finally {
      setLoading(false);
    }
  };

  const displayName = profile?.alias || profile?.full_name || user?.email?.split('@')[0] || 'Usuario';

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
        <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
          <div className="px-4 py-3 flex items-center gap-3">
            <button type="button" onClick={() => navigate(-1)} aria-label="Volver" className="p-1.5 -ml-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Mi perfil</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-4 pb-20">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={displayName} loading="lazy" className="w-20 h-20 rounded-full object-cover border-4 border-gray-100 dark:border-gray-700" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-semibold border-4 border-gray-100 dark:border-gray-700">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 p-1.5 bg-blue-500 hover:bg-blue-600 rounded-full cursor-pointer transition-colors shadow-lg">
                    {uploadingAvatar ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera className="w-3.5 h-3.5 text-white" />
                    )}
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={uploadingAvatar} />
                  </label>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{displayName}</h2>
                  {profile?.alias && profile.full_name && (
                    <p className="text-sm text-gray-500">@{profile.alias}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre completo</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Tu nombre" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Alias <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                    <input type="text" value={alias} onChange={(e) => setAlias(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} className="w-full pl-8 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="tu_alias" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Bio <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none" placeholder="Cuéntanos algo sobre ti..." />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ubicación <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Madrid, España" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Web <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="www.tuweb.com" />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 py-4 bg-gray-50 dark:bg-gray-700/50 border-t dark:border-gray-700">
              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 active:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Guardar cambios
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => navigate('/')} aria-label="Volver" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Mi perfil</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-8">
            <div className="flex items-center gap-6 mb-8">
              <div className="relative">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={displayName} loading="lazy" className="w-24 h-24 rounded-full object-cover border-4 border-gray-100 dark:border-gray-700" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-semibold border-4 border-gray-100 dark:border-gray-700">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <label className="absolute bottom-0 right-0 p-2 bg-blue-500 hover:bg-blue-600 rounded-full cursor-pointer transition-colors shadow-lg">
                  {uploadingAvatar ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4 text-white" />
                  )}
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={uploadingAvatar} />
                </label>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{displayName}</h2>
                {profile?.alias && profile.full_name && (
                  <p className="text-gray-500 dark:text-gray-400">@{profile.alias}</p>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nombre completo</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Tu nombre" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Alias <span className="text-gray-400 dark:text-gray-500 font-normal">(opcional)</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">@</span>
                    <input type="text" value={alias} onChange={(e) => setAlias(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} className="w-full pl-8 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="tu_alias" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Bio <span className="text-gray-400 dark:text-gray-500 font-normal">(opcional)</span></label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none" placeholder="Cuéntanos algo sobre ti..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Ubicación <span className="text-gray-400 dark:text-gray-500 font-normal">(opcional)</span></label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Madrid, España" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Web <span className="text-gray-400 dark:text-gray-500 font-normal">(opcional)</span></label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="www.tuweb.com" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-8 py-4 bg-gray-50 dark:bg-gray-700/50 border-t dark:border-gray-700 flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 active:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Guardar cambios
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
