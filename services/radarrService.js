import ArrNamingService from '../services/arrNamingService.js'
import { config } from '../config.js'

class RadarrService extends ArrNamingService {
  constructor() {
    super(config.radarr)
  }
}

const radarrService = new RadarrService()
export default radarrService
