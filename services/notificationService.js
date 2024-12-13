import TelegramApi from '../api/telegramApi.js'

class NotificationService {
    async notifyUpgradedMovie(mediaMovie, dataMovie, oldDate, deleted, reason) {
        try {
            const message = `Movie upgraded: ${mediaMovie.Name} (${dataMovie.tmdb})-
                    ${oldDate} to ${dataMovie.dateCreated} - path ${dataMovie.path} to  ${mediaMovie.Path} -
                    ${deleted ? 'Torrent deleted' : 'Torrent not deleted: ' + reason}`
            console.log(message)
            await TelegramApi.notify(message)
        } catch (error) {
            throw error
        }
    }

    async notifyAddedMovie(mediaMovie, tmdb) {
        try {
            const message = `Movie added: ${mediaMovie.Name} (${tmdb}) - date: ${mediaMovie.DateCreated} - path: ${mediaMovie.Path}`
            console.log(message)
            await TelegramApi.notify(message)
        } catch (error) {
            throw error
        }
    }
}

const notificationService = new NotificationService()
export default notificationService
