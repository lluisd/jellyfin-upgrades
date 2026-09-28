import ArrNamingService from '../services/arrNamingService.js'
import arrApi from '../api/arrApi.js'
import { config } from '../config.js'

class SonarrService extends ArrNamingService {
  constructor() {
    super(config.sonarr)
  }

  async getSeries() {
    const series = await arrApi.getSeries(this.config)

    return series.map((serie) => ({
      id: serie.id,
      tvdbId: serie.tvdbId,
      imdbId: serie.imdbId,
      title: serie.title
    }))
  }

  async getEpisodes(seriesId) {
    const episodes = await arrApi.getEpisodes(this.config, seriesId)

    return episodes.map((episode) => ({
      seasonNumber: episode.seasonNumber,
      episodeNumber: episode.episodeNumber,
      hasFile: episode.hasFile
    }))
  }
}

const sonarrService = new SonarrService()
export default sonarrService
