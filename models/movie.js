import mongoose from 'mongoose'
const Schema = mongoose.Schema

/* Movie Schema */
const MovieSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    dateCreated: {
        type: String,
        required: true
    },
    path: {
        type: String,
        required: true
    },
    tmdb: {
        type: String,
        required: false
    },
    imdb: {
        type: String,
        required: false
    },
    lastModified: {
        type: Date,
        default: Date.now
    },
})

const Movie = mongoose.model('movie', MovieSchema, 'movies')
export default Movie
