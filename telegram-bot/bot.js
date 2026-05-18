const https = require('https');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'bot.log');
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(msg);
  try { fs.appendFileSync(LOG_FILE, line + '\n'); } catch {}
}

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    const k = t.substring(0, i).trim();
    const v = t.substring(i + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const ALLOWED_USER_ID = process.env.TELEGRAM_ALLOWED_USER_ID || process.env.TELEGRAM_CHAT_ID;
const PROJECT_DIR = process.env.PROJECT_DIR || path.join(__dirname, '..');
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL || '1000', 10);
const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY;
const MODEL = process.env.MODEL || 'llama3.1-8b';
const API_TIMEOUT = parseInt(process.env.API_TIMEOUT || '120000', 10);
const API_BASE_URL = process.env.API_BASE_URL || 'https://api.cerebras.ai/v1';

if (!TELEGRAM_TOKEN) { log('ERROR: TELEGRAM_TOKEN no configurado'); process.exit(1); }
if (!CEREBRAS_API_KEY) { log('ERROR: CEREBRAS_API_KEY no configurada'); process.exit(1); }

const GH_CLI = 'C:\\Program Files\\GitHub CLI\\gh.exe';
const conversations = {};
const OFFSET_FILE = path.join(__dirname, '.offset');

function loadOffset() {
  try { return parseInt(fs.readFileSync(OFFSET_FILE, 'utf-8'), 10) || 0; } catch { return 0; }
}
function saveOffset(val) {
  try { fs.writeFileSync(OFFSET_FILE, val.toString(), 'utf-8'); } catch {}
}

const TOOLS = [
  { name: 'bash', desc: 'Ejecuta comandos shell (cmd.exe). Args: command (string, required), workdir (string, opcional)' },
  { name: 'read_file', desc: 'Lee archivos. Args: path (string, required), offset (number, opcional), limit (number, opcional)' },
  { name: 'write_file', desc: 'Escribe archivos. Args: path (string, required), content (string, required)' },
  { name: 'edit_file', desc: 'Edita archivos find&replace. Args: path (string, required), old_string (string, required), new_string (string, required)' },
  { name: 'glob', desc: 'Busca archivos por patrón. Args: pattern (string, required), base (string, opcional)' },
  { name: 'grep', desc: 'Busca texto en archivos. Args: pattern (string, required), base (string, opcional)' },
  { name: 'read_directory', desc: 'Lista contenido de directorio. Args: path (string, required)' },
  { name: 'gh', desc: 'Ejecuta GitHub CLI. Args: args (array of strings, opcional)' },
];

const SYS_PROMPT = `Eres un asistente de desarrollo que trabaja en el proyecto Trip Planner (React + Supabase + TypeScript + Tailwind).

Tienes acceso a estas herramientas para ejecutar comandos y modificar archivos:
${TOOLS.map(t => '- ' + t.name + ': ' + t.desc).join('\n')}

INSTRUCCIONES IMPORTANTES:
1. Si te piden HACER algo (ejecutar, leer, modificar, build, deploy, etc.), USA LAS HERRAMIENTAS. No describas lo que harías, hazlo.
2. Si te piden INFORMACIÓN, explicación, o conversación normal, responde directamente en texto.
3. Si un comando falla, analiza el error y prueba un enfoque diferente.
4. Para GitHub Pages: usa gh con args ["api","repos/alfauramo/trip-planner/pages"]
5. Los comandos shell usan POWERSHELL (no cmd.exe). Usa ; para encadenar comandos.
6. Primero diagnostica (lee archivos, revisa config) antes de sugerir soluciones.
7. Responde en el MISMO IDIOMA que el usuario.
8. Sé CONCISO en tus respuestas de texto.

Proyecto: ${PROJECT_DIR}`;

