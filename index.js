const express = require('express');
const app = express();

const PORT = process.env.PORT || 8080;

/* =========================
   BODY PARSERS (КРИТИЧНО)
========================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   SIMPLE STATS STORAGE
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

    // messenger tracking
    const messenger = data.messenger || null;

    if (messenger === 'telegram') {
        stats.Telegram = (stats.Telegram || 0) + 1;
    }

    if (messenger === 'whatsapp') {
        stats.WhatsApp = (stats.WhatsApp || 0) + 1;
    }

    if (messenger === 'max') {
        stats.MAX = (stats.MAX || 0) + 1;
    }

    // source tracking
    const source = data.source || 'direct';

    if (source === 'yandex') {
        stats.sources.yandex++;
    } else if (source === 'seo') {
        stats.sources.seo++;
    } else {
        stats.sources.direct++;
    }

    res.json({ ok: true });
});

/* =========================
   STATS ENDPOINT (optional)
========================= */
app.get('/stats', (req, res) => {
    res.json(stats);
});

/* =========================
   START SERVER
========================= */
app.listen(PORT, () => {
    console.log("🚀 SERVER STARTED (WEBHOOK MODE)");
    console.log("PORT:", PORT);
});
