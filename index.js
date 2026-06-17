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
// DATE HELPERS
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
// REPORTS
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

    const text = (msg.text || "").toLowerCase().split('@')[0];
    const day = getToday();

    // 🔥 РУССКИЕ КОМАНДЫ
    if (text === 'сегодня') {
        sendReport(msg.chat.id, getToday(), 'СТАТИСТИКА ЗА СЕГОДНЯ');
        return;
    }

    if (text === 'вчера') {
        sendReport(msg.chat.id, getYesterday(), 'СТАТИСТИКА ЗА ВЧЕРА');
        return;
    }

    if (text === 'неделя') {
        let total = {
            Telegram: 0,
            WhatsApp: 0,
            MAX: 0,
            direct: 0,
            yandex: 0,
            seo: 0
        };

        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().slice(0, 10);

            ensureDay(key);

            const s = stats[key];

            total.Telegram += s.Telegram;
            total.WhatsApp += s.WhatsApp;
            total.MAX += s.MAX;
            total.direct += s.direct;
            total.yandex += s.yandex;
            total.seo += s.seo;
        }

        bot.sendMessage(chatId,
`📊 СТАТИСТИКА ЗА НЕДЕЛЮ

📨 Telegram: ${total.Telegram}
📞 WhatsApp: ${total.WhatsApp}
⚡ MAX: ${total.MAX}

📈 Источники:
- direct: ${total.direct}
- yandex: ${total.yandex}
- seo: ${total.seo}
`);
        return;
    }

    // клики
    parse(text, day);
    saveStats(stats);
});

console.log("Bot started");
