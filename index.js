const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

/* =========================
   ENV CHECK (ВАЖНО!)
========================= */
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

console.log("BOT_TOKEN exists:", !!BOT_TOKEN);
console.log("CHAT_ID exists:", !!CHAT_ID);

/* ========================= */
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ========================= */
let stats = {
    Telegram: 0,
    WhatsApp: 0,
    MAX: 0
};

/* ========================= */
async function sendTG(text) {

    console.log("➡️ sendTG CALLED");

    if (!BOT_TOKEN || !CHAT_ID) {
        console.log("❌ MISSING ENV VARS");
        return;
    }

    try {
        const resp = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text
            })
        });

        console.log("📩 TG STATUS:", await resp.text());

    } catch (err) {
        console.log("❌ TG ERROR:", err.message);
    }
}

/* ========================= */
app.post('/click', async (req, res) => {

    console.log("🔥 CLICK RECEIVED:", req.body);

    const data = req.body || {};

    const messenger = data.messenger || 'unknown';

    if (messenger === 'telegram') stats.Telegram++;
    if (messenger === 'whatsapp') stats.WhatsApp++;
    if (messenger === 'max') stats.MAX++;

    await sendTG(`🔥 CLICK: ${messenger}`);

    res.json({ ok: true });
});

/* ========================= */
app.get('/', (req, res) => {
    res.send('OK');
});

/* ========================= */
app.listen(PORT, () => {
    console.log("🚀 SERVER STARTED");
    console.log("PORT:", PORT);
});
