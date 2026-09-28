import ArrNamingService from '../services/arrNamingService.js'
import arrApi from '../api/arrApi.js'
import { config } from '../config.js'

class RadarrService extends ArrNamingService {
  constructor() {
    super(config.radarr)
  }

  async getMovies() {
    const movies = await arrApi.getMovies(this.config)

    return movies.map((movie) => ({
      tmdbId: movie.tmdbId,
      imdbId: movie.imdbId,
      hasFile: movie.hasFile,
      title: movie.title
    }))
  }
}

const radarrService = new RadarrService()
export default radarrService
