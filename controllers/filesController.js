import storageService from '../services/storageService.js'
import torrentService from '../services/torrentService.js'
import { getFilenameAndExtension, getParentFolder, hasOneParentFolder, isDirectFileName } from '../utils/files.js'
import semaphore from '../semaphore.js'
import notificationService from '../services/notificationService.js'
import { config } from '../config.js'
import dataService from '../services/dataService.js'
import orphan from '../models/orphan.js'

class FilesController {
  async removeMovieTorrents(notifyOnly = false) {
    await this._removeTorrents(true, config.torrentClient.moviesFolder, notifyOnly)
  }

  async removeSeriesTorrents(notifyOnly = false) {
    await this._removeTorrents(false, config.torrentClient.seriesFolder, notifyOnly)
  }

  async _removeTorrents(isMovie, rootFolder, notifyOnly) {
    const [value, release] = await semaphore.acquire()
    try {
      console.log('removing orphan torrents')
      const files = await storageService.getFilesWithoutHardlinks(rootFolder)

      let intents = []
      for (const filename of files) {
        const { name, extension } = getFilenameAndExtension(filename)
        let deleted = false
        let torrentResult = {}
        if (isDirectFileName(filename)) {
          if (notifyOnly) {
            torrentResult = await torrentService.canDeleteFromTorrentClient(name, extension)
          } else {
            torrentResult = await torrentService.deleteFromTorrentClient(name, extension)
            deleted = torrentResult.deleted
            if (!torrentResult.torrentExists) {
              deleted = await storageService.removeFile(filename, rootFolder)
            }
          }
        } else if (isMovie && hasOneParentFolder(filename)) {
          const folderName = getParentFolder(filename)
          if (notifyOnly) {
            torrentResult = await torrentService.canDeleteFromTorrentClient(folderName, extension)
          } else {
            torrentResult = await torrentService.deleteFromTorrentClient(folderName)
            deleted = torrentResult.deleted
            if (!torrentResult.torrentExists) {
              deleted = await storageService.removeFolder(folderName, rootFolder)
            }
          }
        } else {
          const folderName = getParentFolder(filename)
          torrentResult = await torrentService.canDeleteFromTorrentClient(folderName)
          if (!notifyOnly && torrentResult.canDelete) {
            deleted = await storageService.removeFolder(folderName, rootFolder)
          }
        }
        intents.push({
          filename,
          deleted,
          reason: torrentResult?.reason,
          torrentExists: torrentResult?.torrentExists,
          tracker: torrentResult?.tracker
        })
      }
      console.log(orphan.length + ' orphan torrents')
      await notificationService.notifyOrphanTorrents(intents, isMovie, notifyOnly)
      return files
    } catch (error) {
      throw error
    } finally {
      release()
    }
  }

  async notifyTorrentsWithErrors() {
    const [value, release] = await semaphore.acquire()
    try {
      console.log('checking torrents with errors')
      const torrents = await torrentService.getTorrentsWithErrors()

      console.log(torrents.length + ' torrents with errors')
      await notificationService.notifyTorrentsWithErrors(torrents)
      return torrents
    } catch (error) {
      throw error
    } finally {
      release()
    }
  }

  async notifyOrphanMovieFiles() {
    await this._notifyOrphanFiles(config.torrentClient.moviesFolder, true)
  }

  async notifyOrphanSeriesFiles() {
    await this._notifyOrphanFiles(config.torrentClient.seriesFolder, false)
  }

  async _notifyOrphanFiles(rootFolder, isMovie) {
    const [value, release] = await semaphore.acquire()
    try {
      console.log('checking orphan files')
      const files = await storageService.getAllFiles(rootFolder)

      const filesDetails = []
      for (const filename of files) {
        const { name, extension } = getFilenameAndExtension(filename)
        filesDetails.push({
          name,
          extension
        })
      }

      const torrentsNames = await torrentService.getAllTorrents()

      const orphanFiles = filesDetails
        .filter((file) => {
          return !torrentsNames.some(
            (torrentName) => torrentName === `${file.name}${file.extension}` || torrentName === file.name
          )
        })
        .map((matchedFile) => {
          return {
            name: matchedFile.extension ? matchedFile.name + matchedFile.extension : matchedFile.name,
            isMovie: isMovie
          }
        })

      await dataService.clearOrphans(isMovie)
      await dataService.addOrphans(orphanFiles)

      console.log(orphanFiles.length + (isMovie ? 'movie' : 'series') + ' orphan files')
      await notificationService.notifyOrphanTorrents(orphanFiles, isMovie)
      return orphanFiles
    } catch (error) {
      throw error
    } finally {
      release()
    }
  }
}

const filesController = new FilesController()
export default filesController
