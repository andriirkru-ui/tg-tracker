const express = require("express");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

console.log("🚀 STARTED");
console.log("BOT:", !!BOT_TOKEN);
console.log("CHAT:", CHAT_ID);

app.get("/", (req, res) => {
    res.send("OK");
});

app.post("/click", async (req, res) => {
    console.log("🔥 CLICK RECEIVED");
    console.log("BODY:", req.body);

    const data = req.body || {};

    try {
        const text =
            `📊 TRACKER\n` +
            `event: ${data.event || "-" }\n` +
            `messenger: ${data.messenger || "-" }\n` +
            `source: ${data.source || "-" }\n` +
            `url: ${data.url || "-"}`;

        const tgUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

        const response = await fetch(tgUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text
            })
        });

        const result = await response.text();
        console.log("📨 TG:", result);

        res.json({ ok: true });

    } catch (e) {
        console.log("❌ ERROR:", e);
        res.status(500).json({ ok: false });
    }
});

app.listen(process.env.PORT || 8080, () => {
    console.log("PORT:", process.env.PORT || 8080);
});
