const express = require("express");
const cors = require("cors");
const https = require("https");

const app = express();

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.send("tg-tracker alive");
});

function sendTelegram(text) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            chat_id: CHAT_ID,
            text: text
        });

        const options = {
            hostname: "api.telegram.org",
            path: `/bot${BOT_TOKEN}/sendMessage`,
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(data)
            }
        };

        const req = https.request(options, (res) => {
            let body = "";

            res.on("data", (chunk) => body += chunk);
            res.on("end", () => {
                console.log("📨 TG RESPONSE:", body);
                resolve(body);
            });
        });

        req.on("error", (err) => {
            console.error("❌ TG ERROR:", err);
            reject(err);
        });

        req.write(data);
        req.end();
    });
}

app.post("/click", async (req, res) => {
    console.log("🔥 CLICK RECEIVED:", req.body);

    const data = req.body || {};

    let text = "";

    if (data.event === "visit") {
        text = `📍 VISIT\n${data.url}`;
    }

    if (data.event === "messenger_click") {
        text =
`🔥 CLICK
messenger: ${data.messenger}
source: ${data.source}
campaign: ${data.campaign}
page: ${data.url}`;
    }

    try {
        await sendTelegram(text);
        return res.json({ ok: true });
    } catch (e) {
        console.error("❌ SEND FAILED:", e);
        return res.json({ ok: false });
    }
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log("🚀 SERVER STARTED");
    console.log("BOT_TOKEN:", !!BOT_TOKEN);
    console.log("CHAT_ID:", !!CHAT_ID);
});
