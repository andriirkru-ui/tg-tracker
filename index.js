const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const fs = require('fs');

const TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = -5473275880;

if (!TOKEN) {
    console.error("BOT_TOKEN not provided!");
    process.exit(1);
}

const bot = new TelegramBot(TOKEN, { polling: true });
const app = express();

app.use(express.json());

const DB_FILE = './stats.json';

// =====================
function loadStats() {
    if (!fs.existsSync(DB_FILE)) return {};
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function saveStats(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

let stats = loadStats();

// =====================
function getToday() {
    return new Date().toISOString().slice(0, 10);
}

function getYesterday() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
}

// =====================
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

// =====================
function parse(text, day) {
    if (!text) return;

    ensureDay(day);

    const t = text.toLowerCase().trim(); // 🔥 FIX 1

    // UTM
    if (t.includes('utm_source=telegram')) stats[day].Telegram++;
    if (t.includes('utm_source=whatsapp')) stats[day].WhatsApp++;
    if (t.includes('utm_source=max')) stats[day].MAX++;
    if (t.includes('utm_source=yandex')) stats[day].yandex++;
    if (t.includes('utm_source=seo')) stats[day].seo++;
    if (t.includes('utm_source=direct')) stats[day].direct++;

    // fallback
    if (!t.includes('utm_source=')) {
        if (t.includes('telegram')) stats[day].Telegram++;
        if (t.includes('whatsapp')) stats[day].WhatsApp++;
        if (t.includes('max')) stats[day].MAX++;
        if (t.includes('yandex')) stats[day].yandex++;
        if (t.includes('seo')) stats[day].seo++;
        if (t.includes('direct')) stats[day].direct++;
    }
}

// =====================
function sendReport(chatId, day, title) {
    ensureDay(day);

    const d = stats[day];

    const report =
`📊 ${title} (${day})

📨 Telegram: ${d.Telegram}
📞 WhatsApp: ${d.WhatsApp}
⚡ MAX: ${d.MAX}

📈 Источники:
- direct: ${d.direct}
- yandex: ${d.yandex}
- seo: ${d.seo}
`;

    bot.sendMessage(chatId, report);
}

// =====================
// FIXED COMMAND HANDLING 🔥
// =====================
bot.on('message', (msg) => {

    if (msg.chat.id !== CHAT_ID) return;

    const text = (msg.text || "")
        .toLowerCase()
        .trim()
        .split('@')[0]; // 🔥 FIX 2

    const today = getToday();

    // ✔ команда today
    if (text === '/today' || text === 'сегодня') {
        sendReport(msg.chat.id, today, 'СТАТИСТИКА ЗА СЕГОДНЯ');
        return;
    }

    // ✔ вчера
    if (text === 'вчера') {
        sendReport(msg.chat.id, getYesterday(), 'СТАТИСТИКА ЗА ВЧЕРА');
        return;
    }

    parse(text, today);
    saveStats(stats);
});

// =====================
app.post('/click', (req, res) => {
    const text = JSON.stringify(req.body || {});
    const today = getToday();

    parse(text, today);
    saveStats(stats);

    res.sendStatus(200);
});

// =====================
setInterval(() => {
    const now = new Date();

    if (now.getUTCHours() === 18 && now.getUTCMinutes() === 0) {
        const today = getToday();
        sendReport(CHAT_ID, today, '📊 АВТООТЧЁТ (21:00 МСК)');
    }
}, 60 * 1000);

// =====================
app.listen(process.env.PORT || 3000, () => {
    console.log("Bot started");
});
