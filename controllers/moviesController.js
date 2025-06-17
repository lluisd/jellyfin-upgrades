import storageService from '../services/storageService.js'
import torrentService, { MovieStatus } from '../services/torrentService.js'
import mediaService from '../services/mediaService.js'
import dataService from '../services/dataService.js'
import notificationService from '../services/notificationService.js'
import radarrNamingService from '../services/radarrNamingService.js'
import { getFilenameAndExtension } from '../utils/files.js'
import semaphore from '../semaphore.js'
import { config } from '../config.js'

class MoviesController {
  async refreshMovies() {
    const [value, release] = await semaphore.acquire()
    try {
      console.log('Refreshing movies')

      let movies = []
      const items = await mediaService.getMovies()
      if (items.length > 0) {
        await dataService.clearMovies()
        for (const item of items) {
          movies.push(mediaService.createMovie(item))
        }
        await dataService.addMovies(movies)
      }

      console.log(movies.length + ' Refreshed movies')
      return movies
    } catch (error) {
      throw error
    } finally {
      release()
    }
  }

  async updateMovie(id, tmdb, imdb, jellyfinName, notifyOnly = false) {
    const [value, release] = await semaphore.acquire()
    try {
      let response = 'nothing'
      console.log(`upgrading movie: ${id} ${jellyfinName} (tmdb: ${tmdb}, imdb: ${imdb})`)

      const dataMovie = await dataService.getMovie(tmdb, imdb)
      const mediaMovie = await mediaService.getMovie(id)
      const isSameMovie = mediaMovie?.Id === dataMovie?.jellyfinId

      console.log(
        `${id}: isSameMovie: ${isSameMovie} mediaMovieId: ${mediaMovie?.Id} dataMovieId: ${dataMovie?.jellyfinId}`
      )

      if (mediaMovie && dataMovie && !isSameMovie) {
        console.log('Upgrading: Movie already exists in database and jellyfin but it is not the same file')
        const oldDate = mediaMovie.DateCreated
        await mediaService.updateDateCreated(mediaMovie, dataMovie.dateCreated)

        const newSize = mediaMovie?.MediaSources?.reduce((acc, source) => acc + source?.Size || 0, 0) ?? 0
        await dataService.updatePathAndSize(tmdb, imdb, mediaMovie.Path, newSize)
        const { name, extension } = getFilenameAndExtension(dataMovie.path)
        await radarrNamingService.loadNamingConfig()
        let deleted = false
        let reason = MovieStatus.DEFAULT
        let torrentExists
        let tracker
        if (notifyOnly) {
          const canDeleteResponse = await torrentService.canDeleteFromTorrentClient(
            name,
            extension,
            radarrNamingService.applyRenaming
          )
          torrentExists = canDeleteResponse.torrentExists
          tracker = canDeleteResponse.tracker
        } else {
          const deleteResponse = await torrentService.deleteFromTorrentClient(
            name,
            extension,
            radarrNamingService.applyRenaming
          )
          deleted = deleteResponse.deleted
          reason = deleteResponse.reason
          torrentExists = deleteResponse.torrentExists
          tracker = deleteResponse.tracker
          if (!torrentExists) {
            deleted = await storageService.removeFileOrFolder(
              name,
              extension,
              config.torrentClient.moviesCompleteFolder
            )
          }
        }

        await notificationService.notifyUpgradedMovie(
          mediaMovie,
          dataMovie,
          oldDate,
          newSize,
          deleted,
          reason,
          torrentExists,
          tracker
        )

        response = `Movie upgraded: ${mediaMovie.Name} (tmdb: ${tmdb}, imdb: ${imdb})`
        console.log(response)
      } else if (mediaMovie && !dataMovie) {
        console.log('Creating: Movie not found in dataMovie but found in jellyfin')
        await dataService.addMovie(mediaService.createMovie(mediaMovie))

        await notificationService.notifyAddedMovie(mediaMovie, tmdb)
        response = `Movie created: ${mediaMovie.Name} (tmdb: ${tmdb}, imdb: ${imdb})`
        console.log(response)
      } else {
        console.log('Movie not found in jellyfin neither in database')
      }
      return response
    } catch (error) {
      throw error
    } finally {
      release()
    }
  }

  async notifyAVCMoviesWith10bits() {
    const [value, release] = await semaphore.acquire()
    try {
      console.log('Checking movies with AVC 10-bits')
      const movies = await mediaService.getAVC10bitsMovies()
      await notificationService.notifyAVC10bitsMovies(movies)
      console.log(movies.length + ' movies with AVC 10-bits')
      return movies
    } catch (error) {
      throw error
    } finally {
      release()
    }
  }

  async deleteMovie(id, tmdb, imdb, jellyfinName) {
    const [value, release] = await semaphore.acquire()
    try {
      let response = 'nothing'
      console.log(`deleting movie: ${id} ${jellyfinName} (tmdb: ${tmdb}, imdb: ${imdb})`)

      const dataMovie = await dataService.getMovieByJellyfinId(id)

      const { name, extension } = getFilenameAndExtension(dataMovie.path)
      let { deleted, reason, torrentExists, tracker } = await torrentService.deleteFromTorrentClient(name, extension)
      if (!torrentExists) {
        deleted = await storageService.removeFileOrFolder(name, extension, config.torrentClient.moviesCompleteFolder)
      }

      await dataService.deleteMovie(id)
      await notificationService.notifyDeletedMovie(dataMovie, deleted, reason, torrentExists, tracker)

      response = `Movie deleted: ${dataMovie.name} (id: ${id}, tmdb: ${tmdb}, imdb: ${imdb})`
      console.log(response)
      return response
    } catch (error) {
      throw error
    } finally {
      release()
    }
  }
}

const moviesController = new MoviesController()
export default moviesController
