import 'dotenv/config'
import mongoose from 'mongoose'
import { config } from './config.js'
import express from "express"
import moviesController from "./controllers/moviesController.js";

mongoose.connect(config.database, {dbName: 'jellyfin'}).then(() => {
    console.log('Connected')

    const app = express()
    app.use(express.static('public'))

    app.use((err, req, res, next) => {
        console.error(err.stack)
        res.status(500).json({ message: err.message })
    })

    app.use(express.json())

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
            console.log('Received webhook:', data)
            const result = await moviesController.upgradeMovie(data.id, data.tmdb, data.imdb)
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
})






