const express = require("express");
const cors = require("cors");

const app = express();

console.log("🔥 SYSTEM STARTED (FINAL VERSION)");

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

// --------------------
// HEALTHCHECK
// --------------------
app.get("/", (req, res) => {
    res.send("OK");
});

// --------------------
// CLICK TRACKING
// --------------------
app.post("/click", async (req, res) => {

    console.log("🔥 CLICK RECEIVED:", JSON.stringify(req.body));

    const data = req.body || {};

    try {
        if (data.event === "messenger_click") {

            const text =
                `🔥 CLICK\n` +
                `messenger: ${data.messenger}\n` +
                `source: ${data.source}\n` +
                `url: ${data.url}`;

            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: CHAT_ID,
                    text
                })
            });

            console.log("📨 CLICK SENT TO TELEGRAM");
        }

    } catch (err) {
        console.log("❌ CLICK ERROR:", err);
    }

    res.json({ ok: true });
});

// --------------------
// TELEGRAM WEBHOOK
// --------------------
app.post("/telegram", async (req, res) => {

    console.log("🤖 TELEGRAM UPDATE:", JSON.stringify(req.body, null, 2));

    const update = req.body;

    const msg =
        update.message ||
        update.edited_message ||
        update.channel_post;

    if (!msg || !msg.text) {
        console.log("⚠️ NO MESSAGE");
        return res.json({ ok: true });
    }

    const text = msg.text.toLowerCase();
    const chatId = msg.chat.id;

    let response = "Команды: сегодня / вчера / неделя";

    if (text.includes("сегодня") || text === "/today") {
        response = "📊 Сегодняшний отчёт (пока базовый)";
    }

    if (text.includes("вчера") || text === "/yesterday") {
        response = "📊 Вчерашний отчёт (пока базовый)";
    }

    if (text.includes("неделя") || text === "/week") {
        response = "📊 Недельный отчёт (пока базовый)";
    }

    try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: chatId,
                text: response
            })
        });

        console.log("📨 ANSWER SENT");

    } catch (err) {
        console.log("❌ TELEGRAM SEND ERROR:", err);
    }

    res.json({ ok: true });
});

// --------------------
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log("🚀 SERVER RUNNING ON PORT", PORT);
});
