# Trip Planner Telegram Bot

Bot que conecta con OpenCode para gestionar el proyecto Trip Planner desde Telegram.

## Setup

1. **Crear bot en Telegram** (ya hecho con @trippy_alf_bot)

2. **Configurar variables de entorno:**
   ```bash
   cp .env.example .env
   # Editar y añadir:
   TELEGRAM_TOKEN=tu_token_del_bot
   TELEGRAM_CHAT_ID=tu_chat_id  # O déjalo vacío para aceptar cualquier chat
   ```

3. **Instalar y ejecutar:**
   ```bash
   cd telegram-bot
   npm install
   npm start
   ```

4. **Obtener tu CHAT_ID:**
   - Envía un mensaje al bot
   - Ejecuta: `curl "https://api.telegram.org/bot<TOKEN>/getUpdates" | grep chat`
   - Copia el `id` numérico en `.env`

## Uso

1. Abre Telegram y entra al bot `@trippy_alf_bot`
2. Envía comandos como:
   - "Arregla el botón de logout en el dashboard"
   - "Añade validación al formulario de registro"
   - "Explica cómo funciona el sistema de notificaciones"
3. El bot ejecutará OpenCode con tu solicitud y te devolverá el resultado

## Comandos

| Comando | Descripción |
|---------|-------------|
| `ping` | Verificar que el bot está activo |
| `help` | Mostrar ayuda |

## Arquitectura

```
Telegram → Bot → OpenCode → Resultado → Telegram
```

El bot forwardea tus mensajes a OpenCode (CLI) y devuelve la salida formateada.