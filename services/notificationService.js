import TelegramApi from '../api/telegramApi.js'
import moment from "moment"
import 'moment/locale/es.js'
import {formatBytes} from "../utils/files.js";
import {MovieStatus} from "./torrentService.js";
moment.locale('es')

class NotificationService {
    async notifyUpgradedMovie(mediaMovie, dataMovie, oldDate, newSize, deleted, reason, torrentExists, tracker) {
        try {
            const message = '*Movie upgraded*: ' + mediaMovie.Name + ' (_' + dataMovie.tmdb + '_) \n' +
                '*Fecha vieja*: ' + moment(oldDate).format('DD MMMM YYYY, h:mm:ss a') + '\n' +
                '*Fecha nueva*: ' + moment(dataMovie.dateCreated).format('DD MMMM YYYY, h:mm:ss a') + '\n' +
                '*Path viejo*: `' + dataMovie.path + '`\n' +
                '*Path nuevo*: `' + mediaMovie.Path + '`\n' +
                '*Tamaño viejo*: ' + formatBytes(dataMovie.size) + '\n' +
                '*Tamaño nuevo*: ' + formatBytes(newSize) + '\n' +
                '*Archivo*: ' + (deleted ? '✔️ eliminado' : '❌ no eliminado') + '\n' +
                '*Torrent*: ' + (deleted && torrentExists ? '✔️ eliminado' : '❌ no eliminado: ' + reason) + ' ' + tracker + '\n'

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

    async notifyDeletedMovie(dataMovie, deleted, reason, torrentExists, tracker) {
        try {
            const message = '*Movie deleted*: ' + dataMovie.name + ' (_' + dataMovie.tmdb + '_) \n' +
                '*Archivo*: ' + (deleted ? '✔️ eliminado' : '❌ no eliminado') + '\n' +
                '*Torrent*: ' + (deleted && torrentExists ? '✔️ eliminado' : '❌ no eliminado: ' + reason) + ' ' + tracker + '\n'
            console.log(message)
            await TelegramApi.notify(message)
        } catch (error) {
            throw error
        }
    }

    async notifyOrphanTorrents(intents) {
        try {
            let elements = intents.sort((a, b) =>  b.deleted - a.deleted)
            if (elements.length > 10) {
                elements = elements.slice(0, 20).map(this._mapIntent.bind(this));
                elements.push('...')
            } else {
                elements = elements.map(this._mapIntent.bind(this));
            }

            const deletedTorrentsCount = intents.filter(intent => intent.deleted).length
            const message = '*(' + deletedTorrentsCount + '/' + intents.length + ') torrents eliminados*.\n' + elements.join('\n')
            console.log(message)
            await TelegramApi.notify(message)
        } catch (error) {
            throw error
        }
    }

    async notifyAVC10bitsMovies(movies){
        try {
            let results = []
            if (movies.length > 10) {
                results = movies.slice(0, 20).map(this._mapMovie.bind(this));
                results.push('...')
            } else {
                results = movies.map(this._mapMovie.bind(this));
            }

            const message = '*' + movies.length + ' movies with h264 10-bits*.\n' + results.join('\n')
            console.log(message)
            await TelegramApi.notify(message)
        } catch (error) {
            throw error
        }
    }

    async notifyAVC10bitsEpisodes(episodes){
        try {
            let results = []
            if (episodes.length > 10) {
                results = episodes.slice(0, 20).map(this._mapEpisode.bind(this));
                results.push('...')
            } else {
                results = episodes.map(this._mapEpisode.bind(this));
            }

            if (episodes.length > 0) {
                const message = '*' + episodes.length + ` episodes from ${episodes[0].SeriesName} with h264 10-bits*.
` + results.join('\n')
                console.log(message)
                await TelegramApi.notify(message)
            }
        } catch (error) {
            throw error
        }
    }

    async notifyTorrentsWithErrors(torrents) {
        try {
            let results = []
            if (torrents.length > 10) {
                results = torrents.slice(0, 20).map(this._mapTorrentWithError.bind(this));
                results.push('...')
            } else {
                results = torrents.map(this._mapTorrentWithError.bind(this));
            }

            const message = '*' + torrents.length + ' torrents con errores*.\n' + results.join('\n')
            console.log(message)
            await TelegramApi.notify(message)
        } catch (error) {
            throw error
        }
    }

    _mapIntent(intent, index) {
        return `*${index + 1}.* \`${intent.filename}\` ${intent.deleted ? '✔️' : '❌ '}${intent.deleted && intent.torrentExists ? '✔️' : ''}${!intent.deleted && intent.torrentExists ? this._mapReason(intent) : ''} ${intent.tracker}`
    }

    _mapTorrentWithError(torrent, index) {
        return `*${index + 1}.* \`${torrent.name}\` ${this._mapError(torrent.error)} ${torrent.errorString}`
    }

    _mapMovie(movie, index) {
        return `*${index + 1}.* \`${movie.Name}\``
    }

    _mapEpisode(episode, index) {
        return `*${index + 1}.* \`${episode.Name}\``
    }


    _mapError(errorType) {
        switch (errorType) {
            case 0:
                return '✔️'
            case 1:
                return '⚠️'
            case 2:
                return '❌'
            case 3:
                return  '💾'
            default:
                return ''
        }
    }

    _mapReason(intent) {
        switch (intent.reason) {
            case MovieStatus.DOWNLOAD_NOT_COMPLETED:
                return '🔻'
            case MovieStatus.NO_SEEDING:
                return '⏸️'
            case MovieStatus.INCOMPLETE_SEED_TIME:
                return '⏳'
            default:
                return ''
        }
    }
}


const notificationService = new NotificationService()
export default notificationService
