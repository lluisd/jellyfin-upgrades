import { config } from '../config.js'
import { QBittorrent, TorrentState } from '@ctrl/qbittorrent'

export class QBittorrentApi {
  client = null

  constructor() {
    this.client = new QBittorrent({
      baseUrl: `http://${config.torrentClient.host}:${config.torrentClient.port}`,
      username: config.torrentClient.username,
      password: config.torrentClient.password
    })
  }

  async getTorrent(name, extension, applyRenamingFn = null) {
    try {
      const apiResponse = await this.client.listTorrents({
        includeTrackers: true
      })

      const torrent = apiResponse.find((torrent) => {
        let torrentName = torrent.name
        if (applyRenamingFn) {
          torrentName = applyRenamingFn(torrent.name)
        }
        return torrentName === `${name}${extension}` || torrentName === name
      })

      if (torrent) {
        return {
          id: torrent.hash,
          name: torrent.name,
          secondsSeeding: torrent.seeding_time,
          tracker: this._getSiteName(torrent.tracker),
          //dateCompleted: torrent.completion_on,
          isSeeding:
            torrent.state === TorrentState.ForcedUP ||
            torrent.state === TorrentState.Uploading ||
            torrent.state === TorrentState.StalledUP,
          isCompleted: torrent.progress === 1,
          canRestSeedingOnRestart: true
        }
      }
    } catch (error) {
      throw new Error(`Error getting torrent ${name}${extension}: ${error}`)
    }
  }

  _getSiteName(url) {
    try {
      const hostname = new URL(url).hostname
      return hostname.split('.')[0] || ''
    } catch {
      return ''
    }
  }

  async getTorrentsWithErrors() {
    try {
      let torrentsWithErrors = []

      let torrents = await this.client.listTorrents({
        includeTrackers: true
      })

      for (const torrent of torrents) {
        if (torrent.state === TorrentState.Error || torrent.state === TorrentState.MissingFiles) {
          const errorDetails = {
            id: torrent.hash,
            name: torrent.name,
            error: torrent.state === TorrentState.Error ? 2 : 1,
            errorString: torrent.state
          }
          torrentsWithErrors.push(errorDetails)
        }
      }

      return torrentsWithErrors
    } catch (error) {
      throw new Error(`Error getting torrents: ${error}`)
    }
  }

  async deleteTorrent(id) {
    try {
      return await this.client.removeTorrent(id, true)
    } catch (error) {
      throw new Error(`Error deleting torrent ${id}: ${error}`)
    }
  }
}
