const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

const TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = -5473275880;

const bot = new TelegramBot(TOKEN, { polling: true });

const DB_FILE = './stats.json';

// --------------------
// INIT STORAGE
// --------------------
function loadStats() {
    if (!fs.existsSync(DB_FILE)) {
        return {
            Telegram: 0,
            WhatsApp: 0,
            MAX: 0,
            yandex: 0,
            seo: 0,
            direct: 0,
            log: []
        };
    }
    return JSON.parse(fs.readFileSync(DB_FILE));
}

function saveStats(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

let stats = loadStats();

// --------------------
// PARSE CLICK
// --------------------
function parse(text) {
    if (!text) return;

    let changed = false;

    if (text.includes('Telegram')) {
        stats.Telegram++;
        changed = true;
    }

    if (text.includes('WhatsApp')) {
        stats.WhatsApp++;
        changed = true;
    }

    if (text.includes('MAX')) {
        stats.MAX++;
        changed = true;
    }

    if (text.includes('yandex')) {
        stats.yandex++;
        changed = true;
    }

    if (text.includes('seo')) {
        stats.seo++;
        changed = true;
    }

    if (text.includes('direct')) {
        stats.direct++;
        changed = true;
    }

    if (changed) {
        stats.log.push({
            time: new Date().toISOString(),
            text
        });

        saveStats(stats);
    }
}

// --------------------
// TELEGRAM LISTENER
// --------------------
bot.on('message', (msg) => {
    if (msg.chat.id != CHAT_ID) return;
    parse(msg.text);
});

// --------------------
// DAILY REPORT (21:00)
// --------------------
function sendReport() {
    const report =
`📊 ОТЧЁТ ЗА ДЕНЬ

📨 Telegram: ${stats.Telegram}
📞 WhatsApp: ${stats.WhatsApp}
⚡ MAX: ${stats.MAX}

📈 Источники:
- Yandex: ${stats.yandex}
- SEO: ${stats.seo}
- Direct: ${stats.direct}
`;

    bot.sendMessage(CHAT_ID, report);

    // reset after report
    stats = {
        Telegram: 0,
        WhatsApp: 0,
        MAX: 0,
        yandex: 0,
        seo: 0,
        direct: 0,
        log: []
    };

    saveStats(stats);
}

// --------------------
// TIMER 21:00
// --------------------
setInterval(() => {
    const now = new Date();
    if (now.getHours() === 21 && now.getMinutes() === 0) {
        sendReport();
    }
}, 60000);

console.log("Bot started");
