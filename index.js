const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');
const fs = require('fs');

const TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = -5473275880;

if (!TOKEN) {
  console.error("BOT_TOKEN not provided!");
  process.exit(1);
}

const bot = new TelegramBot(TOKEN, { polling: true });
const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const DB_FILE = './stats.json';

function loadStats() {
  if (!fs.existsSync(DB_FILE)) return {};
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function saveStats(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

let stats = loadStats();

function getToday() {
  return new Date().toLocaleString("en-CA", {
    timeZone: "Europe/Moscow"
  }).slice(0, 10);
}

function getYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toLocaleString("en-CA", {
    timeZone: "Europe/Moscow"
  }).slice(0, 10);
}

function ensureDay(day) {
  if (!stats[day]) {
    stats[day] = {
      Telegram: 0,
      WhatsApp: 0,
      MAX: 0,
      direct: 0,
      yandex: 0,
      seo: 0
    };
  }
}

function sendReport(chatId, day, title) {
  ensureDay(day);
  const d = stats[day];

  const report =
`📊 ${title} (${day})

📩 Telegram: ${d.Telegram}
📞 WhatsApp: ${d.WhatsApp}
⚡ MAX: ${d.MAX}

📈 Источники:
- direct: ${d.direct}
- yandex: ${d.yandex}
- seo: ${d.seo}
`;

  bot.sendMessage(chatId, report);
}

bot.on('message', (msg) => {
  if (msg.chat.id !== CHAT_ID) return;

  const text = (msg.text || "").toLowerCase().trim().split('@')[0];
  const today = getToday();

  if (text === '/today' || text === 'сегодня') {
    sendReport(msg.chat.id, today, 'СТАТИСТИКА ЗА СЕГОДНЯ');
    return;
  }

  if (text === 'вчера') {
    sendReport(msg.chat.id, getYesterday(), 'СТАТИСТИКА ЗА ВЧЕРА');
    return;
  }
});

app.get('/', (req, res) => {
  res.send('Tracker is running');
});

app.post('/click', (req, res) => {
  console.log("CLICK RECEIVED:", req.body);

  const body = req.body || {};
  const today = getToday();

  ensureDay(today);

  const source = (body.source || '').toLowerCase();

  if (source === 'telegram') stats[today].Telegram++;
  else if (source === 'whatsapp') stats[today].WhatsApp++;
  else if (source === 'max') stats[today].MAX++;
  else if (source === 'yandex') stats[today].yandex++;
  else if (source === 'seo') stats[today].seo++;
  else stats[today].direct++;

  saveStats(stats);

  res.status(200).json({ ok: true });
});

setInterval(() => {
  const now = new Date();

  if (now.getUTCHours() === 18 && now.getUTCMinutes() === 0) {
    const today = getToday();
    sendReport(CHAT_ID, today, '📊 АВТООТЧЁТ (21:00 МСК)');
  }
}, 60 * 1000);

app.listen(process.env.PORT || 3000, () => {
    console.log("Bot started");
    console.log("Server running with CORS enabled");

    bot.sendMessage(
        CHAT_ID,
        "🟢 Bot online + CORS active"
    );
});
