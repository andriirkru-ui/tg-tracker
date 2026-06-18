const express = require("express");
const app = express();

console.log("🔥 FILE LOADED - NEW VERSION");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

// проверка сервера
app.get("/", (req, res) => {
    res.send("OK");
});

// главный трекинг
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
            `medium: ${data.medium || "-"}\n` +
            `campaign: ${data.campaign || "-"}\n` +
            `url: ${data.url || "-"}`;

        const response = await fetch(
            `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: CHAT_ID,
                    text
                })
            }
        );

        const result = await response.text();
        console.log("📨 TELEGRAM RESPONSE:", result);

    } catch (err) {
        console.log("❌ ERROR:", err);
    }

    res.json({ ok: true });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log("🚀 SERVER RUNNING ON PORT", PORT);
});
