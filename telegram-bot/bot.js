#!/usr/bin/env node

const https = require('https');
const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const OPENCODE_PROJECT = process.env.OPENCODE_PROJECT || path.join(__dirname, '..');
const POLL_INTERVAL = 2000;

let offset = 0;
let processing = false;
const pendingMessages = [];

function get(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { resolve(data); }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Request timeout')); });
  });
}

function post(url, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    };
    const req = https.request(options, (res) => {
      let response = '';
      res.on('data', chunk => response += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(response)); }
        catch (e) { resolve(response); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function sendMessage(text, chatId = CHAT_ID) {
  if (!chatId) { console.log('No chat ID configured. Message:', text.substring(0, 100)); return; }
  
  const chunks = text.match(/[\s\S]{1,4096}/g) || [text];
  for (const chunk of chunks) {
    await get(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(chunk)}&parse_mode=Markdown`);
    await new Promise(r => setTimeout(r, 100));
  }
}

async function processMessage(chatId, messageId, text) {
  console.log(`\n📩 Message from ${chatId}: ${text.substring(0, 100)}...`);
  
  try {
    await sendMessage('🤖 Procesando tu solicitud...', chatId);

    const opencode = spawn('npx', ['-y', 'opencode@latest', '--no-input', '--non-interactive', text], {
      cwd: OPENCODE_PROJECT,
      env: { ...process.env, FORCE_COLOR: '0' },
      shell: true
    });

    let output = '';
    let errorOutput = '';

    opencode.stdout.on('data', (data) => { output += data.toString(); });
    opencode.stderr.on('data', (data) => { errorOutput += data.toString(); });

    opencode.on('error', (err) => {
      console.error('OpenCode error:', err);
      sendMessage(`❌ Error: ${err.message}`, chatId);
    });

    opencode.on('close', async (code) => {
      console.log(`OpenCode finished with code ${code}`);
      
      const fullOutput = output + (errorOutput ? '\n' + errorOutput : '');
      
      if (code === 0 && fullOutput.trim()) {
        const truncated = fullOutput.length > 4000 ? fullOutput.substring(0, 4000) + '\n\n... (respuesta truncada)' : fullOutput;
        await sendMessage(`✅ *Resultado:*\n\`\`\`\n${truncated}\n\`\`\``, chatId);
      } else if (fullOutput.trim()) {
        const truncated = fullOutput.length > 4000 ? fullOutput.substring(0, 4000) + '\n\n... (respuesta truncada)' : fullOutput;
        await sendMessage(`⚠️ *Output:*\n\`\`\`\n${truncated}\n\`\`\``, chatId);
      } else {
        await sendMessage('✅ Tarea completada (sin output visible)', chatId);
      }
      
      await get(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/answerCallbackQuery?callback_query_id=`);
    });
  } catch (err) {
    console.error('Error processing message:', err);
    await sendMessage(`❌ Error: ${err.message}`, chatId);
  }
}

async function poll() {
  if (processing) return;
  processing = true;
  
  try {
    const updates = await get(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getUpdates?offset=${offset}&timeout=5`);
    
    if (updates.ok && updates.result && updates.result.length > 0) {
      for (const update of updates.result) {
        offset = update.update_id + 1;
        
        if (update.message && update.message.text) {
          const text = update.message.text.trim();
          if (text) {
            await processMessage(update.message.chat.id, update.message.message_id, text);
          }
        }
        
        if (update.edited_message && update.edited_message.text) {
          const text = update.edited_message.text.trim();
          if (text) {
            await processMessage(update.edited_message.chat.id, update.edited_message.message_id, text);
          }
        }
      }
    }
  } catch (err) {
    console.error('Poll error:', err.message);
  } finally {
    processing = false;
  }
}

async function setup() {
  if (!CHAT_ID) {
    console.log('⚠️ CHAT_ID not set. Listening for any message...');
    console.log('Edit this file or set TELEGRAM_CHAT_ID env var to restrict to your chat.');
  }
  
  console.log('🤖 Telegram Bot started!');
  console.log(`📁 Project: ${OPENCODE_PROJECT}`);
  console.log(`💬 Chat ID: ${CHAT_ID || 'ALL (waiting for first message)'}`);
  console.log('\nWaiting for messages...\n');
  
  setInterval(poll, POLL_INTERVAL);
}

setup();