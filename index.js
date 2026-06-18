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

app.use(cors({ origin: '*' }));
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

📩 Клики в мессенджеры:
Telegram: ${d.Telegram}
WhatsApp: ${d.WhatsApp}
MAX: ${d.MAX}

📈 Источники:
direct: ${d.direct}
yandex: ${d.yandex}
seo: ${d.seo}
`;

  bot.sendMessage(chatId, report);
}

bot.on('message', (msg) => {
  if (msg.chat.id !== CHAT_ID) return;

  const text = (msg.text || "").toLowerCase().trim().split('@')[0];

  if (text === '/today' || text === 'сегодня') {
    sendReport(msg.chat.id, getToday(), 'СТАТИСТИКА ЗА СЕГОДНЯ');
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

  const event = (body.event || '').toLowerCase();
  const source = (body.source || 'direct').toLowerCase();
  const messenger = (body.messenger || '').toLowerCase();

  if (event === 'visit') {
    if (source === 'yandex') stats[today].yandex++;
    else if (source === 'seo') stats[today].seo++;
    else stats[today].direct++;
  }

  if (event === 'messenger_click') {
    if (messenger === 'telegram') stats[today].Telegram++;
    if (messenger === 'whatsapp') stats[today].WhatsApp++;
    if (messenger === 'max') stats[today].MAX++;
  }

  saveStats(stats);
  res.status(200).json({ ok: true });
});

setInterval(() => {
  const now = new Date();

  if (now.getUTCHours() === 18 && now.getUTCMinutes() === 0) {
    sendReport(CHAT_ID, getToday(), '📊 АВТООТЧЁТ 21:00 МСК');
  }
}, 60 * 1000);

app.listen(process.env.PORT || 3000, () => {
  console.log("Bot started");
  console.log("Server running with CORS enabled");
  bot.sendMessage(CHAT_ID, "🟢 Bot online + separated analytics active");
});
