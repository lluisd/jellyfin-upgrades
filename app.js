import 'dotenv/config'
import mongoose from 'mongoose'
import { config } from './config.js'
import express from "express"
import moviesController from "./controllers/moviesController.js"
import filesController from "./controllers/filesController.js"
import cron from 'node-cron'

mongoose.connect(config.database, {dbName: 'jellyfin'}).then(() => {
    console.log('Connected')

    const app = express()
    app.use(express.static('public'))

    app.use((err, req, res, next) => {
        console.error(err.stack)
        res.status(500).json({ message: err.message })
    })

    app.use(express.json())

    app.get('/purge', async function(req, res, next) {
        try {
            const movies = await filesController.removeTorrents()
            const response = {
                message: movies,
                status: 'success'
            };
            res.json(response)
        } catch (error) {
            next(error)
        }
    })

    app.get('/errors', async function(req, res, next) {
        try {
            const torrents = await filesController.notifyTorrentsWithErrors()
            const response = {
                message: torrents,
                status: 'success'
            };
            res.json(response)
        } catch (error) {
            next(error)
        }
    })


    app.get('/health', function(req, res) {
        res.json({ status: 'UP' })
    })

    app.get('/refresh', async function(req, res, next) {
        try {
            const movies = await moviesController.refreshMovies()
            const response = {
                message: `Updated ${movies.length} movies`,
                status: 'success'
            };
            res.json(response)
        } catch (error) {
            next(error)
        }
    })

    app.post('/addedMovie', async  function(req, res, next) {
        try {
            const data = req.body
            console.log('Received added item webhook:', data)
            const result = await moviesController.updateMovie(data.id, data.tmdb, data.imdb, data.name)
            const response = {
                message: result,
                status: 'success'
            };
            res.json(response)
        } catch (error) {
            next(error)
        }
    })

    app.post('/deletedMovie', async  function(req, res, next) {
        try {
            const data = req.body
            console.log('Received deleted item webhook:', data)
            const result = await moviesController.deleteMovie(data.id, data.tmdb, data.imdb, data.name)
            const response = {
                message: result,
                status: 'success'
            };
            res.json(response)
        } catch (error) {
            next(error)
        }
    })

    const listener = app.listen(process.env.PORT, async ()=>  {
        console.log('Listening on port ', + listener.address().port)
    })

    cron.schedule('0 4 * * *', async () => {
        await moviesController.refreshMovies()
    })

    cron.schedule('30 4 * * *', async () => {
        await filesController.removeTorrents()
    })

    cron.schedule('5 5 * * *', async () => {
        await filesController.notifyTorrentsWithErrors()
    })
})






