import storageService from '../services/storageService.js'
import torrentService, { TorrentStatus } from '../services/torrentService.js'
import mediaService from '../services/mediaService.js'
import dataService from '../services/dataService.js'
import notificationService from '../services/notificationService.js'
import radarrService from '../services/radarrService.js'
import { getFilenameAndExtension, stripArrIdTags } from '../utils/files.js'
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

  async updateMovie(id, tmdb, imdb, tvdb, jellyfinName, notifyOnly = false) {
    const [value, release] = await semaphore.acquire()
    try {
      let response = 'nothing'
      console.log(`upgrading movie: ${id} ${jellyfinName} (tmdb: ${tmdb}, imdb: ${imdb}, tvdb: ${tvdb})`)

      const dataMovie = await dataService.getMovie(tmdb, imdb, tvdb)
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
        await dataService.updateMoviePathAndSize(tmdb, imdb, tvdb, mediaMovie.Path, newSize)
        const hash = await this._getPreviousDownloadHash(tmdb, imdb)
        console.log(`${id}: previous torrent hash from Radarr: ${hash ?? 'not found'}`)

        const { deleted, reason, torrentExists, tracker } = notifyOnly
          ? { ...(await torrentService.canDeleteTorrentByHash(hash)), deleted: false, reason: TorrentStatus.DEFAULT }
          : await torrentService.deleteTorrentByHash(hash)

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

        response = `Movie upgraded: ${mediaMovie.Name} (tmdb: ${tmdb}, imdb: ${imdb}, tvdb: ${tvdb})`
        console.log(response)
      } else if (mediaMovie && !dataMovie) {
        console.log('Creating: Movie not found in dataMovie but found in jellyfin')
        await dataService.addMovie(mediaService.createMovie(mediaMovie))

        await notificationService.notifyAddedMovie(mediaMovie, tmdb)
        response = `Movie created: ${mediaMovie.Name} (tmdb: ${tmdb}, imdb: ${imdb}. tvdb: ${tvdb})`
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

  async notifyMoviesNotInRadarr() {
    const [value, release] = await semaphore.acquire()
    try {
      if (!config.radarr.url) {
        console.log('Radarr not configured, skipping Radarr tracking check')
        return []
      }

      console.log('Checking movies not properly tracked by Radarr')
      const jellyfinMovies = await mediaService.getMovies()
      const radarrMovies = await radarrService.getMovies()

      const untrackedMovies = jellyfinMovies.filter((movie) => {
        const tmdb = movie?.ProviderIds?.Tmdb
        const imdb = movie?.ProviderIds?.Imdb
        const radarrMovie = radarrMovies.find(
          (rMovie) => (tmdb && rMovie.tmdbId?.toString() === tmdb) || (imdb && rMovie.imdbId === imdb)
        )
        return !radarrMovie || !radarrMovie.hasFile
      })

      console.log(untrackedMovies.length + ' movies not properly tracked by Radarr')
      await notificationService.notifyMoviesNotInRadarr(untrackedMovies)
      return untrackedMovies
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

      const { name: libraryName, extension } = getFilenameAndExtension(dataMovie.path)
      const name = stripArrIdTags(libraryName)
      if (config.radarr.url) await radarrService.loadNamingConfig()
      let { deleted, reason, torrentExists, tracker } = await torrentService.deleteFromTorrentClient(
        name,
        extension,
        config.radarr.url ? radarrService.applyRenaming.bind(radarrService) : null
      )
      if (!torrentExists) {
        deleted = await storageService.removeFileOrFolder(name, extension, config.torrentClient.moviesFolder)
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

  async _getPreviousDownloadHash(tmdb, imdb) {
    if (!config.radarr.url) return null
    try {
      return await radarrService.getPreviousDownloadHash(tmdb, imdb)
    } catch (error) {
      console.log(`Error getting previous torrent hash from Radarr: ${error}`)
      return null
    }
  }
}

const moviesController = new MoviesController()
export default moviesController
