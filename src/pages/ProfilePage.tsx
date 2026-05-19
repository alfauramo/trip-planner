import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Save, User, MapPin, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/Toast';
import { Footer } from '../components/Footer';
import { useIsMobile } from '../hooks/useMediaQuery';
import { useTranslation } from 'react-i18next';
import { ImageWithFallback } from '../components/ImageWithFallback';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const isMobile = useIsMobile();
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
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
    setLoading(false);
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
      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(fileName);
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
      await refreshProfile();
      showToast(t('profile.photoUpdated'));
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error al subir la imagen', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const updates: Record<string, string | null> = {
        full_name: fullName || null,
        alias: alias || null,
        bio: bio || null,
        location: location || null,
        website: website || null,
      };
      const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
      showToast(t('profile.updated'));
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : t('profile.saveError'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const displayName = profile?.alias || profile?.full_name || user?.email?.split('@')[0] || t('profile.user');

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-900 flex flex-col">
        <header className="bg-white dark:bg-stone-800 border-b dark:border-stone-700">
          <div className="px-4 py-3 flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label={t('common.back')}
              className="p-1.5 -ml-1.5 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg"
            >
              <svg
                className="w-5 h-5 text-stone-600 dark:text-stone-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-semibold text-stone-900 dark:text-white">{t('profile.title')}</h1>
              <p className="text-xs text-stone-500 dark:text-stone-400">{user?.email}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-4 pb-20">
          <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  {profile?.avatar_url ? (
                    <ImageWithFallback
                      src={profile.avatar_url}
                      alt={displayName}
                      loading="lazy"
                      className="w-20 h-20 rounded-full object-cover border-4 border-stone-100 dark:border-stone-700"
                      fallback={null}
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-2xl font-semibold border-4 border-stone-100 dark:border-stone-700">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 p-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-full cursor-pointer transition-colors shadow-lg">
                    {uploadingAvatar ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera className="w-3.5 h-3.5 text-white" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={uploadingAvatar}
                    />
                  </label>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-stone-900 dark:text-white">{displayName}</h2>
                  {profile?.alias && profile.full_name && <p className="text-sm text-stone-500">@{profile.alias}</p>}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="form-label text-xs">{t('profile.fullName')}</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-stone-200 dark:border-stone-600 rounded-xl bg-white dark:bg-stone-700 text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder={t('profile.fullName.placeholder')}
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label text-xs">{t('profile.alias')}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">@</span>
                    <input
                      type="text"
                      value={alias}
                      onChange={(e) => setAlias(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      className="w-full pl-8 pr-4 py-3 border border-stone-200 dark:border-stone-600 rounded-xl bg-white dark:bg-stone-700 text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder={t('profile.alias.placeholder')}
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label text-xs">{t('profile.bio')}</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-stone-200 dark:border-stone-600 rounded-xl bg-white dark:bg-stone-700 text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                    placeholder={t('profile.bio.placeholder')}
                  />
                </div>
                <div>
                  <label className="form-label text-xs">{t('profile.location')}</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-stone-200 dark:border-stone-600 rounded-xl bg-white dark:bg-stone-700 text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder={t('profile.location.placeholder')}
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label text-xs">{t('profile.website')}</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-stone-200 dark:border-stone-600 rounded-xl bg-white dark:bg-stone-700 text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder={t('profile.website.placeholder')}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 py-4 bg-stone-50 dark:bg-stone-700/50 border-t dark:border-stone-700">
              <button type="button" onClick={handleSave} disabled={saving} className="btn-primary w-full">
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {t('profile.save')}
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900 flex flex-col">
      <header className="bg-white dark:bg-stone-800 shadow-sm">
        <div className="page-container py-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              aria-label={t('common.back')}
              className="p-2 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5 text-stone-600 dark:text-stone-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-semibold text-stone-900 dark:text-white">{t('profile.title')}</h1>
              <p className="text-sm text-stone-500 dark:text-stone-400">{user?.email}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="page-container flex-1 py-8">
        <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-8">
            <div className="flex items-center gap-6 mb-8">
              <div className="relative">
                {profile?.avatar_url ? (
                  <ImageWithFallback
                    src={profile.avatar_url}
                    alt={displayName}
                    loading="lazy"
                    className="w-24 h-24 rounded-full object-cover border-4 border-stone-100 dark:border-stone-700"
                    fallback={null}
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-3xl font-semibold border-4 border-stone-100 dark:border-stone-700">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <label className="absolute bottom-0 right-0 p-2 bg-emerald-600 hover:bg-emerald-700 rounded-full cursor-pointer transition-colors shadow-lg">
                  {uploadingAvatar ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4 text-white" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={uploadingAvatar}
                  />
                </label>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-stone-900 dark:text-white">{displayName}</h2>
                {profile?.alias && profile.full_name && (
                  <p className="text-stone-500 dark:text-stone-400">@{profile.alias}</p>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">{t('profile.fullName')}</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-stone-500" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-stone-200 dark:border-stone-600 rounded-xl bg-white dark:bg-stone-700 text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder={t('profile.fullName.placeholder')}
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label">{t('profile.alias')}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500">
                      @
                    </span>
                    <input
                      type="text"
                      value={alias}
                      onChange={(e) => setAlias(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      className="w-full pl-8 pr-4 py-2.5 border border-stone-200 dark:border-stone-600 rounded-xl bg-white dark:bg-stone-700 text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder={t('profile.alias.placeholder')}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="form-label">{t('profile.bio')}</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-stone-200 dark:border-stone-600 rounded-xl bg-white dark:bg-stone-700 text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                  placeholder={t('profile.bio.placeholder')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">{t('profile.location')}</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-stone-500" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-stone-200 dark:border-stone-600 rounded-xl bg-white dark:bg-stone-700 text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder={t('profile.location.placeholder')}
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label">{t('profile.website')}</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-stone-500" />
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-stone-200 dark:border-stone-600 rounded-xl bg-white dark:bg-stone-700 text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder={t('profile.website.placeholder')}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-8 py-4 bg-stone-50 dark:bg-stone-700/50 border-t dark:border-stone-700 flex justify-end">
            <button type="button" onClick={handleSave} disabled={saving} className="btn-primary px-6 py-2.5">
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {t('profile.save')}
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
