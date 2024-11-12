import { Client, GatewayIntentBits } from 'discord.js';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Создание клиента Discord
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

// Функция для получения данных о воздушных тревогах
async function fetchAirRaidAlerts() {
  try {
    const response = await axios.get('https://api.alerts.in.ua/v1/alerts/active.json', {
      headers: {
        Authorization: `Bearer ${process.env.ALERTS_API_TOKEN}`,
      },
    });
    return response.data.alerts;
  } catch (error) {
    console.error('Failed to fetch alerts:', error.message);
    return null;
  }
}

// Функция для отправки уведомлений в канал
async function sendAlertIfActive() {
  const alerts = await fetchAirRaidAlerts();
  if (alerts) {
    const activeAlerts = alerts.filter((alert) => alert.status === 'active');
    const inactiveAlerts = alerts.filter((alert) => alert.status === 'inactive');

    client.guilds.cache.forEach(async (guild) => {
      const alertChannel = guild.channels.cache.find(
        (channel) => channel.name === process.env.ALERT_CHANNEL_NAME
      );

      if (alertChannel) {
        activeAlerts.forEach((alert) => {
          alertChannel.send(`🚨 Air Raid Alert in ${alert.region}! Please take shelter. 🚨`);
        });

        inactiveAlerts.forEach((alert) => {
          alertChannel.send(`✅ Air Raid Alert for ${alert.region} has ended. Stay safe.`);
        });
      } else {
        console.log(`Channel "${process.env.ALERT_CHANNEL_NAME}" not found in guild ${guild.name}`);
      }
    });
  }
}

// Запуск бота
client.once('ready', () => {
  console.log('Air Raid Alert bot is online.');
  setInterval(sendAlertIfActive, 60000); // Проверка каждые 60 секунд
});

client.login(process.env.DISCORD_BOT_TOKEN);
