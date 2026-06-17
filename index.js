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
// INIT DAY
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
// PARSE
// --------------------
function parse(text, day) {
    if (!text) return;

    ensureDay(day);

    const t = text.toLowerCase();

    if (t.includes('telegram')) stats[day].Telegram++;
    if (t.includes('whatsapp')) stats[day].WhatsApp++;
    if (t.includes('max')) stats[day].MAX++;

    if (t.includes('direct')) stats[day].direct++;
    if (t.includes('yandex')) stats[day].yandex++;
    if (t.includes('seo')) stats[day].seo++;
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
// COMMANDS
// --------------------
bot.on('message', (msg) => {

    if (msg.chat.id != CHAT_ID) return;

    const text = (msg.text || "").toLowerCase().split('@')[0];

    const today = getToday();

    // ручной отчёт
    if (text === '/today' || text === 'сегодня') {
        sendReport(msg.chat.id, today, 'СТАТИСТИКА ЗА СЕГОДНЯ');
        return;
    }

    if (text === 'вчера') {
        sendReport(msg.chat.id, getYesterday(), 'СТАТИСТИКА ЗА ВЧЕРА');
        return;
    }

    // клики
    parse(text, today);
    saveStats(stats);
});

// --------------------
// AUTO REPORT 21:00 MSK (18:00 UTC)
// --------------------
setInterval(() => {
    const now = new Date();

    // 18:00 UTC = 21:00 MSK
    if (now.getUTCHours() === 18 && now.getUTCMinutes() === 0) {
        const today = getToday();
        sendReport(CHAT_ID, today, '📊 АВТООТЧЁТ (21:00 МСК)');
    }
}, 60 * 1000);

// --------------------
console.log("Bot started + auto report enabled");
