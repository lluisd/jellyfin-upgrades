import Movie from '../models/movie.js'
import { config } from '../config.js'
import mongoose from 'mongoose'

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
      return Movie.insertMany(movies)
    } catch (error) {
      throw new Error(`Error adding movies to Mongodb: ${error}`)
    }
  }

  async addMovie(movie) {
    try {
      return Movie.create(movie)
    } catch (error) {
      throw new Error(`Error adding movie to Mongodb: ${error}`)
    }
  }

  async updateMovie(tmdb, imdb, path, size) {
    const filter = {
      $or: [tmdb ? { tmdb: tmdb } : {}, imdb ? { imdb: imdb } : {}]
    }

    if (Object.keys(filter.$or[0]).length === 0 && Object.keys(filter.$or[1]).length === 0) {
      return null
    }

    try {
      return Movie.updateOne(filter, { path: path, size: size })
    } catch (error) {
      throw new Error(`Error updating movie on Mongodb: ${error}`)
    }
  }

  async getMovieByJellyfinId(jellyfinId) {
    try {
      return Movie.findOne({ jellyfinId: jellyfinId }).lean()
    } catch (error) {
      throw new Error(`Error getting movie from Mongodb: ${error}`)
    }
  }

  async getMovie(tmdb, imdb) {
    const filter = {
      $or: [tmdb ? { tmdb: tmdb } : {}, imdb ? { imdb: imdb } : {}]
    }

    if (Object.keys(filter.$or[0]).length === 0 && Object.keys(filter.$or[1]).length === 0) {
      return null
    }

    try {
      return Movie.findOne(filter).lean()
    } catch (error) {
      throw new Error(`Error getting movie from Mongodb: ${error}`)
    }
  }

  async clearMovies() {
    try {
      return Movie.deleteMany()
    } catch (error) {
      throw new Error(`Error clearing movies from Mongodb: ${error}`)
    }
  }

  async deleteMovie(jellyfinId) {
    try {
      return Movie.deleteOne({ jellyfinId: jellyfinId })
    } catch (error) {
      throw new Error(`Error deleting movie from Mongodb: ${error}`)
    }
  }
}
