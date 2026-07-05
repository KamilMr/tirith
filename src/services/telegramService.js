let discoveredChatId = null;

const telegramService = {
  isConfigured: () => Boolean(process.env.TELEGRAM_BOT_TOKEN),

  getChatId: async () => {
    if (process.env.TELEGRAM_CHAT_ID) return process.env.TELEGRAM_CHAT_ID;
    if (discoveredChatId) return discoveredChatId;

    const response = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getUpdates`,
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Telegram chat auto-discovery failed: ${body}`);
    }

    const body = await response.json();
    const updates = body.result || [];
    const latestUpdate = updates
      .slice()
      .reverse()
      .find(update => update.message?.chat?.id);

    if (!latestUpdate) {
      throw new Error(
        'Telegram chat auto-discovery failed. Open your bot in Telegram and send /start first.',
      );
    }

    discoveredChatId = latestUpdate.message.chat.id;
    return discoveredChatId;
  },

  sendMessage: async message => {
    if (!telegramService.isConfigured()) return {skipped: true};
    if (typeof fetch !== 'function') return {skipped: true};

    const chatId = await telegramService.getChatId();
    const response = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
        }),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Telegram notification failed: ${body}`);
    }

    return response.json();
  },

  sendMessageSafe: async message => {
    try {
      return await telegramService.sendMessage(message);
    } catch (error) {
      console.error(error.message);
      return {error};
    }
  },
};

export default telegramService;
