import Mongo from '../api/mongoApi.js'

class DataService {
    async clearMovies() {
        try {
            await Mongo.clearMovies()
        } catch (error) {
            throw error
        }
    }

    async addMovies(movies) {
        try {
            await Mongo.addMovies(movies)
        } catch (error) {
            throw error
        }
    }

    async addMovie(movie) {
        try {
            await Mongo.addMovie(movie)
        } catch (error) {
            throw error
        }
    }

    async getMovie(tmdb, imdb) {
        try {
            return await Mongo.getMovie(tmdb, imdb)
        } catch (error) {
            throw error
        }
    }

    async getMovieByJellyfinId(jellyfinId) {
        try {
            return await Mongo.getMovieByJellyfinId(jellyfinId)
        } catch (error) {
            throw error
        }
    }

    async deleteMovie(jellyfinId) {
        try {
            return await Mongo.deleteMovie(jellyfinId)
        } catch (error) {
            throw error
        }
    }

    async updatePathAndSize(tmdb, imdb, path, size) {
        try {
            return await Mongo.updateMovie(tmdb, imdb, {path: path, size: size})
        } catch (error) {
            throw error
        }
    }
}

const dataService = new DataService()
export default dataService
