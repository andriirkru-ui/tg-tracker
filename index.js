const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

const TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = -5473275880;

const bot = new TelegramBot(TOKEN, { polling: true });

const DB_FILE = './stats.json';

// --------------------
// LOAD STATS
// --------------------
function loadStats() {
    if (!fs.existsSync(DB_FILE)) {
        return {};
    }
    return JSON.parse(fs.readFileSync(DB_FILE));
}

function saveStats(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

let stats = loadStats();

// --------------------
// INIT DAY STORAGE
// --------------------
function getToday() {
    return new Date().toISOString().slice(0, 10);
}

function ensureDay() {
    const today = getToday();
    if (!stats[today]) {
        stats[today] = {
            Telegram: 0,
            WhatsApp: 0,
            MAX: 0,
            direct: 0,
            yandex: 0,
            seo: 0
        };
    }
    return today;
}

// --------------------
// PARSE CLICK
// --------------------
function parse(text) {
    if (!text) return;

    const day = ensureDay();

    if (text.includes('Telegram')) stats[day].Telegram++;
    if (text.includes('WhatsApp')) stats[day].WhatsApp++;
    if (text.includes('MAX')) stats[day].MAX++;

    if (text.includes('direct')) stats[day].direct++;
    if (text.includes('yandex')) stats[day].yandex++;
    if (text.includes('seo')) stats[day].seo++;

    saveStats(stats);
}

// --------------------
// TELEGRAM LISTENER
// --------------------
bot.on('message', (msg) => {
    if (msg.chat.id != CHAT_ID) return;

    const text = msg.text || "";

    // обычные клики
    parse(text);

    // команды
    if (text === '/today') {
        sendToday(msg.chat.id);
    }
});

// --------------------
// LIVE STATS
// --------------------
function sendToday(chatId) {
    const day = ensureDay();
    const d = stats[day];

    const report =
`📊 СТАТИСТИКА ЗА СЕГОДНЯ

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

// --------------------
console.log("Bot started");
