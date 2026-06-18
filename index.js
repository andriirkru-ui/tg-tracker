const express = require("express");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

console.log("🚀 STARTED");
console.log("CHAT:", CHAT_ID);
console.log("BOT:", !!BOT_TOKEN);

app.get("/", (req, res) => {
    res.send("OK");
});

app.post("/click", (req, res) => {

    console.log("🔥 CLICK RECEIVED");
    console.log("BODY:", req.body);

    const data = req.body || {};

    const text =
        `📊 TRACKER\n` +
        `event: ${data.event || "-" }\n` +
        `messenger: ${data.messenger || "-" }\n` +
        `source: ${data.source || "-" }\n` +
        `url: ${data.url || "-"}`;

    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

    fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            chat_id: CHAT_ID,
            text
        })
    })
    .then(r => r.text())
    .then(r => console.log("📨 TG RESPONSE:", r))
    .catch(err => console.log("❌ TG ERROR:", err));

    res.json({ ok: true });
});

app.listen(process.env.PORT || 8080, () => {
    console.log("PORT:", process.env.PORT || 8080);
});
