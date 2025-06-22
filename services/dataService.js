import { MongoApi } from '../api/mongoApi.js'
import { config } from '../config.js'
import { SQLiteApi } from '../api/sqliteApi.js'

class DataService {
  dbApi = null

  constructor() {
    const client = config.database.type
    if (client === 'mongodb') {
      this.dbApi = new MongoApi()
    } else if (client === 'sqlite') {
      this.dbApi = new SQLiteApi()
    } else {
      throw new Error(`Unsupported db client: ${client}`)
    }
  }

  async clearMovies() {
    try {
      await this.dbApi.clearMovies()
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

  async addMovie(movie) {
    try {
      await this.dbApi.addMovie(movie)
    } catch (error) {
      throw error
    }
  }

  async getMovie(tmdb, imdb) {
    try {
      return await this.dbApi.getMovie(tmdb, imdb)
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

  async updatePathAndSize(tmdb, imdb, path, size) {
    try {
      return await this.dbApi.updateMovie(tmdb, imdb, { path: path, size: size })
    } catch (error) {
      throw error
    }
  }
}

const dataService = new DataService()
export default dataService
