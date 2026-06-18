const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 8080;

/* =========================
   TELEGRAM CONFIG (ВСТАВЛЕНО)
========================= */
const BOT_TOKEN = "8759669567:AAGoYe0qRga8_HW9USqVpIuddSNQEHQPPq";
const CHAT_ID = process.env.CHAT_ID; // оставь как переменную Railway

/* =========================
   MIDDLEWARE
========================= */
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   STATS
========================= */
let stats = {
    Telegram: 0,
    WhatsApp: 0,
    MAX: 0,
    sources: {
        direct: 0,
        yandex: 0,
        seo: 0
    }
};

/* =========================
   TELEGRAM SENDER
========================= */
async function sendTG(text) {
    if (!CHAT_ID) return;

    try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text,
                parse_mode: "HTML"
            })
        });
    } catch (e) {
        console.log("TG ERROR:", e);
    }
}

/* =========================
   CLICK ENDPOINT
========================= */
app.post('/click', async (req, res) => {

    const data = req.body || {};

    const messenger = data.messenger || 'unknown';
    const source = data.source || 'direct';

    if (messenger === 'telegram') stats.Telegram++;
    if (messenger === 'whatsapp') stats.WhatsApp++;
    if (messenger === 'max') stats.MAX++;

    if (source === 'yandex') stats.sources.yandex++;
    else if (source === 'seo') stats.sources.seo++;
    else stats.sources.direct++;

    /* 🔔 LIVE NOTIFICATION */
    await sendTG(
`🔥 <b>КЛИК</b>
📌 Messenger: ${messenger}
🌍 Source: ${source}
🔗 URL: ${data.url || ''}`
    );

    res.json({ ok: true });
});

/* =========================
   REPORT
========================= */
function report(title) {
    return `
📊 <b>${title}</b>

Telegram: ${stats.Telegram}
WhatsApp: ${stats.WhatsApp}
MAX: ${stats.MAX}

Sources:
- direct: ${stats.sources.direct}
- yandex: ${stats.sources.yandex}
- seo: ${stats.sources.seo}
`;
}

/* =========================
   COMMANDS
========================= */
app.get('/today', async (req, res) => {
    await sendTG(report("СЕГОДНЯ"));
    res.json({ ok: true });
});

app.get('/yesterday', async (req, res) => {
    await sendTG(report("ВЧЕРА"));
    res.json({ ok: true });
});

app.get('/week', async (req, res) => {
    await sendTG(report("НЕДЕЛЯ"));
    res.json({ ok: true });
});

/* =========================
   START
========================= */
app.listen(PORT, () => {
    console.log("🚀 SERVER STARTED");
});
