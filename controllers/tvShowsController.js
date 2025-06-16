import mediaService from '../services/mediaService.js'
import notificationService from '../services/notificationService.js'
import semaphore from '../semaphore.js'

class TvShowsController {
  async notifyAVCEpisodesWith10bits() {
    const [value, release] = await semaphore.acquire()
    try {
      console.log('Checking episodes with AVC 10-bits')
      let totalEpisodes = []
      const tvShows = await mediaService.getTVShows()
      for (const series of tvShows) {
        const episodes = await mediaService.getAVC10bitsEpisodes(series.Id)
        await notificationService.notifyAVC10bitsEpisodes(episodes)
        if (episodes.length > 0) {
          totalEpisodes.push(episodes)
        }
        await notificationService.notifyAVC10bitsEpisodes(episodes)
      }
      console.log(totalEpisodes.length + ' episodes with AVC 10-bits')
      return totalEpisodes
    } catch (error) {
      throw error
    } finally {
      release()
    }
  }
}

const tvShowsController = new TvShowsController()
export default tvShowsController
