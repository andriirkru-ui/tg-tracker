const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');
const fs = require('fs');

const TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = -5473275880;

if (!TOKEN) {
  console.error('BOT_TOKEN not provided!');
  process.exit(1);
}

const bot = new TelegramBot(TOKEN);
const app = express();

/* =========================
   MIDDLEWARE
========================= */

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   STORAGE
========================= */

const DB_FILE = './stats.json';

function loadStats() {
  if (!fs.existsSync(DB_FILE)) {
    return {
      Telegram: 0,
      WhatsApp: 0,
      MAX: 0,
      sources: {
        direct: 0,
        yandex: 0,
        seo: 0
      }
    };
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function saveStats(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

let stats = loadStats();

/* =========================
   CLICK ENDPOINT (TILDA)
========================= */

app.post('/click', (req, res) => {
  console.log('🔥 CLICK RECEIVED:', req.body);

  const data = req.body || {};

  const source = data.source || 'direct';

  // источники
  if (!stats.sources) {
    stats.sources = { direct: 0, yandex: 0, seo: 0 };
  }

  if (stats.sources[source] !== undefined) {
    stats.sources[source]++;
  } else {
    stats.sources.direct++;
  }

  // мессенджеры
  if (source === 'telegram') stats.Telegram++;
  if (source === 'whatsapp') stats.WhatsApp++;
  if (source === 'max') stats.MAX++;

  saveStats(stats);

  res.json({ ok: true });
});

/* =========================
   TELEGRAM WEBHOOK
========================= */

app.post('/telegram', (req, res) => {
  console.log('🔥 TELEGRAM WEBHOOK HIT');
  console.log(JSON.stringify(req.body, null, 2));

  try {
    bot.processUpdate(req.body);
  } catch (err) {
    console.error('WEBHOOK ERROR:', err);
  }

  res.sendStatus(200);
});

/* =========================
   STATUS ROUTE
========================= */

app.get('/', (req, res) => {
  res.send('Server running (WEBHOOK MODE)');
});

/* =========================
   START SERVER
========================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('🚀 SERVER STARTED (WEBHOOK MODE)');
});
