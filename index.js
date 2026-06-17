const TelegramBot = require('node-telegram-bot-api');

const TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = -5473275880;

const bot = new TelegramBot(TOKEN, { polling: true });

let stats = {
  Telegram: 0,
  WhatsApp: 0,
  MAX: 0,
  yandex: 0,
  seo: 0,
  direct: 0
};

function parse(text) {
  if (!text) return;

  if (text.includes('👉 Telegram')) stats.Telegram++;
  if (text.includes('👉 WhatsApp')) stats.WhatsApp++;
  if (text.includes('👉 MAX')) stats.MAX++;

  if (text.includes('yandex')) stats.yandex++;
  if (text.includes('seo')) stats.seo++;
  if (text.includes('direct')) stats.direct++;
}

bot.on('message', (msg) => {
  if (msg.chat.id !== CHAT_ID) return;
  parse(msg.text);
});

setInterval(() => {
  const now = new Date();

  if (now.getHours() === 21 && now.getMinutes() === 0) {

    bot.sendMessage(CHAT_ID,
      `📊 ОТЧЁТ ЗА ДЕНЬ\n\n` +
      `Telegram: ${stats.Telegram}\n` +
      `WhatsApp: ${stats.WhatsApp}\n` +
      `MAX: ${stats.MAX}\n\n` +
      `Yandex: ${stats.yandex}\n` +
      `SEO: ${stats.seo}\n` +
      `Direct: ${stats.direct}`
    );

    stats = {
      Telegram: 0,
      WhatsApp: 0,
      MAX: 0,
      yandex: 0,
      seo: 0,
      direct: 0
    };
  }
}, 60000);
