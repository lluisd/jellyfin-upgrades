import { Bot } from 'node-telegram-bot-api'
import { config } from '../config.js'

const bot = new Bot(config.telegram.token)
const MAX_MESSAGE_LENGTH = 4000

async function notify(text) {
  try {
    if (text.length <= MAX_MESSAGE_LENGTH) {
      await bot.api.sendMessage({
        chat_id: config.telegram.channelId,
        ...(config.telegram.threadId ? { message_thread_id: config.telegram.threadId } : {}),
        text,
        parse_mode: 'Markdown'
      })
    }
  } catch (e) {
    throw new Error('Error sending telegram message ' + e)
  }
}

export default {
  notify
}
