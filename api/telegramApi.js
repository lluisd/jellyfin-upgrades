import TelegramBot from 'node-telegram-bot-api'
import { config} from '../config.js'

const bot = new TelegramBot(config.telegram.token, { polling: false });
const MAX_MESSAGE_LENGTH = 4000;

async function notify(text) {
    try {
        if (text.length <= MAX_MESSAGE_LENGTH) {
            await bot.sendMessage(config.telegram.channelId, text, { parse_mode: 'Markdown' });
        }
    } catch (e) {
        throw new Error('Error sending telegram message ' + e)
    }
}

export default  {
    notify
}
