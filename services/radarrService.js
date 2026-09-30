import ArrNamingService from '../services/arrNamingService.js'
import arrApi from '../api/arrApi.js'
import { config } from '../config.js'

class RadarrService extends ArrNamingService {
  constructor() {
    super(config.radarr)
  }

  async getMovies() {
    const movies = await arrApi.getMovies(this.config)

    return movies.map((movie) => ({
      tmdbId: movie.tmdbId,
      imdbId: movie.imdbId,
      hasFile: movie.hasFile,
      title: movie.title
    }))
  }

  // Returns the torrent hash of the file being replaced on an upgrade, using Radarr's import history.
  // File names are not compared (torrent, Radarr and Jellyfin names can differ): the newest import is
  // the new file and the latest import from a different download is the replaced one.
  async getPreviousDownloadHash(tmdb, imdb) {
    const movie = await this._findMovie(tmdb, imdb)
    if (!movie) return null

    const history = await arrApi.getMovieImportHistory(this.config, movie.id)
    const imports = [...(history ?? [])].sort((a, b) => new Date(b.date ?? 0) - new Date(a.date ?? 0))
    if (imports.length < 2) return null

    // Safety: the newest import must be Radarr's current file, otherwise the order can't be trusted
    const currentFileId = movie.movieFile?.id
    if (currentFileId == null || String(imports[0].data?.fileId) !== String(currentFileId)) return null

    const newHash = imports[0].downloadId?.toLowerCase()
    // A manual import (no downloadId) as previous record stops the search, so an older torrent is never removed
    const previousImport = imports.slice(1).find((record) => !newHash || record.downloadId?.toLowerCase() !== newHash)
    return previousImport?.downloadId?.toLowerCase() ?? null
  }

  async _findMovie(tmdb, imdb) {
    if (tmdb) {
      return await arrApi.getMovieByTmdb(this.config, tmdb)
    }
    if (imdb) {
      const movies = await arrApi.getMovies(this.config)
      return movies.find((movie) => movie.imdbId === imdb) ?? null
    }
    return null
  }
}

const radarrService = new RadarrService()
export default radarrService
