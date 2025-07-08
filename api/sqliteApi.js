import Database from 'better-sqlite3'
import { config } from '../config.js'
import path from 'path'

export class SQLiteApi {
  client = null

  constructor() {
    const dbPath = path.join(config.database.sqlite.dbDir, `${config.database.sqlite.dbName}.db`)
    console.log(`Connecting to SQLite database at ${dbPath}`)
    this.client = new Database(dbPath, { verbose: config.debug ? console.log : undefined })
    this.client.exec(`
      CREATE TABLE IF NOT EXISTS movies
      (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        jellyfinId TEXT UNIQUE,
        name  TEXT,
        dateCreated TEXT,
        path TEXT,
        tmdb TEXT,
        imdb TEXT,
        tvdb TEXT,
        size REAL,
        lastModified TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)
  }

  addMovies(movies) {
    try {
      const stmt = this.client.prepare(`
        INSERT INTO movies (jellyfinId, name, dateCreated, tmdb, imdb, path, size)
        VALUES (@jellyfinId, @name, @dateCreated, @tmdb, @imdb, @path, @size)
      `)
      const insertMany = this.client.transaction((movies) => {
        for (const movie of movies) {
          stmt.run(movie)
        }
      })
      insertMany(movies)
      return movies
    } catch (error) {
      throw new Error(`Error adding movies to SQLite: ${error.message}`)
    }
  }

  addMovie(movie) {
    try {
      const stmt = this.client.prepare(`
        INSERT INTO movies (jellyfinId, name, dateCreated, path, tmdb, imdb, size, lastModified)
        VALUES (@jellyfinId, @name, @dateCreated, @path, @tmdb, @imdb, @size, @lastModified)
      `)
      stmt.run(movie)
      return movie
    } catch (error) {
      throw new Error(`Error adding movie to SQLite: ${error.message}`)
    }
  }

  updateMovie(tmdb, imdb, update) {
    try {
      const filter = []
      if (tmdb) filter.push(`tmdb = '${tmdb}'`)
      if (imdb) filter.push(`imdb = '${imdb}'`)
      if (filter.length === 0) return null

      const setClause = Object.keys(update)
        .map((key) => `${key} = @${key}`)
        .join(', ')

      const stmt = this.client.prepare(`
        UPDATE movies
        SET ${setClause}
        WHERE ${filter.join(' OR ')}
      `)
      return stmt.run(update)
    } catch (error) {
      throw new Error(`Error updating movie in SQLite: ${error.message}`)
    }
  }

  getMovieByJellyfinId(jellyfinId) {
    try {
      const stmt = this.client.prepare(`
        SELECT *
        FROM movies
        WHERE jellyfinId = ?
      `)
      return stmt.get(jellyfinId)
    } catch (error) {
      throw new Error(`Error getting movie from SQLite: ${error.message}`)
    }
  }

  getMovie(tmdb, imdb) {
    try {
      const filter = []
      if (tmdb) filter.push(`tmdb = '${tmdb}'`)
      if (imdb) filter.push(`imdb = '${imdb}'`)
      if (filter.length === 0) return null

      const stmt = this.client.prepare(`
        SELECT *
        FROM movies
        WHERE ${filter.join(' OR ')}
      `)
      return stmt.get()
    } catch (error) {
      throw new Error(`Error getting movie from SQLite: ${error.message}`)
    }
  }

  clearMovies() {
    try {
      const stmt = this.client.prepare(`DELETE FROM movies`)
      return stmt.run()
    } catch (error) {
      throw new Error(`Error clearing movies from SQLite: ${error.message}`)
    }
  }

  deleteMovie(jellyfinId) {
    try {
      const stmt = this.client.prepare(`
        DELETE
        FROM movies
        WHERE jellyfinId = ?
      `)
      return stmt.run(jellyfinId)
    } catch (error) {
      throw new Error(`Error deleting movie from SQLite: ${error.message}`)
    }
  }
}
