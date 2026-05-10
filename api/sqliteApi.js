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
        name TEXT,
        dateCreated TEXT,
        path TEXT,
        tmdb TEXT,
        imdb TEXT,
        tvdb TEXT,
        size REAL,
        lastModified TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)
    this.client.exec(`
      CREATE TABLE IF NOT EXISTS episodes
      (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        jellyfinId TEXT UNIQUE,
        name TEXT,
        seriesName TEXT,
        seasonNumber INTEGER,
        episodeNumber INTEGER,
        dateCreated TEXT,
        path TEXT,
        tmdb TEXT,
        imdb TEXT,
        tvdb TEXT,
        size REAL,
        lastModified TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)
    this.client.exec(`
      CREATE TABLE IF NOT EXISTS orphans
      (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        isMovie INTEGER,
        lastModified TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)
  }

  addMovies(movies) {
    try {
      const stmt = this.client.prepare(`
        INSERT INTO movies (jellyfinId, name, dateCreated, tmdb, imdb, tvdb, path, size)
        VALUES (@jellyfinId, @name, @dateCreated, @tmdb, @imdb, @tvdb, @path, @size)
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
        INSERT INTO movies (jellyfinId, name, dateCreated, path, tmdb, imdb, tvdb, size, lastModified)
        VALUES (@jellyfinId, @name, @dateCreated, @path, @tmdb, @imdb, @tvdb, @size, @lastModified)
      `)
      stmt.run(movie)
      return movie
    } catch (error) {
      throw new Error(`Error adding movie to SQLite: ${error.message}`)
    }
  }

  addEpisodes(episodes) {
    try {
      const stmt = this.client.prepare(`
        INSERT INTO episodes (jellyfinId, name, seriesName, seasonNumber, episodeNumber, dateCreated, path, tmdb, imdb, tvdb, size)
        VALUES (@jellyfinId, @name, @seriesName, @seasonNumber, @episodeNumber, @dateCreated, @path, @tmdb, @imdb, @tvdb, @size)
      `)
      const insertMany = this.client.transaction((episodes) => {
        for (const episode of episodes) {
          stmt.run(episode)
        }
      })
      insertMany(episodes)
      return episodes
    } catch (error) {
      throw new Error(`Error adding episodes to SQLite: ${error.message}`)
    }
  }

  addEpisode(episode) {
    try {
      const stmt = this.client.prepare(`
        INSERT INTO episodes (jellyfinId, name, seriesName, seasonNumber, episodeNumber, dateCreated, path, tmdb, imdb, tvdb, size, lastModified)
        VALUES (@jellyfinId, @name, @seriesName, @seasonNumber, @episodeNumber, @dateCreated, @path, @tmdb, @imdb, @tvdb, @size, @lastModified)
      `)
      stmt.run(episode)
      return episode
    } catch (error) {
      throw new Error(`Error adding episode to SQLite: ${error.message}`)
    }
  }

  addOrphans(orphans) {
    try {
      const stmt = this.client.prepare(`
        INSERT INTO orphans (name, isMovie) VALUES (@name, @isMovie)
      `)
      const insertMany = this.client.transaction((orphans) => {
        for (const orphan of orphans) {
          stmt.run({ name: orphan.name, isMovie: orphan.isMovie ? 1 : 0 })
        }
      })
      insertMany(orphans)
      return orphans
    } catch (error) {
      throw new Error(`Error adding orphans to SQLite: ${error.message}`)
    }
  }

  updateMovie(tmdb, imdb, tvdb, update) {
    try {
      const filter = []
      if (tmdb) filter.push(`tmdb = '${tmdb}'`)
      if (imdb) filter.push(`imdb = '${imdb}'`)
      if (tvdb) filter.push(`tvdb = '${tvdb}'`)
      if (filter.length === 0) return null

      const setClause = Object.keys(update)
        .map((key) => `${key} = @${key}`)
        .join(', ')

      const stmt = this.client.prepare(`
        UPDATE movies SET ${setClause} WHERE ${filter.join(' OR ')}
      `)
      return stmt.run(update)
    } catch (error) {
      throw new Error(`Error updating movie in SQLite: ${error.message}`)
    }
  }

  updateEpisode(tmdb, imdb, tvdb, update) {
    try {
      const filter = []
      if (tmdb) filter.push(`tmdb = '${tmdb}'`)
      if (imdb) filter.push(`imdb = '${imdb}'`)
      if (tvdb) filter.push(`tvdb = '${tvdb}'`)
      if (filter.length === 0) return null

      const setClause = Object.keys(update)
        .map((key) => `${key} = @${key}`)
        .join(', ')

      const stmt = this.client.prepare(`
        UPDATE episodes SET ${setClause} WHERE ${filter.join(' OR ')}
      `)
      return stmt.run(update)
    } catch (error) {
      throw new Error(`Error updating episode in SQLite: ${error.message}`)
    }
  }

  getMovieByJellyfinId(jellyfinId) {
    try {
      const stmt = this.client.prepare(`SELECT * FROM movies WHERE jellyfinId = ?`)
      return stmt.get(jellyfinId)
    } catch (error) {
      throw new Error(`Error getting movie from SQLite: ${error.message}`)
    }
  }

  getMovie(tmdb, imdb, tvdb) {
    try {
      const filter = []
      if (tmdb) filter.push(`tmdb = '${tmdb}'`)
      if (imdb) filter.push(`imdb = '${imdb}'`)
      if (tvdb) filter.push(`tvdb = '${tvdb}'`)
      if (filter.length === 0) return null

      const stmt = this.client.prepare(`SELECT * FROM movies WHERE ${filter.join(' OR ')}`)
      return stmt.get()
    } catch (error) {
      throw new Error(`Error getting movie from SQLite: ${error.message}`)
    }
  }

  getEpisode(tmdb, imdb, tvdb) {
    try {
      const filter = []
      if (tmdb) filter.push(`tmdb = '${tmdb}'`)
      if (imdb) filter.push(`imdb = '${imdb}'`)
      if (tvdb) filter.push(`tvdb = '${tvdb}'`)
      if (filter.length === 0) return null

      const stmt = this.client.prepare(`SELECT * FROM episodes WHERE ${filter.join(' OR ')}`)
      return stmt.get()
    } catch (error) {
      throw new Error(`Error getting episode from SQLite: ${error.message}`)
    }
  }

  clearMovies() {
    try {
      return this.client.prepare(`DELETE FROM movies`).run()
    } catch (error) {
      throw new Error(`Error clearing movies from SQLite: ${error.message}`)
    }
  }

  clearEpisodes() {
    try {
      return this.client.prepare(`DELETE FROM episodes`).run()
    } catch (error) {
      throw new Error(`Error clearing episodes from SQLite: ${error.message}`)
    }
  }

  clearOrphans(isMovie) {
    try {
      return this.client.prepare(`DELETE FROM orphans WHERE isMovie = ?`).run(isMovie ? 1 : 0)
    } catch (error) {
      throw new Error(`Error clearing orphans from SQLite: ${error.message}`)
    }
  }

  deleteMovie(jellyfinId) {
    try {
      return this.client.prepare(`DELETE FROM movies WHERE jellyfinId = ?`).run(jellyfinId)
    } catch (error) {
      throw new Error(`Error deleting movie from SQLite: ${error.message}`)
    }
  }
}