const TOOL_SCHEMAS = [
  {
    type: 'function',
    function: {
      name: 'bash',
      description: 'Ejecuta comandos shell (cmd.exe). Usa && para encadenar, comillas dobles para strings.',
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'Comando a ejecutar' },
          workdir: { type: 'string', description: 'Directorio de trabajo (opcional)' }
        },
        required: ['command']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Lee el contenido de un archivo.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Ruta absoluta al archivo' },
          offset: { type: 'number', description: 'Línea inicial (1-indexed, opcional)' },
          limit: { type: 'number', description: 'Número máximo de líneas (opcional)' }
        },
        required: ['path']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'write_file',
      description: 'Escribe o crea un archivo con el contenido especificado.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Ruta absoluta del archivo' },
          content: { type: 'string', description: 'Contenido a escribir' }
        },
        required: ['path', 'content']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'edit_file',
      description: 'Busca y reemplaza texto en un archivo existente.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Ruta absoluta del archivo' },
          old_string: { type: 'string', description: 'Texto exacto a buscar' },
          new_string: { type: 'string', description: 'Texto de reemplazo' }
        },
        required: ['path', 'old_string', 'new_string']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'glob',
      description: 'Busca archivos por patrón glob (ej: **/*.tsx).',
      parameters: {
        type: 'object',
        properties: {
          pattern: { type: 'string', description: 'Patrón glob (ej: **/*.ts, *.json)' },
          base: { type: 'string', description: 'Directorio base (opcional, por defecto el proyecto)' }
        },
        required: ['pattern']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'grep',
      description: 'Busca texto o regex en archivos del proyecto.',
      parameters: {
        type: 'object',
        properties: {
          pattern: { type: 'string', description: 'Patrón regex o texto a buscar' },
          base: { type: 'string', description: 'Directorio base (opcional)' }
        },
        required: ['pattern']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'read_directory',
      description: 'Lista el contenido de un directorio.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Ruta absoluta del directorio' }
        },
        required: ['path']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'gh',
      description: 'Ejecuta comandos de GitHub CLI. Ejemplo: args: ["api", "repos/alfauramo/trip-planner"]',
      parameters: {
        type: 'object',
        properties: {
          args: {
            type: 'array',
            items: { type: 'string' },
            description: 'Argumentos para gh (ej: ["api", "repos/...", "--jq", ".message"])'
          }
        }
      }
    }
  }
];

function execCmd(cmd, opts = {}) {
  try {
    const out = execSync(cmd, { encoding: 'utf-8', timeout: 60000, maxBuffer: 10 * 1024 * 1024, shell: 'powershell.exe', ...opts });
    return { success: true, output: out || '(sin output)' };
  } catch (e) {
    return { success: false, error: e.message, output: e.stdout || '' };
  }
}

function runTool(name, args) {
  try {
    switch (name) {
      case 'bash': return execCmd(args.command, { cwd: args.workdir || PROJECT_DIR });
      case 'read_file': {
        if (!fs.existsSync(args.path)) return { success: false, error: 'No encontrado: ' + args.path };
        const lines = fs.readFileSync(args.path, 'utf-8').split('\n');
        const s = lines.slice((args.offset || 1) - 1, (args.offset || 1) - 1 + (args.limit || lines.length));
        return { success: true, output: s.join('\n'), total_lines: lines.length };
      }
      case 'write_file': {
        const dir = path.dirname(args.path);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(args.path, args.content, 'utf-8');
        return { success: true, output: 'Escrito: ' + path.basename(args.path) };
      }
      case 'edit_file': {
        const c = fs.readFileSync(args.path, 'utf-8');
        if (!c.includes(args.old_string)) return { success: false, error: 'Texto no encontrado en el archivo' };
        fs.writeFileSync(args.path, c.replace(args.old_string, args.new_string), 'utf-8');
        return { success: true, output: 'Editado correctamente' };
      }
      case 'glob': {
        const r = execCmd(`Get-ChildItem -Recurse -Path "${(args.base || PROJECT_DIR)}" -Filter "${args.pattern}" | Select-Object -ExpandProperty FullName`);
        return { success: r.success, output: r.output || '(sin resultados)' };
      }
      case 'grep': {
        const r = execCmd(`Get-ChildItem -Recurse -Path "${(args.base || PROJECT_DIR)}" -Include * | Select-String -Pattern "${args.pattern}" -SimpleMatch:$false | Select-Object -Property Path,LineNumber,Line`);
        return { success: true, output: r.output || '(sin coincidencias)' };
      }
      case 'read_directory': {
        const entries = fs.readdirSync(args.path, { withFileTypes: true });
        return { success: true, output: entries.map(e => (e.isDirectory() ? '[DIR] ' : '[FILE] ') + e.name).join('\n') };
      }
      case 'gh': {
        const r = execCmd(`"${GH_CLI}" ${(args.args || []).join(' ')}`);
        return { success: true, output: r.output || '(sin output)' };
      }
      default: return { success: false, error: 'Tool desconocido: ' + name };
    }
  } catch (e) { return { success: false, error: e.message }; }
}

function aiChat(messages) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: MODEL,
      messages,
      tools: TOOL_SCHEMAS,
      tool_choice: 'auto',
      temperature: 0.2,
      max_tokens: 4096,
      stream: false
    });
    const u = new URL(API_BASE_URL + '/chat/completions');
    const opts = {
      hostname: u.hostname, port: 443, path: u.pathname, method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + CEREBRAS_API_KEY,
        'Content-Length': Buffer.byteLength(body)
      }
    };
    const req = https.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(d);
          if (parsed.error) reject(new Error(parsed.error.message || JSON.stringify(parsed.error)));
          else resolve(parsed);
        } catch (e) {
          reject(new Error('Parse error: ' + d.substring(0, 300)));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(API_TIMEOUT, () => { req.destroy(); reject(new Error('API timeout (' + (API_TIMEOUT / 1000) + 's)')); });
    req.write(body); req.end();
  });
}

