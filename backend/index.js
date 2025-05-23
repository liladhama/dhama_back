require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

if (!BOT_TOKEN || !WEBHOOK_URL) {
  console.error('⚠️ Ошибка: в .env должны быть указаны BOT_TOKEN и WEBHOOK_URL');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

console.log('🚀 Bot instance created, BOT_TOKEN is set:', !!BOT_TOKEN);

(async () => {
  try {
    const webhookPath = '/webhook';
    await bot.telegram.setWebhook(WEBHOOK_URL.replace(/\/$/, '') + webhookPath);
    console.log('✔️ Вебхук установлен:', WEBHOOK_URL + webhookPath);
  } catch (err) {
    console.error('❌ Не удалось установить вебхук:', err);
  }
})();

const app = express();
app.use(express.json());

app.post('/webhook', (req, res) => {
  console.log('🔥 /webhook got:', req.body);
  bot.handleUpdate(req.body)
    .then(() => res.sendStatus(200))
    .catch(err => {
      console.error('❌ bot.handleUpdate error', err);
      res.sendStatus(500);
    });
});

const FRONTEND_URL = process.env.FRONTEND_URL;

bot.command('start', ctx => {
  console.log('>>> RECEIVED /start from', ctx.from.username, ctx.from.id);
  return ctx.reply('Добро пожаловать в DHAMA', {
    reply_markup: {
      inline_keyboard: [[
        { text: 'Открыть приложение', web_app: { url: FRONTEND_URL } }
      ]]
    }
  });
});

bot.on('web_app_data', ctx => {
  const data = JSON.parse(ctx.update.web_app_data.data);
  ctx.reply(`Бот получил данные: ${JSON.stringify(data)}`);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🌐 Сервер слушает порт ${PORT}`);
});
