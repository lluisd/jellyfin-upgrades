import TelegramApi from '../api/telegramApi.js'
import moment from "moment"
import 'moment/locale/es.js'
import {formatBytes} from "../utils/files.js";
moment.locale('es')

class NotificationService {
    async notifyUpgradedMovie(mediaMovie, dataMovie, oldDate, newSize, deleted, reason, torrentExists) {
        try {
            const message = '*Movie upgraded*: ' + mediaMovie.Name + ' (_' + dataMovie.tmdb + '_) \n' +
                '*Fecha vieja*: ' + moment(oldDate).format('DD MMMM YYYY, h:mm:ss a') + '\n' +
                '*Fecha nueva*: ' + moment(dataMovie.dateCreated).format('DD MMMM YYYY, h:mm:ss a') + '\n' +
                '*Path viejo*: `' + dataMovie.path + '`\n' +
                '*Path nuevo*: `' + mediaMovie.Path + '`\n' +
                '*Tamaño viejo*: ' + formatBytes(dataMovie.size) + '\n' +
                '*Tamaño nuevo*: ' + formatBytes(newSize) + '\n' +
                '*Archivo*: ' + (deleted ? '✔️ eliminado' : '❌ no eliminado') + '\n' +
                '*Torrent*: ' + (deleted && torrentExists ? '✔️ eliminado' : '❌ no eliminado: ' + reason) + '\n'

            console.log(message)
            await TelegramApi.notify(message)
        } catch (error) {
            throw error
        }
    }

    async notifyAddedMovie(mediaMovie, tmdb) {
        try {
            const message = '*Movie added*: ' + mediaMovie.Name + ' (_' + tmdb + '_) \n' +
                '*Fecha*: ' + moment(mediaMovie.DateCreated).format('DD MMMM YYYY, h:mm:ss a') + '\n' +
                '*Path*: `' + mediaMovie.Path + '`\n'
            console.log(message)
            await TelegramApi.notify(message)
        } catch (error) {
            throw error
        }
    }

    async notifyOrphanTorrents(filenames) {
        try {
            let elements = filenames
            if (filenames.length > 20) {
                elements = filenames.slice(0, 20).map((filename, index) => `*${index + 1}.* \`${filename}\``);
                elements.push('...')
            } else {
                elements = filenames.map(filename => `\`${filename}\``);
            }

            const message = '* ' + filenames.length + ' orphan torrents*:\n ' + elements.join('\n')
            console.log(message)
            await TelegramApi.notify(message)
        } catch (error) {
            throw error
        }
    }
}

const notificationService = new NotificationService()
export default notificationService
