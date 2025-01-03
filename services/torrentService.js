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
    async deleteFromTorrentClient(name, extension) {
        try {
            let canDelete = false
            let reason = MovieStatus.NO_EXISTS
            const torrent = await TransmissionApi.getTorrent(name, extension)
            if (torrent) {
                const minSeconds = this._getMinSeedTime(torrent.trackers)
                canDelete = true
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

                if (canDelete) {
                    reason = MovieStatus.DELETED
                    await TransmissionApi.deleteTorrent(torrent.id)
                }
            }
            return {
                deleted: canDelete,
                reason,
                torrentExists: torrent !== undefined,
                tracker : torrent?.trackers?.[0]?.sitename || ''
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
