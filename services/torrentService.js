import TransmissionApi from '../api/transmissionApi.js'
import moment from 'moment'
import {config} from '../config.js'

export const MovieStatus = {
    NO_EXISTS: 'no existe',
    DOWNLOAD_NOT_COMPLETED: 'descarga incompleta',
    NO_SEEDING: 'no seedeando',
    INCOMPLETE_SEED_TIME: 'tiempo de seed incompleto',
    DELETED: 'borrado'
};

class TorrentService {
    async getTorrentsWithErrors() {
        try {
            let torrentsWithErrors = []
            const {torrents} = await TransmissionApi.getTorrents()
            for (const torrent of torrents) {
                if (torrent.error !== 0) {
                    torrentsWithErrors.push(torrent)
                }
            }
            return torrentsWithErrors
        } catch (error) {
            throw new Error(`Error getting torrents: ${error}`)
        }
    }

    async canDeleteFromTorrentClient(name, extension) {
        try {
            let canDelete = true
            let reason = MovieStatus.NO_EXISTS
            const torrent = await TransmissionApi.getTorrent(name, extension)
            if (torrent) {
                const minSeconds = this._getMinSeedTime(torrent.trackers)
                if (torrent.percentComplete !== 1) {
                    canDelete = false
                    reason = MovieStatus.DOWNLOAD_NOT_COMPLETED
                }
                if (torrent.status !== 6) {
                    canDelete = false
                    reason = MovieStatus.NO_SEEDING
                }

                if (torrent.secondsSeeding < minSeconds) {
                    if (torrent.doneDate === 0 || !moment.unix(torrent.doneDate).isBefore(moment().subtract(minSeconds, 'seconds'))){
                        if (torrent.startDate === 0 || !moment.unix(torrent.startDate).isBefore(moment().subtract(minSeconds, 'seconds'))){
                            reason = MovieStatus.INCOMPLETE_SEED_TIME
                            canDelete = false
                        }
                    }
                }
            }
            return {
                canDelete,
                reason,
                tracker : torrent?.trackers?.[0]?.sitename || '',
                torrentExists: torrent !== undefined,
                torrent: torrent
            }
        } catch (error) {
            throw new Error(`Error on checking can delete torrent ${name}${extension}: ${error}`)
        }

    }

    async deleteFromTorrentClient(name, extension = '') {
        try {
            const response = await this.canDeleteFromTorrentClient(name, extension)

            if (response.torrent && response.canDelete) {
                response.reason = MovieStatus.DELETED
                await TransmissionApi.deleteTorrent(response.torrent.id)
            }
            return {
                tracker: response.tracker,
                torrentExists: response.torrentExists,
                deleted: response.torrent && response.canDelete,
                reason: response.reason
            }
        } catch (error) {
            throw new Error(`Error deleting torrent ${name}${extension}: ${error}`)
        }

    }

    _getMinSeedTime (trackers) {
        let minSeconds = 5 * 24 * 60 * 60
        const sitename = trackers?.[0]?.sitename ?? ''
        if (sitename) {
            minSeconds = config.trackers[sitename] * 24 * 60 * 60
        }
        return minSeconds
    }
}

const torrentService = new TorrentService()
export default  torrentService
