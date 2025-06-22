import mediaService from '../services/mediaService.js'
import semaphore from '../semaphore.js'
import { config } from '../config.js'
import { exists } from '../utils/files.js'

class ConfigController {
  async checkJellyfinLibraries() {
    const [value, release] = await semaphore.acquire()
    try {
      let hasMoviesLibrary = false
      let hasSeriesLibrary = false
      const libraries = await mediaService.getLibraries()
      for (const library of libraries) {
        const { Name, Id } = library
        if (config.jellyfin.moviesLibraryId && Id === config.jellyfin.moviesLibraryId) {
          console.log(`Movies library found: ${Name} (${Id})`)
          hasMoviesLibrary = true
        } else if (config.jellyfin.seriesLibraryId && Id === config.jellyfin.seriesLibraryId) {
          console.log(`TV Shows library found: ${Name} (${Id})`)
          hasSeriesLibrary = true
        } else {
          console.warn(`Unknown library found: ${Name} (${Id})`)
        }
      }
      if (!hasMoviesLibrary) {
        console.error('No movies library found in Jellyfin. Please check your configuration.')
      }
      if (!hasSeriesLibrary) {
        console.error('No TV Shows library found in Jellyfin. Please check your configuration.')
      }
    } catch (error) {
      throw error
    } finally {
      release()
    }
  }

  async checkTorrentFolders() {
    const [value, release] = await semaphore.acquire()
    try {
      const { moviesCompleteFolder, seriesCompleteFolder } = config.torrentClient
      if (!moviesCompleteFolder || !seriesCompleteFolder) {
        console.error('Torrent client folders are not configured. Please check your configuration.')
        return
      }
      const moviesCompleteFolderExists = await exists(moviesCompleteFolder)
      if (!moviesCompleteFolderExists) {
        console.error(`Movies complete folder does not exist: ${moviesCompleteFolder}`)
      }
      const seriesCompleteFolderExists = await exists(seriesCompleteFolder)
      if (!seriesCompleteFolderExists) {
        console.error(`TV Shows complete folder does not exist: ${seriesCompleteFolder}`)
      }

      if (moviesCompleteFolderExists && seriesCompleteFolderExists) {
        console.log(`Torrent client folders are correctly configured.`)
      }
    } catch (error) {
      throw error
    } finally {
      release()
    }
  }
}

const configController = new ConfigController()
export default configController
