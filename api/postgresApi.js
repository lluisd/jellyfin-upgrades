import pg from 'pg'
import { config } from '../config.js'

const { Pool } = pg

export class PostgresApi {
  client = null

  constructor() {
    this.client = new Pool({
      host: config.database.postgres.host,
      port: config.database.postgres.port,
      database: config.database.postgres.dbName,
      user: config.database.postgres.user,
      password: config.database.postgres.password
    })
    this.init().then(() => {})
  }

  async init() {
    try {
      await this.client.query(`
        CREATE TABLE IF NOT EXISTS movies (
          id SERIAL PRIMARY KEY,
          "jellyfinId" TEXT UNIQUE,
          name TEXT,
          "dateCreated" TEXT,
          path TEXT,
          tmdb TEXT,
          imdb TEXT,
          tvdb TEXT,
          size REAL,
          "lastModified" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
      await this.client.query(`
        CREATE TABLE IF NOT EXISTS episodes (
          id SERIAL PRIMARY KEY,
          "jellyfinId" TEXT UNIQUE,
          name TEXT,
          "seriesName" TEXT,
          "seasonNumber" INTEGER,
          "episodeNumber" INTEGER,
          "dateCreated" TEXT,
          path TEXT,
          tmdb TEXT,
          imdb TEXT,
          tvdb TEXT,
          size REAL,
          "lastModified" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
      await this.client.query(`
        CREATE TABLE IF NOT EXISTS orphans (
          id SERIAL PRIMARY KEY,
          name TEXT,
          "isMovie" BOOLEAN,
          "lastModified" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
      console.log('Connected to PostgreSQL and tables initialized')
    } catch (error) {
      console.error('Error initializing PostgreSQL:', error)
      throw error
    }
  }

  async addMovies(movies) {
    try {
      for (const movie of movies) {
        await this.addMovie(movie)
      }
      return movies
    } catch (error) {
      throw new Error(`Error adding movies to PostgreSQL: ${error.message}`)
    }
  }

  async addMovie(movie) {
    try {
      await this.client.query(
        `INSERT INTO movies ("jellyfinId", name, "dateCreated", path, tmdb, imdb, tvdb, size, "lastModified")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT ("jellyfinId") DO NOTHING`,
        [
          movie.jellyfinId,
          movie.name,
          movie.dateCreated,
          movie.path,
          movie.tmdb,
          movie.imdb,
          movie.tvdb,
          movie.size,
          movie.lastModified || new Date()
        ]
      )
      return movie
    } catch (error) {
      throw new Error(`Error adding movie to PostgreSQL: ${error.message}`)
    }
  }

  async addEpisodes(episodes) {
    try {
      for (const episode of episodes) {
        await this.addEpisode(episode)
      }
      return episodes
    } catch (error) {
      throw new Error(`Error adding episodes to PostgreSQL: ${error.message}`)
    }
  }

  async addEpisode(episode) {
    try {
      await this.client.query(
        `INSERT INTO episodes ("jellyfinId", name, "seriesName", "seasonNumber", "episodeNumber", "dateCreated", path, tmdb, imdb, tvdb, size, "lastModified")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT ("jellyfinId") DO NOTHING`,
        [
          episode.jellyfinId,
          episode.name,
          episode.seriesName,
          episode.seasonNumber,
          episode.episodeNumber,
          episode.dateCreated,
          episode.path,
          episode.tmdb,
          episode.imdb,
          episode.tvdb,
          episode.size,
          episode.lastModified || new Date()
        ]
      )
      return episode
    } catch (error) {
      throw new Error(`Error adding episode to PostgreSQL: ${error.message}`)
    }
  }

  async addOrphans(orphans) {
    try {
      for (const orphan of orphans) {
        await this.client.query(`INSERT INTO orphans (name, "isMovie", "lastModified") VALUES ($1, $2, $3)`, [
          orphan.name,
          orphan.isMovie,
          new Date()
        ])
      }
      return orphans
    } catch (error) {
      throw new Error(`Error adding orphans to PostgreSQL: ${error.message}`)
    }
  }

  async updateMovie(tmdb, imdb, tvdb, update) {
    try {
      const filter = []
      if (tmdb) filter.push(`tmdb = '${tmdb}'`)
      if (imdb) filter.push(`imdb = '${imdb}'`)
      if (tvdb) filter.push(`tvdb = '${tvdb}'`)
      if (filter.length === 0) return null

      const keys = Object.keys(update)
      const setClause = keys.map((key, i) => `"${key}" = $${i + 1}`).join(', ')
      const values = keys.map((key) => update[key])

      return await this.client.query(`UPDATE movies SET ${setClause} WHERE ${filter.join(' OR ')}`, values)
    } catch (error) {
      throw new Error(`Error updating movie in PostgreSQL: ${error.message}`)
    }
  }

  async updateEpisode(tmdb, imdb, tvdb, update) {
    try {
      const filter = []
      if (tmdb) filter.push(`tmdb = '${tmdb}'`)
      if (imdb) filter.push(`imdb = '${imdb}'`)
      if (tvdb) filter.push(`tvdb = '${tvdb}'`)
      if (filter.length === 0) return null

      const keys = Object.keys(update)
      const setClause = keys.map((key, i) => `"${key}" = $${i + 1}`).join(', ')
      const values = keys.map((key) => update[key])

      return await this.client.query(`UPDATE episodes SET ${setClause} WHERE ${filter.join(' OR ')}`, values)
    } catch (error) {
      throw new Error(`Error updating episode in PostgreSQL: ${error.message}`)
    }
  }

  async getMovieByJellyfinId(jellyfinId) {
    try {
      const result = await this.client.query(`SELECT * FROM movies WHERE "jellyfinId" = $1`, [jellyfinId])
      return result.rows[0] || null
    } catch (error) {
      throw new Error(`Error getting movie from PostgreSQL: ${error.message}`)
    }
  }

  async getMovie(tmdb, imdb, tvdb) {
    try {
      const filter = []
      if (tmdb) filter.push(`tmdb = '${tmdb}'`)
      if (imdb) filter.push(`imdb = '${imdb}'`)
      if (tvdb) filter.push(`tvdb = '${tvdb}'`)
      if (filter.length === 0) return null

      const result = await this.client.query(`SELECT * FROM movies WHERE ${filter.join(' OR ')} LIMIT 1`)
      return result.rows[0] || null
    } catch (error) {
      throw new Error(`Error getting movie from PostgreSQL: ${error.message}`)
    }
  }

  async getEpisode(tmdb, imdb, tvdb) {
    try {
      const filter = []
      if (tmdb) filter.push(`tmdb = '${tmdb}'`)
      if (imdb) filter.push(`imdb = '${imdb}'`)
      if (tvdb) filter.push(`tvdb = '${tvdb}'`)
      if (filter.length === 0) return null

      const result = await this.client.query(`SELECT * FROM episodes WHERE ${filter.join(' OR ')} LIMIT 1`)
      return result.rows[0] || null
    } catch (error) {
      throw new Error(`Error getting episode from PostgreSQL: ${error.message}`)
    }
  }

  async clearMovies() {
    try {
      return await this.client.query(`DELETE FROM movies`)
    } catch (error) {
      throw new Error(`Error clearing movies from PostgreSQL: ${error.message}`)
    }
  }

  async clearEpisodes() {
    try {
      return await this.client.query(`DELETE FROM episodes`)
    } catch (error) {
      throw new Error(`Error clearing episodes from PostgreSQL: ${error.message}`)
    }
  }

  async clearOrphans(isMovie) {
    try {
      return await this.client.query(`DELETE FROM orphans WHERE "isMovie" = $1`, [!!isMovie])
    } catch (error) {
      throw new Error(`Error clearing orphans from PostgreSQL: ${error.message}`)
    }
  }

  async deleteMovie(jellyfinId) {
    try {
      return await this.client.query(`DELETE FROM movies WHERE "jellyfinId" = $1`, [jellyfinId])
    } catch (error) {
      throw new Error(`Error deleting movie from PostgreSQL: ${error.message}`)
    }
  }
}
