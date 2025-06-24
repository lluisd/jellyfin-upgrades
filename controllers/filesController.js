import storageService from '../services/storageService.js'
import torrentService from '../services/torrentService.js'
import { getFilenameAndExtension, getParentFolder, hasOneParentFolder, isDirectFileName } from '../utils/files.js'
import semaphore from '../semaphore.js'
import notificationService from '../services/notificationService.js'
import { config } from '../config.js'

class FilesController {
  async removeMovieTorrents(notifyOnly = false) {
    await this._removeTorrents(true, config.torrentClient.moviesCompleteFolder, notifyOnly)
  }

  async removeSeriesTorrents(notifyOnly = false) {
    await this._removeTorrents(false, config.torrentClient.seriesCompleteFolder, notifyOnly)
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
      console.log(intents.length + ' orphan torrents')
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
}

const filesController = new FilesController()
export default filesController
