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

function getYesterday() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
}

// --------------------
// INIT
// --------------------
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
// CLEAN TEXT (ВАЖНО)
// --------------------
function норм(text) {
    return (text || "")
        .toString()
        .toLowerCase()
        .replace(/\u200b/g, '')   // убираем невидимые символы
        .trim()
        .split('@')[0];
}

// --------------------
// PARSE CLICK
// --------------------
function parse(text, day) {
    if (!text) return;

    ensureDay(day);

    if (text.includes('telegram')) stats[day].Telegram++;
    if (text.includes('whatsapp')) stats[day].WhatsApp++;
    if (text.includes('max')) stats[day].MAX++;

    if (text.includes('direct')) stats[day].direct++;
    if (text.includes('yandex')) stats[day].yandex++;
    if (text.includes('seo')) stats[day].seo++;
}

// --------------------
// REPORT
// --------------------
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

// --------------------
// BOT
// --------------------
bot.on('message', (msg) => {

    if (msg.chat.id != CHAT_ID) return;

    const text = норм(msg.text);
    const day = getToday();

    console.log("IN:", msg.chat.id, text);

    // --------------------
    // КОМАНДЫ (РУССКИЕ + /)
    // --------------------
    if (
        text === '/today' ||
        text === 'сегодня' ||
        text === '/сегодня'
    ) {
        sendReport(msg.chat.id, getToday(), 'СТАТИСТИКА ЗА СЕГОДНЯ');
        return;
    }

    if (
        text === 'вчера' ||
        text === '/yesterday' ||
        text === '/вчера'
    ) {
        sendReport(msg.chat.id, getYesterday(), 'СТАТИСТИКА ЗА ВЧЕРА');
        return;
    }

    // --------------------
    // КЛИКИ
    // --------------------
    parse(text, day);
    saveStats(stats);
});

console.log("Bot started");
