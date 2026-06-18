const express = require("express");
const cors = require("cors");
const https = require("https");

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
app.use(express.json({ type: "*/*" }));
app.use(express.urlencoded({ extended: true }));

// =====================
// HEALTH CHECK
// =====================
app.get("/", (req, res) => {
    res.send("tg-tracker is running");
});

// =====================
// TELEGRAM SENDER (100% STABLE)
// =====================
function sendTelegram(text) {
    return new Promise((resolve, reject) => {

        const payload = JSON.stringify({
            chat_id: CHAT_ID,
            text: text
        });

        const options = {
            hostname: "api.telegram.org",
            path: `/bot${BOT_TOKEN}/sendMessage`,
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(payload)
            }
        };

        const req = https.request(options, (res) => {
            let data = "";

            res.on("data", chunk => data += chunk);

            res.on("end", () => {
                console.log("📨 TELEGRAM RESPONSE:", data);
                resolve(data);
            });
        });

        req.on("error", (err) => {
            console.error("❌ TELEGRAM ERROR:", err);
            reject(err);
        });

        req.write(payload);
        req.end();
    });
}

// =====================
// CLICK ENDPOINT
// =====================
app.post("/click", async (req, res) => {

    console.log("🔥 CLICK RECEIVED");
    console.log("BODY:", req.body);

    const data = req.body || {};

    let text = "";

    // VISIT EVENT
    if (data.event === "visit") {
        text =
`📍 VISIT
source: ${data.source || "-"}
medium: ${data.medium || "-"}
campaign: ${data.campaign || "-"}
url: ${data.url || "-"}`;
    }

    // MAIN CLICK EVENT
    if (data.event === "messenger_click") {
        text =
`🔥 MESSENGER CLICK
messenger: ${data.messenger || "-"}
source: ${data.source || "-"}
medium: ${data.medium || "-"}
campaign: ${data.campaign || "-"}
page: ${data.url || "-"}
target: ${data.target || "-"}`;
    }

    // fallback (НА ВСЯКИЙ СЛУЧАЙ)
    if (!text && data.messenger) {
        text =
`⚠️ RAW CLICK
messenger: ${data.messenger}
url: ${data.url || "-"}`;
    }

    if (!text) {
        console.log("⚠️ EMPTY EVENT — SKIP");
        return res.json({ ok: false });
    }

    try {
        await sendTelegram(text);
        return res.json({ ok: true });
    } catch (err) {
        console.error("❌ SEND ERROR:", err);
        return res.json({ ok: false });
    }
});

// =====================
// START SERVER
// =====================
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log("🚀 SERVER STARTED");
    console.log("PORT:", PORT);
    console.log("BOT_TOKEN:", !!BOT_TOKEN);
    console.log("CHAT_ID:", !!CHAT_ID);
});
