import { KnexApi } from '../api/knexApi.js'

class DataService {
  dbApi = null

  constructor() {
    this.dbApi = new KnexApi()
  }

  async init() {
    await this.dbApi.init()
  }

  async clearMovies() {
    try {
      await this.dbApi.clearMovies()
    } catch (error) {
      throw error
    }
  }

  async clearEpisodes() {
    try {
      await this.dbApi.clearEpisodes()
    } catch (error) {
      throw error
    }
  }

  async clearOrphans(isMovie) {
    try {
      await this.dbApi.clearOrphans(isMovie)
    } catch (error) {
      throw error
    }
  }

  async addMovies(movies) {
    try {
      await this.dbApi.addMovies(movies)
    } catch (error) {
      throw error
    }
  }

  async addEpisodes(episodes) {
    try {
      await this.dbApi.addEpisodes(episodes)
    } catch (error) {
      throw error
    }
  }

  async addOrphans(orphans) {
    try {
      await this.dbApi.addOrphans(orphans)
    } catch (error) {
      throw error
    }
  }

  async addMovie(movie) {
    try {
      await this.dbApi.addMovie(movie)
    } catch (error) {
      throw error
    }
  }

  async addEpisode(movie) {
    try {
      await this.dbApi.addEpisode(movie)
    } catch (error) {
      throw error
    }
  }

  async getMovie(tmdb, imdb, tvdb) {
    try {
      return await this.dbApi.getMovie(tmdb, imdb, tvdb)
    } catch (error) {
      throw error
    }
  }

  async getEpisode(tmdb, imdb, tvdb) {
    try {
      return await this.dbApi.getEpisode(tmdb, imdb, tvdb)
    } catch (error) {
      throw error
    }
  }

  async getMovieByJellyfinId(jellyfinId) {
    try {
      return await this.dbApi.getMovieByJellyfinId(jellyfinId)
    } catch (error) {
      throw error
    }
  }

  async deleteMovie(jellyfinId) {
    try {
      return await this.dbApi.deleteMovie(jellyfinId)
    } catch (error) {
      throw error
    }
  }

  async updateMoviePathAndSize(tmdb, imdb, tvdb, path, size) {
    try {
      return await this.dbApi.updateMovie(tmdb, imdb, tvdb, { path: path, size: size })
    } catch (error) {
      throw error
    }
  }

  async updateEpisodePathAndSize(tmdb, imdb, tvdb, path, size) {
    try {
      return await this.dbApi.updateEpisode(tmdb, imdb, tvdb, { path: path, size: size })
    } catch (error) {
      throw error
    }
  }
}

const dataService = new DataService()
export default dataService
