const express = require("express");
const cors = require("cors");

const app = express();

// =====================
// ENV
// =====================
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

// =====================
// MIDDLEWARE
// =====================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =====================
// HEALTHCHECK
// =====================
app.get("/", (req, res) => {
    res.send("tg-tracker is running");
});

// =====================
// MAIN CLICK ENDPOINT
// =====================
app.post("/click", async (req, res) => {
    console.log("🔥 CLICK RECEIVED:", req.body);

    const data = req.body || {};

    if (!BOT_TOKEN || !CHAT_ID) {
        console.log("❌ Missing BOT_TOKEN or CHAT_ID");
        return res.json({ ok: false, error: "ENV missing" });
    }

    let text = "";

    if (data.event === "visit") {
        text =
`📍 VISIT
source: ${data.source}
medium: ${data.medium}
campaign: ${data.campaign}
url: ${data.url || "-"}`;
    }

    if (data.event === "messenger_click") {
        text =
`🔥 CLICK
messenger: ${data.messenger}
source: ${data.source}
campaign: ${data.campaign}
page: ${data.url}
target: ${data.target}`;
    }

    try {
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: text
            })
        });

        const result = await response.json();

        console.log("📨 TELEGRAM RESPONSE:", result);

        return res.json({ ok: true });
    } catch (err) {
        console.error("❌ TELEGRAM ERROR:", err);
        return res.json({ ok: false, error: err.message });
    }
});

// =====================
// START SERVER
// =====================
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log("🚀 SERVER STARTED");
    console.log("PORT:", PORT);
    console.log("BOT_TOKEN exists:", !!BOT_TOKEN);
    console.log("CHAT_ID exists:", !!CHAT_ID);
});
