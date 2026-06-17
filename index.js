const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

const TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = -5473275880;

if (!TOKEN) {
    console.error("BOT_TOKEN not found!");
    process.exit(1);
}

const bot = new TelegramBot(TOKEN, { polling: true });

const DB_FILE = './stats.json';

// =====================
// LOAD / SAVE
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
// DATE HELPERS
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
// INIT DAY
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
// PARSE (ГЛАВНАЯ ЛОГИКА)
// =====================
function parse(text, day) {
    if (!text) return;

    ensureDay(day);

    const t = text.toLowerCase();

    // =====================
    // UTM PRIORITY (основной источник)
    // =====================
    if (t.includes('utm_source=telegram')) stats[day].Telegram++;
    if (t.includes('utm_source=whatsapp')) stats[day].WhatsApp++;
    if (t.includes('utm_source=max')) stats[day].MAX++;

    if (t.includes('utm_source=yandex')) stats[day].yandex++;
    if (t.includes('utm_source=seo')) stats[day].seo++;
    if (t.includes('utm_source=direct')) stats[day].direct++;

    // =====================
    // FALLBACK (если UTM нет)
    // =====================
    if (!t.includes('utm_source=')) {
        if (t.includes('telegram')) stats[day].Telegram++;
        if (t.includes('whatsapp')) stats[day].WhatsApp++;
        if (t.includes('max')) stats[day].MAX++;
        if (t.includes('yandex')) stats[day].yandex++;
        if (t.includes('direct')) stats[day].direct++;
        if (t.includes('seo')) stats[day].seo++;
    }
}

// =====================
// REPORT
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
// BOT LISTENER
// =====================
bot.on('message', (msg) => {

    if (msg.chat.id != CHAT_ID) return;

    const text = (msg.text || "").toLowerCase().split('@')[0];
    const today = getToday();

    // команды
    if (text === '/today' || text === 'сегодня') {
        sendReport(msg.chat.id, today, 'СТАТИСТИКА ЗА СЕГОДНЯ');
        return;
    }

    if (text === 'вчера') {
        sendReport(msg.chat.id, getYesterday(), 'СТАТИСТИКА ЗА ВЧЕРА');
        return;
    }

    // парсинг кликов
    parse(text, today);
    saveStats(stats);
});

// =====================
// AUTO REPORT (21:00 MSK = 18:00 UTC)
// =====================
setInterval(() => {
    const now = new Date();

    if (now.getUTCHours() === 18 && now.getUTCMinutes() === 0) {
        const today = getToday();
        sendReport(CHAT_ID, today, '📊 АВТООТЧЁТ (21:00 МСК)');
    }
}, 60 * 1000);

// =====================
console.log("Bot started + UTM analytics + auto report enabled");
