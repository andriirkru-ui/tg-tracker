const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

/* =========================
   CONFIG
========================= */
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

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
   TELEGRAM SENDER (NO node-fetch!)
========================= */
async function sendTG(text) {

    if (!BOT_TOKEN || !CHAT_ID) return;

    try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: text,
                parse_mode: "HTML"
            })
        });
    } catch (err) {
        console.log("TG ERROR:", err.message);
    }
}

/* =========================
   ROOT
========================= */
app.get('/', (req, res) => {
    res.send('Server running (WEBHOOK MODE)');
});

/* =========================
   CLICK ENDPOINT
========================= */
app.post('/click', async (req, res) => {

    const data = req.body || {};

    const messenger = data.messenger || 'unknown';
    const source = data.source || 'direct';

    /* stats update */
    if (messenger === 'telegram') stats.Telegram++;
    if (messenger === 'whatsapp') stats.WhatsApp++;
    if (messenger === 'max') stats.MAX++;

    if (source === 'yandex') stats.sources.yandex++;
    else if (source === 'seo') stats.sources.seo++;
    else stats.sources.direct++;

    /* telegram notification */
    await sendTG(
`🔥 <b>КЛИК</b>
📌 ${messenger}
🌍 ${source}
🔗 ${data.url || ''}`
    );

    res.json({ ok: true });
});

/* =========================
   REPORT FUNCTION
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
    console.log("🚀 SERVER STARTED (WEBHOOK MODE)");
    console.log("PORT:", PORT);
});
