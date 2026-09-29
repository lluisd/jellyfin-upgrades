import { stripArrIdTags } from './files.js'

describe('stripArrIdTags', () => {
  it.each([
    ['Movie (2020) [tmdbid-123]', 'Movie (2020)'],
    ['Movie (2020) {tmdb-123}', 'Movie (2020)'],
    ['Movie (2020) [imdbid-tt0123456]', 'Movie (2020)'],
    ['Movie (2020) {imdb-tt0123456}', 'Movie (2020)'],
    ['Series (2020) [tvdbid-456]', 'Series (2020)'],
    ['Series (2020) {tvdb-456}', 'Series (2020)'],
    ['Movie (2020) [TMDBID-123]', 'Movie (2020)'],
    ['Movie (2020)   [tmdbid-123]', 'Movie (2020)'],
    ['Movie (2020) [tmdbid-123] [imdbid-tt0123456]', 'Movie (2020)'],
    ['Movie (2020) [tmdbid-123] - 1080p', 'Movie (2020) - 1080p']
  ])('strips arr id tags from "%s"', (input, expected) => {
    expect(stripArrIdTags(input)).toBe(expected)
  })

  it.each(['Movie (2020)', 'Movie (2020) [1080p]', 'Movie (2020) {edition-Director}', 'Movie [tmdbid]'])(
    'leaves "%s" untouched',
    (input) => {
      expect(stripArrIdTags(input)).toBe(input)
    }
  )
})
