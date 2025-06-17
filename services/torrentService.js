import { TransmissionApi } from '../api/transmissionApi.js'
import { QBittorrentApi } from '../api/qBittorrentApi.js'
import moment from 'moment'
import { config } from '../config.js'

export const MovieStatus = {
  DEFAULT: '',
  NO_EXISTS: 'no existe',
  DOWNLOAD_NOT_COMPLETED: 'descarga incompleta',
  NO_SEEDING: 'no seedeando',
  INCOMPLETE_SEED_TIME: 'tiempo de seed incompleto',
  DELETED: 'borrado'
}

class TorrentService {
  clienApi = null

  constructor() {
    const client = config.torrentClient.client
    if (client === 'transmission') {
      this.clienApi = new TransmissionApi()
    } else if (client === 'qbittorrent') {
      this.clienApi = new QBittorrentApi()
    } else {
      throw new Error(`Unsupported torrent client: ${client}`)
    }
  }

  async getTorrentsWithErrors() {
    try {
      return await this.clienApi.getTorrentsWithErrors()
    } catch (error) {
      throw new Error(`Error getting torrents: ${error}`)
    }
  }

  async canDeleteFromTorrentClient(name, extension = '', applyRenamingFn = null) {
    try {
      let canDelete = true
      let reason = MovieStatus.DEFAULT
      const torrent = await this.clienApi.getTorrent(name, extension, applyRenamingFn)
      if (torrent) {
        const minSeconds = this._getMinSeedTime(torrent.tracker)
        if (!torrent.isCompleted) {
          canDelete = false
          reason = MovieStatus.DOWNLOAD_NOT_COMPLETED
        }
        if (!torrent.isSeeding) {
          canDelete = false
          reason = MovieStatus.NO_SEEDING
        }

        if (torrent.secondsSeeding < minSeconds) {
          if (torrent.canRestSeedingOnRestart) {
            if (
              torrent.dateCompleted === 0 ||
              !moment.unix(torrent.dateCompleted).isBefore(moment().subtract(minSeconds, 'seconds'))
            ) {
              if (
                torrent.startDate === 0 ||
                !moment.unix(torrent.startDate).isBefore(moment().subtract(minSeconds, 'seconds'))
              ) {
                reason = MovieStatus.INCOMPLETE_SEED_TIME
                canDelete = false
              }
            }
          } else {
            reason = MovieStatus.INCOMPLETE_SEED_TIME
            canDelete = false
          }
        }
      } else {
        reason = MovieStatus.NO_EXISTS
      }
      return {
        canDelete,
        reason,
        tracker: torrent?.tracker ?? '',
        torrentExists: torrent !== undefined,
        torrent: torrent
      }
    } catch (error) {
      throw new Error(`Error on checking can delete torrent ${name}${extension}: ${error}`)
    }
  }

  async deleteFromTorrentClient(name, extension = '', applyRenamingFn = null) {
    try {
      const response = await this.canDeleteFromTorrentClient(name, extension, applyRenamingFn)

      if (response.torrent && response.canDelete) {
        response.reason = MovieStatus.DELETED
        await this.clienApi.deleteTorrent(response.torrent.id)
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

  _getMinSeedTime(tracker) {
    let minSeconds = 5 * 24 * 60 * 60
    if (config.trackers[tracker]) {
      minSeconds = config.trackers[tracker] * 24 * 60 * 60
    }
    return minSeconds
  }
}

const torrentService = new TorrentService()
export default torrentService
