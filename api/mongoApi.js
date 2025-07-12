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
      return Movie.insertMany(movies)
    } catch (error) {
      throw new Error(`Error adding movies to Mongodb: ${error}`)
    }
  }

  async addEpisodes(episodes) {
    try {
      return Episode.insertMany(episodes)
    } catch (error) {
      throw new Error(`Error adding episodes to Mongodb: ${error}`)
    }
  }

  async addOrphans(orphans) {
    try {
      return Orphan.insertMany(orphans)
    } catch (error) {
      throw new Error(`Error adding orphans to Mongodb: ${error}`)
    }
  }

  async addMovie(movie) {
    try {
      return Movie.create(movie)
    } catch (error) {
      throw new Error(`Error adding movie to Mongodb: ${error}`)
    }
  }

  async addEpisode(episode) {
    try {
      return Episode.create(episode)
    } catch (error) {
      throw new Error(`Error adding episode to Mongodb: ${error}`)
    }
  }

  async updateMovie(tmdb, imdb, tvdb, update) {
    const filter = {
      $or: [tmdb ? { tmdb: tmdb } : {}, imdb ? { imdb: imdb } : {}, tvdb ? { tvdb: tvdb } : {}]
    }

    if (Object.keys(filter.$or[0]).length === 0 && Object.keys(filter.$or[1]).length === 0) {
      return null
    }

    try {
      return Movie.updateOne(filter, update)
    } catch (error) {
      throw new Error(`Error updating movie on Mongodb: ${error}`)
    }
  }

  updateEpisode(tmdb, imdb, tvdb, update) {
    const filter = {
      $or: [tmdb ? { tmdb: tmdb } : {}, imdb ? { imdb: imdb } : {}, tvdb ? { tvdb: tvdb } : {}]
    }

    if (Object.keys(filter.$or[0]).length === 0 && Object.keys(filter.$or[1]).length === 0) {
      return null
    }

    try {
      return Episode.updateOne(filter, update)
    } catch (error) {
      throw new Error(`Error updating episode on Mongodb: ${error}`)
    }
  }

  async getMovieByJellyfinId(jellyfinId) {
    try {
      return Movie.findOne({ jellyfinId: jellyfinId }).lean()
    } catch (error) {
      throw new Error(`Error getting movie from Mongodb: ${error}`)
    }
  }

  async getMovie(tmdb, imdb, tvdb) {
    const filter = {
      $or: [tmdb ? { tmdb: tmdb } : {}, imdb ? { imdb: imdb } : {}, tvdb ? { tvdb: tvdb } : {}]
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

  async getEpisode(tmdb, imdb, tvdb) {
    const filter = {
      $or: [tmdb ? { tmdb: tmdb } : {}, imdb ? { imdb: imdb } : {}, tvdb ? { tvdb: tvdb } : {}]
    }

    if (Object.keys(filter.$or[0]).length === 0 && Object.keys(filter.$or[1]).length === 0) {
      return null
    }

    try {
      return Episode.findOne(filter).lean()
    } catch (error) {
      throw new Error(`Error getting episode from Mongodb: ${error}`)
    }
  }

  async clearMovies() {
    try {
      return Movie.deleteMany()
    } catch (error) {
      throw new Error(`Error clearing movies from Mongodb: ${error}`)
    }
  }

  async clearEpisodes() {
    try {
      return Episode.deleteMany()
    } catch (error) {
      throw new Error(`Error clearing episodes from Mongodb: ${error}`)
    }
  }

  async clearOrphans(isMovie) {
    try {
      return Orphan.deleteMany({ isMovie: !!isMovie })
    } catch (error) {
      throw new Error(`Error clearing orphan ${isMovie ? 'movies' : 'series'} from Mongodb: ${error}`)
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
