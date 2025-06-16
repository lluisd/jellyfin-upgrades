import Movie from '../models/movie.js'

async function addMovies(movies) {
  try {
    return Movie.insertMany(movies)
  } catch (error) {
    throw new Error(`Error adding movies to Mongodb: ${error}`)
  }
}

async function addMovie(movie) {
  try {
    return Movie.create(movie)
  } catch (error) {
    throw new Error(`Error adding movie to Mongodb: ${error}`)
  }
}

async function updateMovie(tmdb, imdb, update) {
  const filter = {
    $or: [tmdb ? { tmdb: tmdb } : {}, imdb ? { imdb: imdb } : {}]
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

async function getMovieByJellyfinId(jellyfinId) {
  try {
    return Movie.findOne({ jellyfinId: jellyfinId }).lean()
  } catch (error) {
    throw new Error(`Error getting movie from Mongodb: ${error}`)
  }
}

async function getMovie(tmdb, imdb) {
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

async function clearMovies() {
  try {
    return Movie.deleteMany()
  } catch (error) {
    throw new Error(`Error clearing movies from Mongodb: ${error}`)
  }
}

async function deleteMovie(jellyfinId) {
  try {
    return Movie.deleteOne({ jellyfinId: jellyfinId })
  } catch (error) {
    throw new Error(`Error deleting movie from Mongodb: ${error}`)
  }
}

export default {
  addMovies,
  addMovie,
  updateMovie,
  getMovie,
  clearMovies,
  deleteMovie,
  getMovieByJellyfinId
}
