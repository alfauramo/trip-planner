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
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL || '2000', 10);
const MODEL = process.env.OLLAMA_MODEL || 'qwen2.5-coder:7b';

if (!TELEGRAM_TOKEN) { log('ERROR: TELEGRAM_TOKEN no configurado'); process.exit(1); }

const GH_CLI = 'C:\\Program Files\\GitHub CLI\\gh.exe';
const conversations = {};

function httpReq(url, method, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const opts = {
      hostname: u.hostname, port: u.port || 443, path: u.pathname + u.search,
      method: method || 'GET', headers: {}
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
    req.setTimeout(20000, () => { req.destroy(); reject(new Error('Timeout')); });
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
    try { const r = await tg('sendMessage', { chat_id: chatId, text: chunk, parse_mode: 'Markdown' }); if (r?.result?.message_id) lastId = r.result.message_id; }
    catch { try { const r = await tg('sendMessage', { chat_id: chatId, text: chunk }); if (r?.result?.message_id) lastId = r.result.message_id; } catch {} }
    await new Promise(r => setTimeout(r, 200));
  }
  return lastId;
}

async function editMsg(chatId, msgId, text) {
  if (!chatId || !msgId || !text) return;
  try { await tg('editMessageText', { chat_id: chatId, message_id: msgId, text, parse_mode: 'Markdown' }); }
  catch { try { await tg('editMessageText', { chat_id: chatId, message_id: msgId, text }); } catch {} }
}

async function withStatus(chatId, label, fn) {
  const msgId = await sendMsg(chatId, label);
  const typing = setInterval(() => { tg('sendChatAction', { chat_id: chatId, action: 'typing' }).catch(() => {}); }, 4000);
  try {
    const result = await fn();
    clearInterval(typing);
    if (msgId) await tg('deleteMessage', { chat_id: chatId, message_id: msgId }).catch(() => {});
    return result;
  } catch (e) {
    clearInterval(typing);
    if (msgId) editMsg(chatId, msgId, '⚠️ Error: ' + e.message).catch(() => {});
    throw e;
  }
}

function execCmd(cmd, opts = {}) {
  try { const out = execSync(cmd, { encoding: 'utf-8', timeout: 60000, maxBuffer: 10 * 1024 * 1024, shell: 'cmd', ...opts }); return { success: true, output: out || '(sin output)' }; }
  catch (e) { return { success: false, error: e.message, output: e.stdout || '' }; }
}

const TOOLS = [
  { name: 'bash', desc: 'Ejecuta comandos shell (cmd.exe). Args: {"command":"comando","workdir":"dir"}' },
  { name: 'read_file', desc: 'Lee archivos. Args: {"path":"ruta","offset":1,"limit":100}' },
  { name: 'write_file', desc: 'Escribe archivos. Args: {"path":"ruta","content":"contenido"}' },
  { name: 'edit_file', desc: 'Edita archivos. Args: {"path":"ruta","old_string":"texto","new_string":"texto"}' },
  { name: 'glob', desc: 'Busca archivos. Args: {"pattern":"**/*.tsx","base":"dir"}' },
  { name: 'grep', desc: 'Busca texto en archivos. Args: {"pattern":"regex","base":"dir"}' },
  { name: 'read_directory', desc: 'Lista contenido de directorio. Args: {"path":"ruta"}' },
  { name: 'gh', desc: 'Ejecuta GitHub CLI. Args: {"args":["api","repos/..."]}' },
];

