import Movie from '../models/movie.js'
import { config } from '../config.js'
import mongoose from 'mongoose'
import Episode from '../models/episode.js'
import Orphan from '../models/orphan.js'

export class MongoApi {
  client = null

  constructor() {
    this.connectToDatabase().then(() => {})
  }

  async connectToDatabase() {
    try {
      await mongoose.connect(config.database.mongo.uri, { dbName: config.database.mongo.dbName })
      console.log('Connected to MongoDB')
    } catch (error) {
      console.error('Error connecting to MongoDB:', error)
      throw error
    }
  }

  async addMovies(movies) {
    try {
      return await Movie.insertMany(movies)
    } catch (error) {
      throw new Error(`Error adding movies to Mongodb: ${error}`)
    }
  }

  async addEpisodes(episodes) {
    try {
      return await Episode.insertMany(episodes)
    } catch (error) {
      throw new Error(`Error adding episodes to Mongodb: ${error}`)
    }
  }

  async addOrphans(orphans) {
    try {
      return await Orphan.insertMany(orphans)
    } catch (error) {
      throw new Error(`Error adding orphans to Mongodb: ${error}`)
    }
  }

  async addMovie(movie) {
    try {
      return await Movie.create(movie)
    } catch (error) {
      throw new Error(`Error adding movie to Mongodb: ${error}`)
    }
  }

  async addEpisode(episode) {
    try {
      return await Episode.create(episode)
    } catch (error) {
      throw new Error(`Error adding episode to Mongodb: ${error}`)
    }
  }

  async updateMovie(tmdb, imdb, tvdb, update) {
    const orConditions = []
    if (tmdb) orConditions.push({ tmdb })
    if (imdb) orConditions.push({ imdb })
    if (tvdb) orConditions.push({ tvdb })

    if (orConditions.length === 0) return null

    try {
      return await Movie.updateOne({ $or: orConditions }, update)
    } catch (error) {
      throw new Error(`Error updating movie on Mongodb: ${error}`)
    }
  }

  async updateEpisode(tmdb, imdb, tvdb, update) {
    const orConditions = []
    if (tmdb) orConditions.push({ tmdb })
    if (imdb) orConditions.push({ imdb })
    if (tvdb) orConditions.push({ tvdb })

    if (orConditions.length === 0) return null

    try {
      return await Episode.updateOne({ $or: orConditions }, update)
    } catch (error) {
      throw new Error(`Error updating episode on Mongodb: ${error}`)
    }
  }

  async getMovieByJellyfinId(jellyfinId) {
    try {
      return await Movie.findOne({ jellyfinId: jellyfinId }).lean()
    } catch (error) {
      throw new Error(`Error getting movie from Mongodb: ${error}`)
    }
  }

  async getMovie(tmdb, imdb, tvdb) {
    const orConditions = []
    if (tmdb) orConditions.push({ tmdb })
    if (imdb) orConditions.push({ imdb })
    if (tvdb) orConditions.push({ tvdb })

    if (orConditions.length === 0) return null

    try {
      return await Movie.findOne({ $or: orConditions }).lean()
    } catch (error) {
      throw new Error(`Error getting movie from Mongodb: ${error}`)
    }
  }

  async getEpisode(tmdb, imdb, tvdb) {
    const orConditions = []
    if (tmdb) orConditions.push({ tmdb })
    if (imdb) orConditions.push({ imdb })
    if (tvdb) orConditions.push({ tvdb })

    if (orConditions.length === 0) return null

    try {
      return await Episode.findOne({ $or: orConditions }).lean()
    } catch (error) {
      throw new Error(`Error getting episode from Mongodb: ${error}`)
    }
  }

  async clearMovies() {
    try {
      return await Movie.deleteMany()
    } catch (error) {
      throw new Error(`Error clearing movies from Mongodb: ${error}`)
    }
  }

  async clearEpisodes() {
    try {
      return await Episode.deleteMany()
    } catch (error) {
      throw new Error(`Error clearing episodes from Mongodb: ${error}`)
    }
  }

  async clearOrphans(isMovie) {
    try {
      return await Orphan.deleteMany({ isMovie: !!isMovie })
    } catch (error) {
      throw new Error(`Error clearing orphan ${isMovie ? 'movies' : 'series'} from Mongodb: ${error}`)
    }
  }

  async deleteMovie(jellyfinId) {
    try {
      return await Movie.deleteOne({ jellyfinId: jellyfinId })
    } catch (error) {
      throw new Error(`Error deleting movie from Mongodb: ${error}`)
    }
  }
}
