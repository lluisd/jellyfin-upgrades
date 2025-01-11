import JellyfinApi from '../api/jellyfinApi.js'

class MediaService {
    async getMovies() {
        try {
            const apiResponse = await JellyfinApi.getMovies()
            if (apiResponse && apiResponse.Items && apiResponse.Items.length > 0) {
                return apiResponse.Items
            } else {
                return []
            }
        } catch (error) {
            throw error
        }
    }

    async getAVC10bitsMovies() {
        try {
            const avc10bitMovies = []
            const apiResponse = await JellyfinApi.getMoviesWithMediaStreams()

            if (apiResponse && apiResponse.Items && apiResponse.Items.length > 0) {
                for (const movie of apiResponse.Items) {
                    movie?.MediaStreams?.find(stream => stream.Codec === 'h264' && stream.BitDepth === 10) ? avc10bitMovies.push(movie) : null
                }
                return avc10bitMovies
            } else {
                return []
            }
        } catch (error) {
            throw error
        }
    }


    async getMovie(id) {
        try {
            const apiResponse = await JellyfinApi.getMovie(id)
            if (apiResponse && apiResponse.Items && apiResponse.Items.length === 1) {
                return apiResponse.Items[0]
            } else {
                return null
            }
        } catch (error) {
            throw error
        }
    }

    async updateDateCreated(movie, dateCreated) {
        try {
            movie.dateCreated = dateCreated
            return await JellyfinApi.updateMovie(movie)
        } catch (error) {
            throw error
        }
    }

    createMovie (movie) {
        return {
            jellyfinId: movie.Id,
            name: movie.Name,
            dateCreated: movie.DateCreated,
            tmdb: movie?.ProviderIds?.Tmdb ?? '',
            imdb: movie?.ProviderIds?.Imdb ?? '',
            path: movie.Path,
            size: movie?.MediaSources?.reduce((acc, source) => acc + source?.Size || 0, 0) ?? 0
        }
    }
}
const moviesService = new MediaService()
export default moviesService
