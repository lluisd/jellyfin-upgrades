import ArrNamingService from '../services/arrNamingService.js'
import { config } from '../config.js'

class SonarrService extends ArrNamingService {
  constructor() {
    super(config.sonarr)
  }
}

const sonarrService = new SonarrService()
export default sonarrService
