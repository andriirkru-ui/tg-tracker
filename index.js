const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

/* =========================
   CORS FIX (КРИТИЧНО)
========================= */
app.use(cors({
    origin: '*'
}));

/* =========================
   BODY PARSERS
========================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   STATS
========================= */
const stats = {
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
   ROOT
========================= */
app.get('/', (req, res) => {
    res.send('Server running (WEBHOOK MODE)');
});

/* =========================
   CLICK ENDPOINT
========================= */
app.post('/click', (req, res) => {

    console.log("🔥 CLICK RECEIVED");
    console.log("BODY:", req.body);

    const data = req.body || {};

    const messenger = data.messenger || null;

    if (messenger === 'telegram') stats.Telegram++;
    if (messenger === 'whatsapp') stats.WhatsApp++;
    if (messenger === 'max') stats.MAX++;

    const source = data.source || 'direct';

    if (source === 'yandex') stats.sources.yandex++;
    else if (source === 'seo') stats.sources.seo++;
    else stats.sources.direct++;

    res.json({ ok: true });
});

/* =========================
   START
========================= */
app.listen(PORT, () => {
    console.log("🚀 SERVER STARTED (WEBHOOK MODE)");
    console.log("PORT:", PORT);
});
