# Trip Planner

Aplicación para organizar viajes con React + Supabase.

## Funcionalidades

- Registro e inicio de sesión de usuarios
- Recuperación de contraseña
- Crear/editar/eliminar viajes
- Itinerarios organizados por días
- Lugares dentro de cada día
- Compatible con móvil (PWA instalable)

## Requisitos

- Node.js 18+
- Cuenta de Supabase (gratuita en supabase.com)

## Configuración

### 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Ve a **SQL Editor** y ejecuta el contenido de `supabase/schema.sql`

### 2. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-publica
```

Encontrarás estos valores en:
- **Supabase Dashboard** → Project Settings → API

### 3. Habilitar autenticación por email

En Supabase:
1. Ve a **Authentication** → Providers → Email
2. Asegúrate de que "Allow new registrations" esté activado
3. Configura los URLs de redirección si es necesario:
   - Site URL: `http://localhost:5173`
   - Redirect URLs: `http://localhost:5173/*`

## Desarrollo

```bash
npm install
npm run dev
```

La aplicación estará disponible en http://localhost:5173

## Build para producción

```bash
npm run build
npm run preview
```

## PWA - Instalar en móvil

La app está configurada como PWA:
- En móvil: Abre el navegador → menú → "Añadir a pantalla de inicio"
- En desktop: Chrome preguntará si quieres instalar

## Estructura del proyecto

```
src/
├── components/     # Componentes reutilizables
├── context/       # Contextos de React (Auth)
├── hooks/         # Custom hooks (useTrips)
├── lib/           # Configuración (Supabase client)
├── pages/         # Páginas/rutas
└── types/         # Tipos TypeScript
```
