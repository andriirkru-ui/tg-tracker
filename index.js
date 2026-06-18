const express = require('express');
const cors = require('cors');

const app = express();

// 🔥 FIX: обязательно для URLSearchParams и form-data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 🔥 CORS (важно для Тильды)
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}));

// ======================
// 📊 STORAGE (в памяти)
// ======================
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

// ======================
// 🔥 HEALTH CHECK
// ======================
app.get('/', (req, res) => {
    res.send('Server running (WEBHOOK MODE)');
});

// ======================
// 📡 MAIN TRACKING ENDPOINT
// ======================
app.post('/click', (req, res) => {
    console.log('🔥 CLICK RECEIVED');
    console.log('BODY:', req.body);

    const data = req.body || {};

    // ======================
    // messenger tracking
    // ======================
    if (data.messenger === 'telegram') {
        stats.Telegram++;
    }

    if (data.messenger === 'whatsapp') {
        stats.WhatsApp++;
    }

    if (data.messenger === 'max') {
        stats.MAX++;
    }

    // ======================
    // source tracking
    // ======================
    const source = data.source || 'direct';

    if (source === 'yandex') stats.sources.yandex++;
    else if (source === 'seo') stats.sources.seo++;
    else stats.sources.direct++;

    res.json({ ok: true });
});

// ======================
// 📊 STATS ENDPOINT (для теста)
// ======================
app.get('/stats', (req, res) => {
    res.json(stats);
});

// ======================
// 🚀 START SERVER
// ======================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log('🚀 SERVER STARTED (WEBHOOK MODE)');
    console.log('PORT:', PORT);
});
