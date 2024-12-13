import TransmissionApi from '../api/transmissionApi.js'
import moment from 'moment'
import {config} from '../config.js'

class TorrentService {
    async deleteFromTorrentClient(name, extension) {
        let canDelete = false
        let reason =  'dont exist'
        const torrent = await TransmissionApi.getTorrent(name, extension)
        if (torrent) {
            const minSeconds = this._getMinSeedTime(torrent.trackers)
            canDelete = true
            if (torrent.percentComplete !== 1) {
                canDelete = false
                reason = 'download no completed'
            }
            if (torrent.status !== 6) {
                canDelete = false
                reason = 'not seeding'
            }

            if (torrent.secondsSeeding < minSeconds) {
                reason = `not seeding for enough time (minSeconds: ${minSeconds}, secondsSeeding: ${torrent.secondsSeeding})`
                if (torrent.doneDate === 0 || !moment.unix(torrent.doneDate).isBefore(moment().subtract(minSeconds, 'seconds'))){
                    reason = `torrent not in done state for enough time (minSeconds: ${minSeconds}, startDate: ${torrent.startDate})`
                    if (torrent.startDate === 0 || !moment.unix(torrent.startDate).isBefore(moment().subtract(minSeconds, 'seconds'))){
                        canDelete = false
                        reason = `not started "seeding" for enough time (minSeconds: ${minSeconds}, startDate: ${torrent.startDate})`
                    }
                }
            }

            if (canDelete) {
                reason = 'deleted'
                await TransmissionApi.deleteTorrent(torrent.id)
            }
        }
        return {deleted: canDelete, reason, exists: torrent !== undefined}
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
