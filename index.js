const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   START LOG
========================= */
console.log('🚀 SERVER FILE LOADED');

/* =========================
   CLICK ENDPOINT
========================= */
app.post('/click', (req, res) => {
    console.log('🔥 CLICK RECEIVED:', req.body);
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
   HEALTHCHECK
========================= */
app.get('/', (req, res) => {
    res.send('Server running (WEBHOOK MODE)');
});

/* =========================
   START
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log('🚀 SERVER STARTED (WEBHOOK MODE)');
});
