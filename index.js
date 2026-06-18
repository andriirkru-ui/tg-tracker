const express = require("express");
const fetch = require("node-fetch");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

console.log("🚀 SERVER STARTED");
console.log("BOT_TOKEN exists:", !!BOT_TOKEN);
console.log("CHAT_ID value:", CHAT_ID); // 👈 ВАЖНО (НЕ boolean)

app.post("/click", async (req, res) => {
    try {
        console.log("🔥 CLICK RECEIVED");
        console.log("BODY:", req.body);

        const data = req.body || {};

        const text =
            `📊 TRACKER EVENT\n\n` +
            `event: ${data.event || "unknown"}\n` +
            `messenger: ${data.messenger || "-"}\n` +
            `source: ${data.source || "-"}\n` +
            `campaign: ${data.campaign || "-"}\n` +
            `url: ${data.url || "-"}`;

        if (CHAT_ID) {
            const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

            const tgRes = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: CHAT_ID,
                    text: text
                })
            });

            const result = await tgRes.text();
            console.log("📨 TELEGRAM RESPONSE:", result);
        } else {
            console.log("❌ NO CHAT_ID");
        }

        res.json({ ok: true });

    } catch (err) {
        console.error("❌ ERROR:", err);
        res.status(500).json({ ok: false });
    }
});

app.get("/", (req, res) => {
    res.send("Server running");
});

app.listen(process.env.PORT || 8080, () => {
    console.log("PORT:", process.env.PORT || 8080);
});
