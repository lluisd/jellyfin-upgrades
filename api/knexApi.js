import knexLib from 'knex'
import { config } from '../config.js'
import path from 'path'

function createKnexConfig() {
  const type = config.database.type

  if (type === 'postgres') {
    return {
      client: 'pg',
      connection: {
        host: config.database.postgres.host,
        port: config.database.postgres.port,
        database: config.database.postgres.dbName,
        user: config.database.postgres.user,
        password: config.database.postgres.password
      }
    }
  }

  return {
    client: 'better-sqlite3',
    connection: {
      filename: path.join(config.database.sqlite.dbDir, `${config.database.sqlite.dbName}.db`)
    },
    useNullAsDefault: true
  }
}

export class KnexApi {
  db = null

  constructor() {
    this.db = knexLib(createKnexConfig())
  }

  async init() {
    const hasMovies = await this.db.schema.hasTable('movies')
    if (!hasMovies) {
      await this.db.schema.createTable('movies', (table) => {
        table.increments('id').primary()
        table.text('jellyfinId').unique()
        table.text('name')
        table.text('dateCreated')
        table.text('path')
        table.text('tmdb')
        table.text('imdb')
        table.text('tvdb')
        table.float('size')
        table.timestamp('lastModified').defaultTo(this.db.fn.now())
      })
    }

    const hasEpisodes = await this.db.schema.hasTable('episodes')
    if (!hasEpisodes) {
      await this.db.schema.createTable('episodes', (table) => {
        table.increments('id').primary()
        table.text('jellyfinId').unique()
        table.text('name')
        table.text('seriesName')
        table.integer('seasonNumber')
        table.integer('episodeNumber')
        table.text('dateCreated')
        table.text('path')
        table.text('tmdb')
        table.text('imdb')
        table.text('tvdb')
        table.float('size')
        table.timestamp('lastModified').defaultTo(this.db.fn.now())
      })
    }

    const hasOrphans = await this.db.schema.hasTable('orphans')
    if (!hasOrphans) {
      await this.db.schema.createTable('orphans', (table) => {
        table.increments('id').primary()
        table.text('name')
        table.boolean('isMovie')
        table.timestamp('lastModified').defaultTo(this.db.fn.now())
      })
    }

    console.log(`Database tables initialized (${config.database.type})`)
  }

  async addMovies(movies) {
    try {
      for (const movie of movies) {
        await this.addMovie(movie)
      }
      return movies
    } catch (error) {
      throw new Error(`Error adding movies: ${error.message}`)
    }
  }

  async addMovie(movie) {
    try {
      await this.db('movies')
        .insert({
          jellyfinId: movie.jellyfinId,
          name: movie.name,
          dateCreated: movie.dateCreated,
          path: movie.path,
          tmdb: movie.tmdb,
          imdb: movie.imdb,
          tvdb: movie.tvdb,
          size: movie.size,
          lastModified: movie.lastModified || new Date()
        })
        .onConflict('jellyfinId')
        .ignore()
      return movie
    } catch (error) {
      throw new Error(`Error adding movie: ${error.message}`)
    }
  }

  async addEpisodes(episodes) {
    try {
      for (const episode of episodes) {
        await this.addEpisode(episode)
      }
      return episodes
    } catch (error) {
      throw new Error(`Error adding episodes: ${error.message}`)
    }
  }

  async addEpisode(episode) {
    try {
      await this.db('episodes')
        .insert({
          jellyfinId: episode.jellyfinId,
          name: episode.name,
          seriesName: episode.seriesName,
          seasonNumber: episode.seasonNumber,
          episodeNumber: episode.episodeNumber,
          dateCreated: episode.dateCreated,
          path: episode.path,
          tmdb: episode.tmdb,
          imdb: episode.imdb,
          tvdb: episode.tvdb,
          size: episode.size,
          lastModified: episode.lastModified || new Date()
        })
        .onConflict('jellyfinId')
        .ignore()
      return episode
    } catch (error) {
      throw new Error(`Error adding episode: ${error.message}`)
    }
  }

  async addOrphans(orphans) {
    try {
      for (const orphan of orphans) {
        await this.db('orphans').insert({
          name: orphan.name,
          isMovie: orphan.isMovie,
          lastModified: new Date()
        })
      }
      return orphans
    } catch (error) {
      throw new Error(`Error adding orphans: ${error.message}`)
    }
  }

  async updateMovie(tmdb, imdb, tvdb, update) {
    try {
      if (!tmdb && !imdb && !tvdb) return null
      return await this.db('movies')
        .where((builder) => {
          if (tmdb) builder.orWhere('tmdb', tmdb)
          if (imdb) builder.orWhere('imdb', imdb)
          if (tvdb) builder.orWhere('tvdb', tvdb)
        })
        .update(update)
    } catch (error) {
      throw new Error(`Error updating movie: ${error.message}`)
    }
  }

  async updateEpisode(tmdb, imdb, tvdb, update) {
    try {
      if (!tmdb && !imdb && !tvdb) return null
      return await this.db('episodes')
        .where((builder) => {
          if (tmdb) builder.orWhere('tmdb', tmdb)
          if (imdb) builder.orWhere('imdb', imdb)
          if (tvdb) builder.orWhere('tvdb', tvdb)
        })
        .update(update)
    } catch (error) {
      throw new Error(`Error updating episode: ${error.message}`)
    }
  }

  async getMovieByJellyfinId(jellyfinId) {
    try {
      return (await this.db('movies').where('jellyfinId', jellyfinId).first()) || null
    } catch (error) {
      throw new Error(`Error getting movie: ${error.message}`)
    }
  }

  async getMovie(tmdb, imdb, tvdb) {
    try {
      if (!tmdb && !imdb && !tvdb) return null
      return (
        (await this.db('movies')
          .where((builder) => {
            if (tmdb) builder.orWhere('tmdb', tmdb)
            if (imdb) builder.orWhere('imdb', imdb)
            if (tvdb) builder.orWhere('tvdb', tvdb)
          })
          .first()) || null
      )
    } catch (error) {
      throw new Error(`Error getting movie: ${error.message}`)
    }
  }

  async getEpisode(tmdb, imdb, tvdb) {
    try {
      if (!tmdb && !imdb && !tvdb) return null
      return (
        (await this.db('episodes')
          .where((builder) => {
            if (tmdb) builder.orWhere('tmdb', tmdb)
            if (imdb) builder.orWhere('imdb', imdb)
            if (tvdb) builder.orWhere('tvdb', tvdb)
          })
          .first()) || null
      )
    } catch (error) {
      throw new Error(`Error getting episode: ${error.message}`)
    }
  }

  async clearMovies() {
    try {
      return await this.db('movies').del()
    } catch (error) {
      throw new Error(`Error clearing movies: ${error.message}`)
    }
  }

  async clearEpisodes() {
    try {
      return await this.db('episodes').del()
    } catch (error) {
      throw new Error(`Error clearing episodes: ${error.message}`)
    }
  }

  async clearOrphans(isMovie) {
    try {
      return await this.db('orphans').where('isMovie', !!isMovie).del()
    } catch (error) {
      throw new Error(`Error clearing orphans: ${error.message}`)
    }
  }

  async deleteMovie(jellyfinId) {
    try {
      return await this.db('movies').where('jellyfinId', jellyfinId).del()
    } catch (error) {
      throw new Error(`Error deleting movie: ${error.message}`)
    }
  }
}
