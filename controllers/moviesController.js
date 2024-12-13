import storageService from "../services/storageService.js"
import torrentService from "../services/torrentService.js"
import mediaService from "../services/mediaService.js"
import dataService from "../services/dataService.js"
import notificationService from "../services/notificationService.js"
import { getFilenameAndExtension } from '../utils/files.js'

class MoviesController {
    async refreshMovies () {
        try {
            console.log('Refreshing movies')

            let movies = []
            const items = await mediaService.getMovies()
            if (items.length > 0) {
                await dataService.clearMovies()
                for (const item of items) {
                    movies.push(mediaService.createMovie(item))
                }
                await dataService.addMovies(movies)
            }

            console.log(movies.length + ' Refreshed movies')
            return movies
        } catch (error) {
            throw error
        }
    }

    async upgradeMovie (id, tmdb, imdb) {
        try {
            let response = 'nothing'
            console.log(`upgrading movie: ${id} (tmdb: ${tmdb}, imdb: ${imdb})`)

            const dataMovie = await dataService.getMovie(tmdb, imdb)
            const mediaMovie = await mediaService.getMovie(id)

            if (mediaMovie && dataMovie) {
                const oldDate = mediaMovie.DateCreated
                await mediaService.updateDateCreated(mediaMovie, dataMovie.dateCreated)

                await dataService.updatePath(tmdb, imdb, mediaMovie.Path)
                const {name, extension} = getFilenameAndExtension(dataMovie)
                let {deleted, reason, exists} = await torrentService.deleteFromTorrentClient(name, extension)
                if (!deleted && !exists) {
                    deleted = storageService.removeFileOrFolder(name, extension)
                }

                await notificationService.notifyUpgradedMovie(mediaMovie, dataMovie, oldDate, deleted, reason)

                response = `Movie upgraded: ${mediaMovie.Name} (tmdb: ${tmdb}, imdb: ${imdb})`
                console.log(response)
            } else if (mediaMovie && !dataMovie) {
                await dataService.addMovie(mediaService.createMovie(mediaMovie))

                await notificationService.notifyAddedMovie(mediaMovie, tmdb)
                response = `Movie created: ${mediaMovie.Name} (tmdb: ${tmdb}, imdb: ${imdb})`
                console.log(response)
            }
            return response
        } catch (error) {
            throw error
        }
    }
}

const moviesController = new MoviesController()
export default moviesController
