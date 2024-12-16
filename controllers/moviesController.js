import storageService from "../services/storageService.js"
import torrentService from "../services/torrentService.js"
import mediaService from "../services/mediaService.js"
import dataService from "../services/dataService.js"
import notificationService from "../services/notificationService.js"
import {getFilenameAndExtension} from '../utils/files.js'
import semaphore from "../semaphore.js"

class MoviesController {
    async refreshMovies () {
        const [ value, release ] = await semaphore.acquire()
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
        } finally {
            release()
        }
    }

    async updateMovie (id, tmdb, imdb) {
        const [ value, release ] = await semaphore.acquire()
        try {
            let response = 'nothing'
            console.log(`upgrading movie: ${id} (tmdb: ${tmdb}, imdb: ${imdb})`)

            const dataMovie = await dataService.getMovie(tmdb, imdb)
            const mediaMovie = await mediaService.getMovie(id)
            const isSameMovie = mediaMovie?.Id === dataMovie?.jellyfinId

            if (mediaMovie && dataMovie && !isSameMovie) {
                const oldDate = mediaMovie.DateCreated
                await mediaService.updateDateCreated(mediaMovie, dataMovie.dateCreated)

                const newSize = mediaMovie?.MediaSources?.reduce((acc, source) => acc + source?.Size || 0, 0) ?? 0
                await dataService.updatePathAndSize(tmdb, imdb, mediaMovie.Path, newSize)
                const {name, extension} = getFilenameAndExtension(dataMovie.path)
                let {deleted, reason, torrentExists} = await torrentService.deleteFromTorrentClient(name, extension)
                if (!torrentExists) {
                    deleted = storageService.removeFileOrFolder(name, extension)
                }

                await notificationService.notifyUpgradedMovie(mediaMovie, dataMovie, oldDate, newSize, deleted, reason, torrentExists)

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
        }  finally {
            release()
        }
    }
}

const moviesController = new MoviesController()
export default moviesController
