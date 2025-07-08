import mongoose from 'mongoose'
const Schema = mongoose.Schema

/* Episode Schema */
const EpisodeSchema = new Schema({
  jellyfinId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  seriesName: {
    type: String,
    required: true
  },
  seasonNumber: {
    type: Number,
    required: true
  },
  episodeNumber: {
    type: Number,
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
  tvdb: {
    type: String,
    required: false
  },
  tmdb: {
    type: String,
    required: false
  },
  imdb: {
    type: String,
    required: false
  },
  size: {
    type: Schema.Types.Double,
    required: false
  },
  lastModified: {
    type: Date,
    default: Date.now
  }
})

const Episode = mongoose.model('episode', EpisodeSchema, 'episodes')
export default Episode