const SYS_PROMPT = `Eres un asistente de desarrollo que trabaja en el proyecto Trip Planner (React + Supabase + TypeScript + Tailwind).

Tienes acceso a estas herramientas:
${TOOLS.map(t => '- ' + t.name + ': ' + t.desc).join('\n')}

INSTRUCCIONES:
1. Si te piden HACER algo (ejecutar, leer, modificar, build, deploy, etc.), responde SOLO con JSON exacto: {"tool":"nombre","args":{...}}
2. Si te piden INFORMACIÓN, explicación, opinión, o conversación normal, responde en texto natural.
3. Si un comando falla, analiza el error y prueba un enfoque diferente. NO repitas el mismo comando.
4. Para GitHub Pages: usa gh con args ["api","repos/alfauramo/trip-planner/pages"]
5. Los comandos shell usan cmd.exe: usa && para encadenar, comillas dobles para strings.
6. Primero diagnostica (lee archivos, revisa config) antes de sugerir soluciones genéricas.
7. Si te piden conversar, solo habla normalmente sin usar herramientas.
8. IMPORTANTE: Si propusiste un plan en texto y el usuario responde "adelante", "hazlo", "sí", "genial", etc., EJECUTA el plan con herramientas. No repitas el plan otra vez.

Proyecto: ${PROJECT_DIR}
Modelo: ${MODEL}`;

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
        const r = execCmd(`dir /s /b "${(args.base || PROJECT_DIR)}\\${args.pattern}"`);
        return { success: r.success, output: r.output || '(sin resultados)' };
      }
      case 'grep': {
        const r = execCmd(`findstr /s /n /i "${args.pattern}" "${args.base || PROJECT_DIR}\\*"`);
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

function parseToolCall(content) {
  if (!content) return null;
  const trimmed = content.trim();
  try {
    const p = JSON.parse(trimmed);
    if (p.tool && TOOLS.some(t => t.name === p.tool)) return { name: p.tool, args: p.args || {} };
  } catch {}
  const m = trimmed.match(/\{(?:[^{}]|(?:\{[^{}]*\}))*\}/);
  if (m) {
    try { const p = JSON.parse(m[0]); if (p.tool && TOOLS.some(t => t.name === p.tool)) return { name: p.tool, args: p.args || {} }; } catch {}
  }
  return null;
}

function ollamaChat(messages) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ model: MODEL, messages, stream: false, options: { temperature: 0.2, num_predict: 16384 } });
    const u = new URL('http://localhost:11434/api/chat');
    const opts = {
      hostname: u.hostname, port: u.port, path: u.pathname, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    };
    const req = require('http').request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(new Error('Parse error: ' + d.substring(0,200))); } });
    });
    req.on('error', reject);
    req.setTimeout(180000, () => { req.destroy(); reject(new Error('Ollama timeout')); });
    req.write(body); req.end();
  });
}

