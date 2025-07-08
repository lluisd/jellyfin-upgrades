import 'dotenv/config'
import { config } from './config.js'
import express from 'express'
import cron from 'node-cron'
import moviesController from './controllers/moviesController.js'
import filesController from './controllers/filesController.js'
import tvShowsController from './controllers/tvShowsController.js'
import configController from './controllers/configController.js'

console.log('Connected')

const app = express()
app.use(express.static('public'))

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: err.message })
})

app.use(express.json())

app.get('/purgeMovies', async function (req, res, next) {
  try {
    const isNotifyOnly = config.torrentClient.notifyOnly || req.query.notifyOnly !== undefined
    const movies = await filesController.removeMovieTorrents(isNotifyOnly)
    const response = {
      message: movies,
      status: 'success'
    }
    res.json(response)
  } catch (error) {
    next(error)
  }
})

app.get('/purgeSeries', async function (req, res, next) {
  try {
    const isNotifyOnly = config.torrentClient.notifyOnly || req.query.notifyOnly !== undefined
    const series = await filesController.removeSeriesTorrents(isNotifyOnly)
    const response = {
      message: series,
      status: 'success'
    }
    res.json(response)
  } catch (error) {
    next(error)
  }
})

app.get('/orphanMovies', async function (req, res, next) {
  try {
    const orphanMovies = await filesController.notifyOrphanMovieFiles()
    const response = {
      message: orphanMovies,
      status: 'success'
    }
    res.json(response)
  } catch (error) {
    next(error)
  }
})

app.get('/orphanSeries', async function (req, res, next) {
  try {
    const orphanSeries = await filesController.notifyOrphanSeriesFiles()
    const response = {
      message: orphanSeries,
      status: 'success'
    }
    res.json(response)
  } catch (error) {
    next(error)
  }
})

app.get('/errors', async function (req, res, next) {
  try {
    const torrents = await filesController.notifyTorrentsWithErrors()
    const response = {
      message: torrents,
      status: 'success'
    }
    res.json(response)
  } catch (error) {
    next(error)
  }
})

app.get('/avc10bitsMovies', async function (req, res, next) {
  try {
    const movies = await moviesController.notifyAVCMoviesWith10bits()
    const response = {
      message: movies,
      status: 'success'
    }
    res.json(response)
  } catch (error) {
    next(error)
  }
})

app.get('/avc10bitsEpisodes', async function (req, res, next) {
  try {
    const episodes = await tvShowsController.notifyAVCEpisodesWith10bits()
    const response = {
      message: episodes,
      status: 'success'
    }
    res.json(response)
  } catch (error) {
    next(error)
  }
})

app.get('/health', function (req, res) {
  res.json({ status: 'UP' })
})

app.get('/refresh', async function (req, res, next) {
  try {
    const movies = await moviesController.refreshMovies()
    const response = {
      message: `Updated ${movies.length} movies`,
      status: 'success'
    }
    res.json(response)
  } catch (error) {
    next(error)
  }
})

app.get('/episodesRefresh', async function (req, res, next) {
  try {
    const episodes = await tvShowsController.refreshEpisodes()
    const response = {
      message: `Updated ${episodes.length} episodes`,
      status: 'success'
    }
    res.json(response)
  } catch (error) {
    next(error)
  }
})

app.post('/addedMovie', async function (req, res, next) {
  try {
    const isNotifyOnly = config.torrentClient.notifyOnly || req.query.notifyOnly !== undefined
    const data = req.body
    console.log('Received added movie item webhook: ' + JSON.stringify(data, null, 2))
    const result = await moviesController.updateMovie(data.id, data.tmdb, data.imdb, data.tvdb, data.name, isNotifyOnly)
    const response = {
      message: result,
      status: 'success'
    }
    res.json(response)
  } catch (error) {
    next(error)
  }
})

app.post('/addedEpisode', async function (req, res, next) {
  try {
    const isNotifyOnly = config.torrentClient.notifyOnly || req.query.notifyOnly !== undefined
    const data = req.body
    console.log('Received added episode item webhook: ' + JSON.stringify(data, null, 2))
    const result = await tvShowsController.updateEpisode(
      data.id,
      data.tmdb,
      data.imdb,
      data.tvdb,
      data.name,
      data.seriesName,
      data.seasonNumber,
      data.episodeNumber,
      isNotifyOnly
    )
    const response = {
      message: result,
      status: 'success'
    }
    res.json(response)
  } catch (error) {
    next(error)
  }
})

app.post('/deletedMovie', async function (req, res, next) {
  try {
    const data = req.body
    console.log('Received deleted item webhook:', data)
    const result = await moviesController.deleteMovie(data.id, data.tmdb, data.imdb, data.tvdb, data.name)
    const response = {
      message: result,
      status: 'success'
    }
    res.json(response)
  } catch (error) {
    next(error)
  }
})

const listener = app.listen(process.env.PORT, async () => {
  console.log('Listening on port ', +listener.address().port)
  console.log('Database type: ', config.database.type)
  await configController.checkJellyfinLibraries()
  await moviesController.refreshMovies()
  await tvShowsController.refreshEpisodes()
  await configController.checkTorrentFolders()
})

cron.schedule('0 4 * * *', async () => {
  await moviesController.refreshMovies()
})

cron.schedule('5 4 * * *', async () => {
  await tvShowsController.refreshEpisodes()
})

cron.schedule('30 4 * * *', async () => {
  await filesController.removeMovieTorrents(config.torrentClient.notifyOnly)
})

cron.schedule('40 4 * * *', async () => {
  await filesController.removeSeriesTorrents(config.torrentClient.notifyOnly)
})

cron.schedule('5 5 * * *', async () => {
  await filesController.notifyTorrentsWithErrors()
})

cron.schedule('20 5 * * *', async () => {
  await moviesController.notifyAVCMoviesWith10bits()
})

cron.schedule('40 5 * * *', async () => {
  await tvShowsController.notifyAVCEpisodesWith10bits()
})
