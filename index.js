const express = require("express");
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

console.log("🚀 STARTED");
console.log("CHAT:", CHAT_ID);
console.log("BOT:", !!BOT_TOKEN);

// health check
app.get("/", (req, res) => {
    res.send("OK");
});

// MAIN ENDPOINT
app.post("/click", async (req, res) => {

    console.log("🔥 CLICK RECEIVED");
    console.log("HEADERS:", req.headers["content-type"]);
    console.log("BODY:", req.body);

    const data = req.body || {};

    const text =
        `📊 TRACKER\n` +
        `event: ${data.event || "-" }\n` +
        `messenger: ${data.messenger || "-" }\n` +
        `source: ${data.source || "-" }\n` +
        `medium: ${data.medium || "-" }\n` +
        `campaign: ${data.campaign || "-" }\n` +
        `url: ${data.url || "-"}`;

    try {
        const tgUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

        const response = await fetch(tgUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text
            })
        });

        const result = await response.text();
        console.log("📨 TG RESPONSE:", result);

    } catch (e) {
        console.log("❌ TG ERROR:", e);
    }

    res.json({ ok: true });
});

app.listen(process.env.PORT || 8080, () => {
    console.log("PORT:", process.env.PORT || 8080);
});
