import mongoose from 'mongoose'
const Schema = mongoose.Schema

/* Orphan Schema */
const OrphanSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  isMovie: {
    type: Boolean,
    required: true
  },
  lastModified: {
    type: Date,
    default: Date.now
  }
})

const Orphan = mongoose.model('orphan', OrphanSchema, 'orphans')
export default Orphan
