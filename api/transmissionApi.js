import { config } from '../config.js'
import Transmission from 'transmission-promise'

export class TransmissionApi {
  client = null

  constructor() {
    this.client = new Transmission({
      host: config.torrentClient.host,
      port: config.torrentClient.port,
      username: config.torrentClient.username,
      password: config.torrentClient.password
    })
  }

  async getTorrent(name, extension, applyRenamingFn = null) {
    try {
      const apiResponse = await this.client.get(false, [
        'id',
        'name',
        'secondsSeeding',
        'trackers',
        'startDate',
        'doneDate',
        'status',
        'percentComplete'
      ])

      const torrent = apiResponse.torrents.find((torrent) => {
        let torrentName = torrent.name
        if (applyRenamingFn) {
          torrentName = applyRenamingFn(torrent.name)
        }
        return torrentName === `${name}${extension}` || torrentName === name
      })

      if (torrent) {
        return {
          id: torrent.hashString,
          name: torrent.name,
          secondsSeeding: torrent.secondsSeeding,
          tracker: torrent?.trackers?.[0]?.sitename || '',
          startDate: torrent.startDate,
          dateCompleted: torrent.doneDate,
          isSeeding: torrent.status === 6,
          isCompleted: torrent.percentComplete === 1,
          canRestSeedingOnRestart: true
        }
      }
    } catch (error) {
      throw new Error(`Error getting torrent ${name}${extension}: ${error}`)
    }
  }

  async getTorrentsWithErrors() {
    try {
      let torrentsWithErrors = []
      const { torrents } = await this.client.get(false, [
        'hashString',
        'name',
        'trackers',
        'status',
        'error',
        'errorString'
      ])
      for (const torrent of torrents) {
        if (torrent.error !== 0) {
          const errorDetails = {
            id: torrent.hashString,
            name: torrent.name,
            error: torrent.error,
            errorString: torrent.errorString
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
      return await this.client.remove(id, true)
    } catch (error) {
      throw new Error(`Error deleting torrent ${id}: ${error}`)
    }
  }
}
