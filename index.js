const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

const TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = -5473275880;

const bot = new TelegramBot(TOKEN, { polling: true });

const DB_FILE = './stats.json';
const STATE_FILE = './state.json';

// --------------------
// LOAD DATA
// --------------------
function loadStats() {
    if (!fs.existsSync(DB_FILE)) {
        return {
            Telegram: 0,
            WhatsApp: 0,
            MAX: 0,
            yandex: 0,
            seo: 0,
            direct: 0
        };
    }
    return JSON.parse(fs.readFileSync(DB_FILE));
}

function saveStats(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// --------------------
// LOAD STATE (для защиты отчёта)
// --------------------
function loadState() {
    if (!fs.existsSync(STATE_FILE)) {
        return { lastReportDate: null };
    }
    return JSON.parse(fs.readFileSync(STATE_FILE));
}

function saveState(data) {
    fs.writeFileSync(STATE_FILE, JSON.stringify(data, null, 2));
}

let stats = loadStats();
let state = loadState();

// --------------------
// PARSE CLICK
// --------------------
function parse(text) {
    if (!text) return;

    let changed = false;

    if (text.includes('Telegram')) { stats.Telegram++; changed = true; }
    if (text.includes('WhatsApp')) { stats.WhatsApp++; changed = true; }
    if (text.includes('MAX')) { stats.MAX++; changed = true; }
    if (text.includes('yandex')) { stats.yandex++; changed = true; }
    if (text.includes('seo')) { stats.seo++; changed = true; }
    if (text.includes('direct')) { stats.direct++; changed = true; }

    if (changed) saveStats(stats);
}

// --------------------
// TELEGRAM LISTENER
// --------------------
bot.on('message', (msg) => {
    if (msg.chat.id != CHAT_ID) return;
    parse(msg.text);
});

// --------------------
// SEND REPORT
// --------------------
function sendReport() {
    const today = new Date().toISOString().slice(0, 10);

    // защита от дубля
    if (state.lastReportDate === today) return;

    const report =
`📊 ОТЧЁТ ЗА ДЕНЬ (${today})

📨 Telegram: ${stats.Telegram}
📞 WhatsApp: ${stats.WhatsApp}
⚡ MAX: ${stats.MAX}

📈 Источники:
- Yandex: ${stats.yandex}
- SEO: ${stats.seo}
- Direct: ${stats.direct}
`;

    bot.sendMessage(CHAT_ID, report);

    // reset stats
    stats = {
        Telegram: 0,
        WhatsApp: 0,
        MAX: 0,
        yandex: 0,
        seo: 0,
        direct: 0
    };

    saveStats(stats);

    // save state
    state.lastReportDate = today;
    saveState(state);
}

// --------------------
// SAFE TIMER (каждую минуту)
// --------------------
setInterval(() => {
    const now = new Date();

    const hours = now.getHours();
    const minutes = now.getMinutes();

    if (hours === 21 && minutes === 0) {
        sendReport();
    }
}, 60000);

// --------------------
console.log("Bot started");
