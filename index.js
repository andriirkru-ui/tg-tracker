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

/**
 * 🧠 FIX 409:
 * Telegram иногда держит старую polling сессию
 * поэтому полностью пересоздаём соединение безопасно
 */
try {
    const tmpBot = new TelegramBot(TOKEN);
    tmpBot.stopPolling();
} catch (e) {
    // ignore
}

/**
 * ✅ STABLE POLLING (Railway-safe)
 */
const bot = new TelegramBot(TOKEN, {
    polling: {
        autoStart: true,
        interval: 4000,
        params: {
            timeout: 10
        }
    }
});

const app = express();

/**
 * ✅ CORS FIXED
 */
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}));

app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * 📦 STORAGE
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

/**
 * 📅 DATE (MSK SAFE)
 */
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
 * 📊 REPORT
 */
function sendReport(chatId, day, title) {
    ensureDay(day);
    const d = stats[day];

    const text =
`📊 ${title} (${day})

📩 Мессенджеры:
Telegram: ${d.Telegram}
WhatsApp: ${d.WhatsApp}
MAX: ${d.MAX}

📈 Источники:
direct: ${d.direct}
yandex: ${d.yandex}
seo: ${d.seo}
`;

    bot.sendMessage(chatId, text);
}

/**
 * 🤖 BOT COMMANDS
 */
bot.on('message', (msg) => {
    if (msg.chat.id !== CHAT_ID) return;

    const text = (msg.text || "").toLowerCase().trim().split('@')[0];

    if (text === 'сегодня' || text === '/today') {
        sendReport(msg.chat.id, getToday(), "СТАТИСТИКА ЗА СЕГОДНЯ");
    }
});

/**
 * 🌐 HEALTHCHECK
 */
app.get('/', (req, res) => {
    res.send('Tracker is running');
});

/**
 * 📥 CLICK TRACKER
 */
app.post('/click', (req, res) => {
    const body = req.body || {};
    const day = getToday();

    ensureDay(day);

    const event = (body.event || '').toLowerCase();
    const source = (body.source || '').toLowerCase();
    const messenger = (body.messenger || '').toLowerCase();

    console.log("CLICK RECEIVED:", body);

    /**
     * VISITS (UTM)
     */
    if (event === 'visit') {
        if (source === 'yandex') stats[day].yandex++;
        else if (source === 'seo') stats[day].seo++;
        else stats[day].direct++;
    }

    /**
     * MESSENGERS
     */
    if (event === 'messenger_click') {
        if (messenger === 'telegram') stats[day].Telegram++;
        if (messenger === 'whatsapp') stats[day].WhatsApp++;
        if (messenger === 'max') stats[day].MAX++;
    }

    saveStats(stats);

    res.json({ ok: true });
});

/**
 * 🚀 START SERVER
 */
app.listen(process.env.PORT || 3000, () => {
    console.log("Bot started");
    console.log("Server running with CORS enabled");

    bot.sendMessage(CHAT_ID, "🟢 Bot online + stable polling FIXED + analytics active");
});