async function processMessage(chatId, text) {
  if (!conversations[chatId]) conversations[chatId] = [{ role: 'system', content: SYS_PROMPT }];

  // Detect user approval of a previous bot plan → force execution
  const approvalWords = ['adelante', 'hazlo', 'haz', 'ejecuta', 'sí', 'sí,', 'si', 'genial', 'ok', 'okay', 'de acuerdo', 'dale', 'vamos', 'perfecto', 'me parece genial', 'me parece bien'];
  const isApproval = approvalWords.some(w => text.toLowerCase().startsWith(w) || text.toLowerCase() === w);
  const lastBotMsg = [...conversations[chatId]].reverse().find(m => m.role === 'assistant');
  if (isApproval && lastBotMsg && !parseToolCall(lastBotMsg.content)) {
    log('Aprobación detectada, forzando ejecución');
    conversations[chatId].push({
      role: 'system',
      content: 'El usuario acaba de aprobar tu plan anterior. EJECÚTALO AHORA usando herramientas. No repitas el plan. Responde SOLO con JSON tool call.'
    });
  }

  conversations[chatId].push({ role: 'user', content: text });
  if (conversations[chatId].length > 32) conversations[chatId] = [conversations[chatId][0], ...conversations[chatId].slice(-30)];

  let turn = 0;
  const MAX_TURNS = 10;
  let consecutiveFails = 0;
  const attempted = [];
  let lastAssistantText = '';

  while (turn < MAX_TURNS) {
    turn++;
    try { await tg('sendChatAction', { chat_id: chatId, action: 'typing' }); } catch {}

    let response;
    try { response = await withStatus(chatId, '🤔 Pensando...', () => ollamaChat(conversations[chatId])); }
    catch (e) {
      log('Error Ollama: ' + e.message);
      if (!conversations[chatId]?.some(m => m.content?.includes('Error: ' + e.message))) {
        await sendMsg(chatId, '⚠️ Error: ' + e.message);
      }
      return;
    }

    const content = response.message?.content || '';
    if (!content) { await sendMsg(chatId, '⚠️ Respuesta vacía'); return; }

    // Detect repeated text response → break the loop
    if (lastAssistantText && content.length > 30 && content === lastAssistantText) {
      log('Respuesta repetida, forzando acción');
      conversations[chatId].push({
        role: 'system',
        content: 'TE ESTÁS REPITIENDO. El usuario quiere progreso, no el mismo texto. Si puedes ejecutar algo con herramientas, hazlo. Si no, di algo diferente o pide instrucciones específicas.'
      });
      continue;
    }

    const toolCall = parseToolCall(content);

    if (toolCall) {
      const key = toolCall.name + ':' + JSON.stringify(toolCall.args);
      if (attempted.includes(key)) {
        log('Tool repetido, abortando');
        await sendMsg(chatId, '⚠️ Ese comando ya se intentó. Dame otra instrucción.');
        return;
      }
      attempted.push(key);
      lastAssistantText = ''; // Reset repeat detection on tool call

      const label = toolCall.name === 'bash' ? '`' + (toolCall.args.command || '').substring(0, 60) + '`'
        : toolCall.name === 'gh' ? '`gh ' + (toolCall.args.args || []).join(' ').substring(0, 60) + '`'
        : (toolCall.args.path || toolCall.name);
      log(`Tool: ${toolCall.name} ${label}`);
      await sendMsg(chatId, `🔧 ${toolCall.name} ${label}`);

      const result = runTool(toolCall.name, toolCall.args);
      conversations[chatId].push({ role: 'assistant', content });
      conversations[chatId].push({ role: 'tool', content: JSON.stringify(result) });

      if (!result.success) {
        consecutiveFails++;
        log(`Falló (${consecutiveFails}/3): ${result.error}`);
        if (consecutiveFails >= 3) {
          await sendMsg(chatId, '⚠️ Fallaron 3 intentos: ' + (result.error || ''));
          await sendMsg(chatId, 'Revisa manualmente o dime qué hacer.');
          return;
        }
        await sendMsg(chatId, '⚠️ Error: ' + (result.error || result.output || 'fallo desconocido'));
        if (result.output) await sendMsg(chatId, '```\n' + result.output.substring(0, 1000) + '\n```');
        return;
      } else {
        consecutiveFails = 0;
      }
      continue;
    }

    // Text response
    lastAssistantText = content;
    conversations[chatId].push({ role: 'assistant', content });
    await sendMsg(chatId, content);
    break;
  }

  if (turn >= MAX_TURNS) await sendMsg(chatId, '⚠️ Demasiadas operaciones. Intenta con algo más directo.');
}

async function poll() {
  let offset = 0;
  log('🤖 Bot iniciado - modelo: ' + MODEL);
  log('Proyecto: ' + PROJECT_DIR);
  log('Usuario: ' + (ALLOWED_USER_ID || 'todos'));

  async function pollOnce() {
    try {
      const data = await tg('getUpdates', { offset, timeout: 1 });
      if (data.ok && data.result && data.result.length > 0) {
        for (const update of data.result) {
          offset = update.update_id + 1;
          if (!update.message) continue;
          const chatId = update.message.chat.id;
          const userId = update.message.from?.id?.toString();
          const text = update.message.text?.trim();
          log(`📩 ${(text || '(media)').substring(0, 100)} [${chatId}]`);
          if (ALLOWED_USER_ID && userId !== ALLOWED_USER_ID) { await sendMsg(chatId, '⛔ No tienes permiso.'); continue; }
          if (!text) continue;
          if (text === '/start') { conversations[chatId] = [{ role: 'system', content: SYS_PROMPT }]; await sendMsg(chatId, '👋 Hola! Soy el asistente de Trip Planner. Puedo ayudarte con el código, ejecutar comandos, diagnosticar problemas, o simplemente conversar. ¿En qué te ayudo?'); continue; }
          if (text === '/clear') { conversations[chatId] = [{ role: 'system', content: SYS_PROMPT }]; await sendMsg(chatId, '🧹 Conversación reiniciada.'); continue; }
          if (text === '/help') { await sendMsg(chatId, '/start - Iniciar\n/clear - Reiniciar conversación\n/help - Esta ayuda'); continue; }
          await processMessage(chatId, text);
        }
      }
    } catch (e) { log('Poll error: ' + e.message); }
    setTimeout(pollOnce, POLL_INTERVAL);
  }
  pollOnce();
}

process.on('SIGINT', () => { log('Bot detenido'); process.exit(0); });
process.on('SIGTERM', () => { log('Bot detenido'); process.exit(0); });
poll();
