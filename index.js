const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const cors = require('cors');
const fs = require('fs');

const TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = -5473275880;

const app = express();

app.use(cors({ origin: '*' }));

/**
 * ⚠️ ВАЖНО: RAW BODY (fix webhook drop)
 */
app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf.toString();
    }
}));

const bot = new TelegramBot(TOKEN);

/**
 * 🚨 ROOT WEBHOOK (НЕ /telegram)
 * это убирает 100% проблем Railway routing
 */
app.post('/', (req, res) => {

    console.log("🔥 WEBHOOK HIT:", req.body);

    try {
        bot.processUpdate(req.body);
    } catch (e) {
        console.error("WEBHOOK ERROR:", e);
    }

    res.sendStatus(200);
});

/**
 * 📊 CLICK TRACKER
 */
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

function ensure(day) {
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

app.post('/click', (req, res) => {
    const body = req.body || {};
    const day = getToday();

    ensure(day);

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

    res.json({ ok: true });
});

/**
 * 🤖 COMMANDS
 */
bot.on('message', (msg) => {
    if (msg.chat.id !== CHAT_ID) return;

    if ((msg.text || '').toLowerCase() === 'сегодня') {
        const day = getToday();
        ensure(day);

        const d = stats[day];

        bot.sendMessage(msg.chat.id,
`📊 СТАТИСТИКА (${day})

Telegram: ${d.Telegram}
WhatsApp: ${d.WhatsApp}
MAX: ${d.MAX}

direct: ${d.direct}
yandex: ${d.yandex}
seo: ${d.seo}`);
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log("🚀 SERVER READY (ROOT WEBHOOK MODE)");

    bot.sendMessage(CHAT_ID, "🟢 Bot online (ROOT webhook mode)");
});
