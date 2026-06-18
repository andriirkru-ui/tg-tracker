const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

/* =========================
   CORS — ЖЕЛЕЗНЫЙ РЕЖИМ
========================= */
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}));

// ОБЯЗАТЕЛЬНО handle preflight
app.options('*', cors());

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
   ROOT CHECK
========================= */
app.get('/', (req, res) => {
    res.send('OK');
});

/* =========================
   CLICK ENDPOINT
========================= */
app.post('/click', (req, res) => {

    console.log("🔥 CLICK RECEIVED");
    console.log("BODY:", req.body);

    const data = req.body || {};

    const messenger = data.messenger;

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
