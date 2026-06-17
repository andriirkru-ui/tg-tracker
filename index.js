const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

const TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = -5473275880;

const bot = new TelegramBot(TOKEN, { polling: true });

const DB_FILE = './stats.json';

// --------------------
// STORAGE
// --------------------
function loadStats() {
    if (!fs.existsSync(DB_FILE)) return {};
    return JSON.parse(fs.readFileSync(DB_FILE));
}

function saveStats(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

let stats = loadStats();

// --------------------
// DATE
// --------------------
function getToday() {
    return new Date().toISOString().slice(0, 10);
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

// --------------------
// PARSE CLICK
// --------------------
function parse(text, day) {
    if (!text) return;

    ensureDay(day);

    if (text.includes('Telegram')) stats[day].Telegram++;
    if (text.includes('WhatsApp')) stats[day].WhatsApp++;
    if (text.includes('MAX')) stats[day].MAX++;

    if (text.includes('direct')) stats[day].direct++;
    if (text.includes('yandex')) stats[day].yandex++;
    if (text.includes('seo')) stats[day].seo++;
}

// --------------------
// PREVENT DUPLICATE /today
// --------------------
let lastReportSent = null;

// --------------------
// TODAY REPORT
// --------------------
function sendToday(chatId) {
    const day = getToday();
    ensureDay(day);

    // защита от дублей
    if (lastReportSent === day) return;

    const d = stats[day];

    const report =
`📊 СТАТИСТИКА ЗА СЕГОДНЯ (${day})

📨 Telegram: ${d.Telegram}
📞 WhatsApp: ${d.WhatsApp}
⚡ MAX: ${d.MAX}

📈 Источники:
- direct: ${d.direct}
- yandex: ${d.yandex}
- seo: ${d.seo}
`;

    bot.sendMessage(chatId, report);

    lastReportSent = day;
}

// --------------------
// BOT LISTENER
// --------------------
bot.on('message', (msg) => {
    if (msg.chat.id != CHAT_ID) return;

    const text = (msg.text || "").split('@')[0];
    const day = getToday();

    // команда
    if (text === '/today') {
        sendToday(msg.chat.id);
        return;
    }

    // клики
    parse(text, day);

    saveStats(stats);
});

// --------------------
console.log("Bot started");
