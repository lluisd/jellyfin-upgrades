import mediaService from '../services/mediaService.js'
import notificationService from '../services/notificationService.js'
import semaphore from '../semaphore.js'
import dataService from '../services/dataService.js'
import { getFilenameAndExtension } from '../utils/files.js'

class TvShowsController {
  async refreshEpisodes() {
    const [value, release] = await semaphore.acquire()
    try {
      console.log('Refreshing tv shows episodes')

      let episodes = []
      const tvShows = await mediaService.getTVShows()
      if (tvShows.length > 0) {
        await dataService.clearEpisodes()
      }
      for (const series of tvShows) {
        const episodeItems = await mediaService.getEpisodes(series.Id)
        for (const episodeItem of episodeItems) {
          episodes.push(mediaService.createEpisode(episodeItem))
        }
      }
      await dataService.addEpisodes(episodes)

      console.log(episodes.length + ' Refreshed episodes of ' + tvShows.length + ' TV shows')
      return episodes
    } catch (error) {
      throw error
    } finally {
      release()
    }
  }

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

  async updateEpisode(id, tmdb, imdb, tvdb, jellyfinName, seriesName, seasonNumber, episodeNumber, notifyOnly = false) {
    const [value, release] = await semaphore.acquire()
    try {
      let response = 'nothing'
      console.log(
        `upgrading episode: ${id} ${jellyfinName} of ${seriesName} S${seasonNumber} E${episodeNumber} (tmdb: ${tmdb}, imdb: ${imdb}, tvdb: ${tvdb})`
      )

      const dataEpisode = await dataService.getEpisode(tmdb, imdb, tvdb)
      const mediaEpisode = await mediaService.getEpisode(id)
      const isSameEpisode = mediaEpisode?.Id === dataEpisode?.jellyfinId

      console.log(
        `${id}: isSameEpisode: ${isSameEpisode} mediaEpisodeId: ${mediaEpisode?.Id} dataEpisodeId: ${dataEpisode?.jellyfinId}`
      )

      if (mediaEpisode && dataEpisode && !isSameEpisode) {
        console.log('Upgrading: Episode already exists in database and jellyfin but it is not the same file')
        const oldDate = mediaEpisode.DateCreated
        await mediaService.updateDateCreated(mediaEpisode, dataEpisode.dateCreated)

        const newSize = mediaEpisode?.MediaSources?.reduce((acc, source) => acc + source?.Size || 0, 0) ?? 0
        await dataService.updatePathAndSize(tmdb, imdb, tvdb, mediaEpisode.Path, newSize)
        const { name, extension } = getFilenameAndExtension(dataEpisode.path)

        await notificationService.notifyUpgradedEpisode(mediaEpisode, dataEpisode, oldDate, newSize)

        response = `Episode upgraded: ${mediaEpisode.Name} (tmdb: ${tmdb}, imdb: ${imdb}, tvdb: ${tvdb})`
        console.log(response)
      } else if (mediaEpisode && !dataEpisode) {
        console.log('Creating: Episode not found in dataEpisode but found in jellyfin')
        await dataService.addEpisode(mediaService.createEpisode(mediaEpisode))

        await notificationService.notifyAddedEpisode(mediaEpisode, tmdb)
        response = `Episode created: ${mediaEpisode.Name} (tmdb: ${tmdb}, imdb: ${imdb}, tvdb: ${tvdb})`
        console.log(response)
      } else {
        console.log('Episode not found in jellyfin neither in database')
      }
      return response
    } catch (error) {
      throw error
    } finally {
      release()
    }
  }
}

const tvShowsController = new TvShowsController()
export default tvShowsController
