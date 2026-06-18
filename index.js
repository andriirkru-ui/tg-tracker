const express = require("express");
const cors = require("cors");

const app = express();

console.log("🔥 FILE LOADED - FULL SYSTEM");

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

// --------------------
// 📊 SIMPLE STATS
// --------------------
const stats = {
    clicks: {
        telegram: 0,
        whatsapp: 0,
        max: 0
    },
    events: {
        visit: 0
    }
};

// --------------------
// 📡 TELEGRAM SENDER
// --------------------
async function sendTelegram(text, chat_id = CHAT_ID) {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            chat_id,
            text
        })
    });
}

// --------------------
// 🟢 HEALTHCHECK
// --------------------
app.get("/", (req, res) => {
    res.send("OK");
});

// --------------------
// 📌 CLICK TRACKING
// --------------------
app.post("/click", async (req, res) => {

    console.log("🔥 CLICK RECEIVED:", req.body);

    const data = req.body || {};

    if (data.event === "visit") {
        stats.events.visit++;
    }

    if (data.event === "messenger_click") {
        if (data.messenger && stats.clicks[data.messenger] !== undefined) {
            stats.clicks[data.messenger]++;
        }

        // 🔔 уведомление в группу
        const text =
            `🔥 CLICK\n` +
            `messenger: ${data.messenger}\n` +
            `source: ${data.source}\n` +
            `url: ${data.url}`;

        await sendTelegram(text);
    }

    res.json({ ok: true });
});

// --------------------
// 🤖 TELEGRAM WEBHOOK
// --------------------
app.post("/telegram", async (req, res) => {

    console.log("🤖 TELEGRAM UPDATE:", JSON.stringify(req.body, null, 2));

    const msg = req.body.message;
    if (!msg || !msg.text) return res.json({ ok: true });

    const text = msg.text.toLowerCase();
    const chatId = msg.chat.id;

    let response = "";

    // --------------------
    // 📅 COMMANDS
    // --------------------
    if (text.includes("сегодня") || text === "/today") {
        response =
            `📊 TODAY\n` +
            `Telegram: ${stats.clicks.telegram}\n` +
            `WhatsApp: ${stats.clicks.whatsapp}\n` +
            `Max: ${stats.clicks.max}\n` +
            `Visits: ${stats.events.visit}`;
    }

    else if (text.includes("вчера") || text === "/yesterday") {
        response =
            `📊 YESTERDAY\n` +
            `(пока без базы, накопительные данные)\n\n` +
            `Telegram: ${stats.clicks.telegram}\n` +
            `WhatsApp: ${stats.clicks.whatsapp}\n` +
            `Max: ${stats.clicks.max}`;
    }

    else if (text.includes("неделя") || text === "/week") {
        response =
            `📊 WEEK\n` +
            `Telegram: ${stats.clicks.telegram}\n` +
            `WhatsApp: ${stats.clicks.whatsapp}\n` +
            `Max: ${stats.clicks.max}\n` +
            `Visits: ${stats.events.visit}`;
    }

    else {
        response = "Команды: /today /yesterday /week";
    }

    await sendTelegram(response, chatId);

    res.json({ ok: true });
});

// --------------------
// 🚀 START
// --------------------
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log("🚀 SERVER RUNNING ON", PORT);
});
