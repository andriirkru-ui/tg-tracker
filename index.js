const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const cors = require('cors');
const fs = require('fs');

const TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = -5473275880;

const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

const bot = new TelegramBot(TOKEN); // ❗ NO POLLING

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

/**
 * 📡 WEBHOOK RECEIVER (Telegram updates)
 */
app.post('/telegram', (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

/**
 * 🤖 COMMANDS
 */
bot.on('message', (msg) => {
    if (msg.chat.id !== CHAT_ID) return;

    const text = (msg.text || "").toLowerCase();

    if (text === 'сегодня' || text === '/today') {
        const day = getToday();
        ensureDay(day);

        const d = stats[day];

        bot.sendMessage(msg.chat.id,
`📊 СТАТИСТИКА ЗА СЕГОДНЯ (${day})

Telegram: ${d.Telegram}
WhatsApp: ${d.WhatsApp}
MAX: ${d.MAX}

direct: ${d.direct}
yandex: ${d.yandex}
seo: ${d.seo}`);
    }
});

/**
 * 📥 CLICK TRACKER
 */
app.post('/click', (req, res) => {
    const body = req.body;
    const day = getToday();

    ensureDay(day);

    const event = (body.event || '').toLowerCase();

    if (event === 'messenger_click') {
        const m = (body.messenger || '').toLowerCase();

        if (m === 'telegram') stats[day].Telegram++;
        if (m === 'whatsapp') stats[day].WhatsApp++;
        if (m === 'max') stats[day].MAX++;
    }

    if (event === 'visit') {
        const source = (body.source || '').toLowerCase();

        if (source === 'yandex') stats[day].yandex++;
        else if (source === 'seo') stats[day].seo++;
        else stats[day].direct++;
    }

    saveStats(stats);

    console.log("CLICK RECEIVED:", body);

    res.json({ ok: true });
});

/**
 * 🚀 START
 */
app.listen(process.env.PORT || 3000, () => {
    console.log("Server running (WEBHOOK MODE)");

    bot.sendMessage(CHAT_ID, "🟢 Bot online + webhook mode active");
});
