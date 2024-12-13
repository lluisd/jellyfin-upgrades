import TelegramApi from '../api/telegramApi.js'

class NotificationService {
    async notify(mediaMovie, dataMovie, oldDate, deleted, reason) {
        try {
            const message = `Movie upgraded: ${mediaMovie.Name} (tmdb: ${dataMovie.tmdb}, imdb: ${dataMovie.imdb}) 
                    - ${oldDate} to ${dataMovie.dateCreated} - old path: ${dataMovie.path} -
                    ${deleted ? 'Torrent deleted' : 'Torrent not deleted: ' + reason}`
            console.log(message)
            await TelegramApi.notify(message)
        } catch (error) {
            throw error
        }
    }
}

const notificationService = new NotificationService()
export default notificationService
