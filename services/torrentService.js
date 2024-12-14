import TransmissionApi from '../api/transmissionApi.js'
import moment from 'moment'
import {config} from '../config.js'

class TorrentService {
    async deleteFromTorrentClient(name, extension) {
        let canDelete = false
        let reason =  'no existe'
        const torrent = await TransmissionApi.getTorrent(name, extension)
        if (torrent) {
            const minSeconds = this._getMinSeedTime(torrent.trackers)
            canDelete = true
            if (torrent.percentComplete !== 1) {
                canDelete = false
                reason = 'descarga no completada'
            }
            if (torrent.status !== 6) {
                canDelete = false
                reason = 'no seedeando'
            }

            if (torrent.secondsSeeding < minSeconds) {
                reason = `no secondsSeeding por el tiempo suficiente (minSeconds: ${minSeconds}, startDate: ${torrent.secondsSeeding})`
                if (torrent.doneDate === 0 || !moment.unix(torrent.doneDate).isBefore(moment().subtract(minSeconds, 'seconds'))){
                    reason = `torrent sin el estado doneDate el tiempo suficiente (minSeconds: ${minSeconds}, startDate: ${torrent.startDate})`
                    if (torrent.startDate === 0 || !moment.unix(torrent.startDate).isBefore(moment().subtract(minSeconds, 'seconds'))){
                        canDelete = false
                        reason = `no ha startDate "seeding" el tiempo suficiente (minSeconds: ${minSeconds}, startDate: ${torrent.startDate})`
                    }
                }
            }

            if (canDelete) {
                reason = 'deleted'
                await TransmissionApi.deleteTorrent(torrent.id)
            }
        }
        return {deleted: canDelete, reason, torrentExists: torrent !== undefined}
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
