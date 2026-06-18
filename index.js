import express from "express";
import fetch from "node-fetch";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import cron from "node-cron";

const app = express();
app.use(express.json());

// ======================
// CONFIG
// ======================
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// ======================
// DB INIT (SQLite)
// ======================
let db;

async function initDB() {
    db = await open({
        filename: "./data.db",
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS clicks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event TEXT,
            messenger TEXT,
            source TEXT,
            medium TEXT,
            campaign TEXT,
            url TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

await initDB();

// ======================
// TELEGRAM SENDER
// ======================
async function sendTelegram(text) {
    await fetch(`${TELEGRAM_API}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            chat_id: CHAT_ID,
            text,
            parse_mode: "HTML"
        })
    });
}

// ======================
// CLICK ENDPOINT
// ======================
app.post("/click", async (req, res) => {
    const data = req.body;

    console.log("📩 CLICK:", data);

    await db.run(
        `INSERT INTO clicks (event, messenger, source, medium, campaign, url)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
            data.event,
            data.messenger || "unknown",
            data.source || "direct",
            data.medium || "none",
            data.campaign || "none",
            data.url || ""
        ]
    );

    // realtime alert
    if (data.event === "messenger_click") {
        await sendTelegram(
            `🟡 КЛИК: ${data.messenger}\n` +
            `🔗 ${data.url}\n` +
            `📊 ${data.source}/${data.medium}/${data.campaign}`
        );
    }

    res.json({ ok: true });
});

// ======================
// STATS FUNCTION
// ======================
async function getStats(range = "today") {
    let where = "";

    if (range === "today") {
        where = "date(created_at) = date('now')";
    }
    if (range === "yesterday") {
        where = "date(created_at) = date('now','-1 day')";
    }

    const clicks = await db.all(`
        SELECT messenger, COUNT(*) as count
        FROM clicks
        ${where ? "WHERE " + where : ""}
        GROUP BY messenger
    `);

    const sources = await db.all(`
        SELECT source, COUNT(*) as count
        FROM clicks
        ${where ? "WHERE " + where : ""}
        GROUP BY source
    `);

    return { clicks, sources };
}

// ======================
// DAILY REPORT 21:00
// ======================
cron.schedule("0 21 * * *", async () => {
    const stats = await getStats("today");

    let msg = `📊 <b>ДНЕВНОЙ ОТЧЁТ</b>\n\n`;

    for (const c of stats.clicks) {
        msg += `• ${c.messenger}: ${c.count}\n`;
    }

    msg += `\n📡 Источники:\n`;

    for (const s of stats.sources) {
        msg += `• ${s.source}: ${s.count}\n`;
    }

    await sendTelegram(msg);
});

// ======================
// COMMAND WEBHOOK
// ======================
app.post("/telegram", async (req, res) => {
    const msg = req.body.message;

    if (!msg?.text) return res.json({ ok: true });

    const chatId = msg.chat.id;
    const text = msg.text.toLowerCase();

    let stats;

    if (text.includes("сегодня")) {
        stats = await getStats("today");
    }

    if (text.includes("вчера")) {
        stats = await getStats("yesterday");
    }

    if (text.includes("неделя")) {
        stats = await getStats();
    }

    if (stats) {
        let reply = `📊 <b>ОТЧЁТ</b>\n\n`;

        for (const c of stats.clicks) {
            reply += `• ${c.messenger}: ${c.count}\n`;
        }

        await fetch(`${TELEGRAM_API}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: chatId,
                text: reply,
                parse_mode: "HTML"
            })
        });
    }

    res.json({ ok: true });
});

// ======================
app.listen(8080, () => {
    console.log("🚀 SERVER RUNNING ON 8080");
});
