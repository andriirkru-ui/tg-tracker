const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   GLOBAL LOGGER (ВАЖНО)
========================= */
app.use((req, res, next) => {
    console.log(`➡️ ${req.method} ${req.url}`);
    next();
});

/* =========================
   HEALTHCHECK
========================= */
app.get('/', (req, res) => {
    console.log('🏠 HEALTHCHECK HIT');
    res.send('OK');
});

/* =========================
   CLICK ENDPOINT
========================= */
app.post('/click', (req, res) => {
    console.log('🔥 CLICK RECEIVED BODY:', req.body);
    res.json({ ok: true });
});

/* =========================
   TELEGRAM WEBHOOK
========================= */
app.post('/telegram', (req, res) => {
    console.log('🔥 TELEGRAM WEBHOOK HIT');
    console.log(req.body);
    res.sendStatus(200);
});

/* =========================
   START
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log('🚀 SERVER STARTED (DEBUG MODE)');
});