async function aiHealthCheck() {
  try {
    await aiChat([{ role: 'user', content: 'Responde solo "ok" sin más.' }]);
    log('✅ API disponible (' + API_BASE_URL + ')');
    return true;
  } catch (e) {
    log('❌ API no disponible: ' + e.message);
    return false;
  }
}

function httpReq(url, method, body, timeoutMs) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const httpMethod = method || 'GET';
    const opts = {
      hostname: u.hostname, port: u.port || 443, path: u.pathname + u.search,
      method: httpMethod, headers: {}
    };
    const data = body ? JSON.stringify(body) : null;
    if (data) opts.headers['Content-Length'] = Buffer.byteLength(data);
    const mod = u.protocol === 'https:' ? https : require('http');
    const req = mod.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(d); } });
    });
    req.on('error', reject);
    const t = timeoutMs || (httpMethod === 'GET' && u.pathname?.includes('getUpdates') ? 60000 : 20000);
    req.setTimeout(t, () => { req.destroy(); reject(new Error('Timeout ' + t + 'ms')); });
    if (data) req.write(data);
    req.end();
  });
}

function tg(method, params) {
  return httpReq(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/${method}?${new URLSearchParams(params)}`);
}

async function sendMsg(chatId, text) {
  if (!chatId || !text) return 0;
  let lastId = 0;
  for (const chunk of text.match(/[\s\S]{1,4000}/g) || [text]) {
    try {
      const r = await tg('sendMessage', { chat_id: chatId, text: chunk, parse_mode: 'Markdown' });
      if (r?.result?.message_id) lastId = r.result.message_id;
    } catch {
      try {
        const r = await tg('sendMessage', { chat_id: chatId, text: chunk });
        if (r?.result?.message_id) lastId = r.result.message_id;
      } catch {}
    }
    await new Promise(r => setTimeout(r, 200));
  }
  return lastId;
}

async function processMessage(chatId, text) {
  if (!conversations[chatId]) conversations[chatId] = [{ role: 'system', content: SYS_PROMPT }];

  conversations[chatId].push({ role: 'user', content: text });

  // Trim context: keep system + last 10
  if (conversations[chatId].length > 11) {
    conversations[chatId] = [conversations[chatId][0], ...conversations[chatId].slice(-10)];
  }

  let turn = 0;
  const MAX_TURNS = 10;
  let consecutiveFails = 0;
  const attempted = new Set();

  while (turn < MAX_TURNS) {
    turn++;
    try { await tg('sendChatAction', { chat_id: chatId, action: 'typing' }); } catch {}

    let response;
    try { response = await aiChat(conversations[chatId]); }
    catch (e) {
      log('Error API: ' + e.message);
      if (!conversations[chatId]?.some(m => m.content?.includes('Error: ' + e.message))) {
        await sendMsg(chatId, '⚠️ Error: ' + e.message);
      }
      return;
    }

    const choice = response.choices?.[0];
    if (!choice) { await sendMsg(chatId, '⚠️ Respuesta vacía de la API'); return; }
    const msg = choice.message;

    // If AI wants to call tools
    if (msg.tool_calls && msg.tool_calls.length > 0) {
      // Add assistant message with tool_calls to conversation
      conversations[chatId].push(msg);

      let allSuccess = true;
      for (const tc of msg.tool_calls) {
        if (tc.type !== 'function') continue;
        const fnName = tc.function.name;
        let fnArgs;
        try { fnArgs = JSON.parse(tc.function.arguments); } catch {
          fnArgs = {};
        }

        const key = fnName + ':' + JSON.stringify(fnArgs);
        if (attempted.has(key)) {
          log('Tool repetido: ' + key);
          await sendMsg(chatId, '⚠️ Ese comando ya se intentó. Dame otra instrucción.');
          return;
        }
        attempted.add(key);

        const label = fnName === 'bash' ? '`' + (fnArgs.command || '').substring(0, 60) + '`'
          : fnName === 'gh' ? '`gh ' + (fnArgs.args || []).join(' ').substring(0, 60) + '`'
          : (fnArgs.path || fnName);
        log('Tool: ' + fnName + ' ' + label);
        await sendMsg(chatId, '🔧 ' + fnName + ' ' + label);

        const result = runTool(fnName, fnArgs);

        // Truncate large results
        let resultStr = JSON.stringify(result);
        let truncatedResult = result;
        if (resultStr.length > 2000) {
          truncatedResult = {
            success: result.success,
            output: (result.output || '').substring(0, 1500) + '\n... [truncado]',
            error: result.error,
            truncated: true
          };
        }

        conversations[chatId].push({
          role: 'tool',
          tool_call_id: tc.id,
          content: JSON.stringify(truncatedResult)
        });

        if (!result.success) {
          consecutiveFails++;
          log('Falló (' + consecutiveFails + '/3): ' + (result.error || ''));
          if (consecutiveFails >= 3) {
            await sendMsg(chatId, '⚠️ Fallaron 3 intentos: ' + (result.error || ''));
            await sendMsg(chatId, 'Revisa manualmente o dime qué hacer.');
            return;
          }
          await sendMsg(chatId, '⚠️ Error: ' + (result.error || result.output || 'fallo desconocido'));
          if (result.output) await sendMsg(chatId, '```\n' + result.output.substring(0, 1000) + '\n```');
          allSuccess = false;
          return;
        } else {
          consecutiveFails = 0;
        }
      }

      if (allSuccess) continue;
      return;
    }

    // Text response
    if (msg.content) {
      conversations[chatId].push({ role: 'assistant', content: msg.content });
      await sendMsg(chatId, msg.content);
      return;
    }

    // Shouldn't happen
    await sendMsg(chatId, '⚠️ Respuesta inesperada de la API');
    return;
  }

  if (turn >= MAX_TURNS) await sendMsg(chatId, '⚠️ Demasiadas operaciones. Intenta con algo más directo.');
}

async function poll() {
  let offset = loadOffset();

  log('========================================');
  log('🤖 Bot iniciado (Cerebras)');
  log('   Modelo: ' + MODEL);
  log('   API: ' + API_BASE_URL);
  log('   Proyecto: ' + PROJECT_DIR);
  log('   Usuario: ' + (ALLOWED_USER_ID || 'todos'));
  log('   Timeout: ' + (API_TIMEOUT / 1000) + 's');
  log('   Offset: ' + offset);
  log('========================================');

  const healthy = await aiHealthCheck();
  if (!healthy) {
    log('❌ API no disponible. El bot no funcionará.');
    process.exit(1);
  }

  let pollActive = true;

  async function pollOnce() {
    if (!pollActive) return;
    try {
      const data = await tg('getUpdates', { offset, timeout: 30 });
      if (data.ok && data.result && data.result.length > 0) {
        for (const update of data.result) {
          offset = update.update_id + 1; saveOffset(offset);
          if (!update.message) continue;
          const chatId = update.message.chat.id;
          const userId = update.message.from?.id?.toString();
          const text = update.message.text?.trim();
          log('📩 ' + (text || '(media)').substring(0, 100) + ' [' + chatId + ']');
          if (ALLOWED_USER_ID && userId !== ALLOWED_USER_ID) { await sendMsg(chatId, '⛔ No tienes permiso.'); continue; }
          if (!text) continue;
          if (text === '/start') { conversations[chatId] = [{ role: 'system', content: SYS_PROMPT }]; await sendMsg(chatId, '👋 Hola! Soy el asistente de Trip Planner (Cerebras). Puedo ayudarte con el código, ejecutar comandos, diagnosticar problemas, o simplemente conversar. ¿En qué te ayudo?'); continue; }
          if (text === '/clear') { conversations[chatId] = [{ role: 'system', content: SYS_PROMPT }]; await sendMsg(chatId, '🧹 Conversación reiniciada.'); continue; }
          if (text === '/help') { await sendMsg(chatId, '/start - Iniciar\n/clear - Reiniciar conversación\n/help - Esta ayuda\n/model - Ver modelo actual'); continue; }
          if (text === '/model') { await sendMsg(chatId, '🤖 Modelo: ' + MODEL + '\nAPI: ' + API_BASE_URL + '\nTimeout: ' + (API_TIMEOUT / 1000) + 's'); continue; }
          await processMessage(chatId, text);
        }
      }
    } catch (e) { log('Poll error: ' + e.message); }
    setTimeout(pollOnce, POLL_INTERVAL);
  }

  process.on('SIGINT', () => { pollActive = false; log('🛑 Bot detenido'); process.exit(0); });
  process.on('SIGTERM', () => { pollActive = false; log('🛑 Bot detenido'); process.exit(0); });
  process.on('unhandledRejection', (err) => { log('Unhandled: ' + (err?.message || err)); });

  pollOnce();
}

poll();
