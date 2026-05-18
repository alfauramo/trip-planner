import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n.use(initReactI18next).use(LanguageDetector).init({
  resources: {
    es: {
      translation: {
        'app.name': 'Trip Planner',
        'nav.trips': 'Viajes',
        'nav.invitations': 'Invitaciones',
        'nav.profile': 'Perfil',
        'common.save': 'Guardar',
        'common.cancel': 'Cancelar',
        'common.delete': 'Eliminar',
        'common.loading': 'Cargando...',
        'common.error': 'Error',
        'auth.login': 'Iniciar sesión',
        'auth.register': 'Registrarse',
        'auth.logout': 'Cerrar sesión',
        'auth.email': 'Correo electrónico',
        'auth.password': 'Contraseña',
        'trip.new': 'Nuevo Viaje',
        'trip.title': 'Título',
        'trip.description': 'Descripción',
      },
    },
    en: {
      translation: {
        'app.name': 'Trip Planner',
        'nav.trips': 'Trips',
        'nav.invitations': 'Invitations',
        'nav.profile': 'Profile',
        'common.save': 'Save',
        'common.cancel': 'Cancel',
        'common.delete': 'Delete',
        'common.loading': 'Loading...',
        'common.error': 'Error',
        'auth.login': 'Log in',
        'auth.register': 'Sign up',
        'auth.logout': 'Log out',
        'auth.email': 'Email',
        'auth.password': 'Password',
        'trip.new': 'New Trip',
        'trip.title': 'Title',
        'trip.description': 'Description',
      },
    },
  },
  fallbackLng: 'es',
  interpolation: { escapeValue: false },
  detection: { order: ['navigator', 'localStorage', 'htmlTag'], caches: ['localStorage'] },
});

export default i18n;
