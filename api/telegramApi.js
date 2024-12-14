import TelegramBot from 'node-telegram-bot-api'
import { config} from '../config.js'

const bot = new TelegramBot(config.telegram.token, { polling: false });

async function notify(text) {
    try {
        await bot.sendMessage(config.telegram.channelId, text, { parse_mode: 'Markdown' })
    } catch (e) {
        throw new Error('Error sending telegram message ' + e, e)
    }
}

export default  {
    notify
}
