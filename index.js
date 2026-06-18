const express = require("express");
const cors = require("cors");

const app = express();

console.log("🔥 FILE LOADED - FIXED VERSION");

// ✅ FIX CORS (КРИТИЧНО)
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

// healthcheck
app.get("/", (req, res) => {
    res.send("OK");
});

// 🔥 CLICK ENDPOINT
app.post("/click", async (req, res) => {

    console.log("🔥 CLICK ENDPOINT HIT");
    console.log("BODY:", req.body);

    const data = req.body || {};

    try {
        const text =
            `📊 TG TRACKER\n\n` +
            `event: ${data.event || "-"}\n` +
            `messenger: ${data.messenger || "-"}\n` +
            `source: ${data.source || "-"}\n` +
            `url: ${data.url || "-"}`;

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text
            })
        });

        console.log("📨 SENT TO TELEGRAM");

    } catch (e) {
        console.log("❌ ERROR:", e);
    }

    res.json({ ok: true });
});

// fallback OPTIONS (важно для preflight)
app.options("*", cors());

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log("🚀 SERVER RUNNING ON PORT", PORT);
});
