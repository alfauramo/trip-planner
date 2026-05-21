import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Camera, Save, User, MapPin, Globe, LogOut, ArrowLeft, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/Toast';
import { Footer } from '../components/Footer';
import { AsyncButton } from '../components/AsyncButton';
import { useTranslation } from 'react-i18next';
import { ImageWithFallback } from '../components/ImageWithFallback';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile, signOut, updatePassword } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [fullName, setFullName] = useState('');
  const [alias, setAlias] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

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

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

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
      throw err;
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      showToast(t('auth.password.mismatch'), 'error');
      return;
    }
    if (newPassword.length < 8) {
      showToast(t('auth.password.requirements'), 'error');
      return;
    }
    setChangingPassword(true);
    try {
      await updatePassword(newPassword);
      showToast(t('auth.password.updated'));
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordChange(false);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : t('common.error'), 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  const displayName = profile?.alias || profile?.full_name || user?.email?.split('@')[0] || t('profile.user');

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col">
      <Helmet>
        <title>Mi Perfil | Trip Planner</title>
      </Helmet>
      <header className="bg-white dark:bg-stone-800 border-b dark:border-stone-700 sm:border-b-0 sm:shadow-sm">
        <div className="px-4 py-3 sm:page-container sm:py-4 flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label={t('common.back')}
            className="p-1.5 -ml-1.5 sm:p-2 sm:ml-0 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-stone-600 dark:text-stone-300" />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-stone-900 dark:text-white">{t('profile.title')}</h1>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">{user?.email}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 pb-20 sm:max-w-2xl sm:mx-auto sm:py-8 sm:pb-0 sm:w-full">
        <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 sm:p-8">
            <div className="flex items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div className="relative">
                {profile?.avatar_url ? (
                  <ImageWithFallback
                    src={profile.avatar_url}
                    alt={displayName}
                    loading="lazy"
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-stone-100 dark:border-stone-700"
                    fallback={null}
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white text-2xl sm:text-3xl font-semibold border-4 border-stone-100 dark:border-stone-700">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <label className="absolute bottom-0 right-0 p-1.5 sm:p-2 bg-brand-600 hover:bg-brand-700 rounded-full cursor-pointer transition-colors shadow-lg">
                  {uploadingAvatar ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
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
                <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-white">{displayName}</h2>
                {profile?.alias && profile.full_name && (
                  <p className="text-sm text-stone-500 dark:text-stone-400">@{profile.alias}</p>
                )}
              </div>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label text-xs sm:text-sm">{t('profile.fullName')}</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-stone-500" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 sm:py-2.5 border border-stone-200 dark:border-stone-600 rounded-xl bg-white dark:bg-stone-700 text-stone-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                      placeholder={t('profile.fullName.placeholder')}
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label text-xs sm:text-sm">{t('profile.alias')}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500">
                      @
                    </span>
                    <input
                      type="text"
                      value={alias}
                      onChange={(e) => setAlias(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      className="w-full pl-8 pr-4 py-3 sm:py-2.5 border border-stone-200 dark:border-stone-600 rounded-xl bg-white dark:bg-stone-700 text-stone-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                      placeholder={t('profile.alias.placeholder')}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="form-label text-xs sm:text-sm">{t('profile.bio')}</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 sm:py-2.5 border border-stone-200 dark:border-stone-600 rounded-xl bg-white dark:bg-stone-700 text-stone-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-none"
                  placeholder={t('profile.bio.placeholder')}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label text-xs sm:text-sm">{t('profile.location')}</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-stone-500" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 sm:py-2.5 border border-stone-200 dark:border-stone-600 rounded-xl bg-white dark:bg-stone-700 text-stone-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                      placeholder={t('profile.location.placeholder')}
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label text-xs sm:text-sm">{t('profile.website')}</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-stone-500" />
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 sm:py-2.5 border border-stone-200 dark:border-stone-600 rounded-xl bg-white dark:bg-stone-700 text-stone-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                      placeholder={t('profile.website.placeholder')}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {!showPasswordChange ? (
            <div className="px-5 sm:px-8 py-3 border-t dark:border-stone-700">
              <button
                type="button"
                onClick={() => setShowPasswordChange(true)}
                className="flex items-center gap-2 text-sm text-stone-500 hover:text-brand-600 transition-colors"
              >
                <Key className="w-4 h-4" />
                {t('auth.password.change')}
              </button>
            </div>
          ) : (
            <div className="px-5 sm:px-8 py-4 border-t dark:border-stone-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                  {t('auth.password.change')}
                </span>
                <button
                  type="button"
                  onClick={() => setShowPasswordChange(false)}
                  className="text-xs text-stone-400 hover:text-stone-600"
                >
                  {t('common.cancel')}
                </button>
              </div>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('auth.password.new')}
                className="input"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('auth.password.confirm')}
                className="input"
              />
              <button
                type="button"
                onClick={handleChangePassword}
                disabled={changingPassword || !newPassword || !confirmPassword}
                className="btn-primary w-full text-sm py-2"
              >
                {changingPassword ? t('common.loading') : t('auth.password.update')}
              </button>
            </div>
          )}

          <div className="px-5 sm:px-8 py-4 bg-stone-50 dark:bg-stone-700/50 border-t dark:border-stone-700 flex flex-col sm:flex-row gap-3 justify-center sm:justify-end">
            <button type="button" onClick={handleLogout} className="btn-secondary w-full sm:w-auto">
              <LogOut className="w-4 h-4" />
              {t('auth.logout')}
            </button>
            <AsyncButton onClick={handleSave} className="btn-primary w-full sm:w-auto sm:px-6 sm:py-2.5">
              <Save className="w-4 h-4" />
              {t('profile.save')}
            </AsyncButton>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
