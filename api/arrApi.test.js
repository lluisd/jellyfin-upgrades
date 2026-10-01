import { jest } from '@jest/globals'

global.fetch = jest.fn()

// jest.unstable_mockModule('../config.js', () => ({
//   config: {
//     radarr: {
//       url: 'http://mock-arr-url',
//       apiKey: 'mock-api-key'
//     }
//   }
// }))

const { default: arrApi } = await import('./arrApi.js')

const config = {
  url: 'http://mock-arr-url',
  apiKey: 'mock-api-key'
}

describe('arrApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getMovies', () => {
    it('returns movies when API call is successful', async () => {
      const mockResponse = [
        { title: 'Movie 1', tmdbId: 1, imdbId: 'tt1', hasFile: true },
        { title: 'Movie 2', tmdbId: 2, imdbId: 'tt2', hasFile: false }
      ]
      fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      })

      const result = await arrApi.getMovies(config)

      expect(result).toEqual(mockResponse)
      expect(fetch).toHaveBeenCalledWith('http://mock-arr-url/api/v3/movie', {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': 'mock-api-key'
        },
        method: 'GET'
      })
    })

    it('throws an error when API response is not ok', async () => {
      fetch.mockResolvedValue({
        ok: false,
        status: 500
      })

      await expect(arrApi.getMovies(config)).rejects.toThrow('movie arr: 500')
    })

    it('throws an error when the API call fails', async () => {
      fetch.mockRejectedValue(new Error('Network error'))

      await expect(arrApi.getMovies(config)).rejects.toThrow('Network error')
    })
  })

  describe('getSeries', () => {
    it('returns series when API call is successful', async () => {
      const mockResponse = [{ id: 1, title: 'Series 1', tvdbId: 100, tmdbId: 200, imdbId: 'tt1' }]
      fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      })

      const result = await arrApi.getSeries(config)

      expect(result).toEqual(mockResponse)
      expect(fetch).toHaveBeenCalledWith('http://mock-arr-url/api/v3/series', {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': 'mock-api-key'
        },
        method: 'GET'
      })
    })

    it('throws an error when API response is not ok', async () => {
      fetch.mockResolvedValue({
        ok: false,
        status: 500
      })

      await expect(arrApi.getSeries(config)).rejects.toThrow('series arr: 500')
    })

    it('throws an error when the API call fails', async () => {
      fetch.mockRejectedValue(new Error('Network error'))

      await expect(arrApi.getSeries(config)).rejects.toThrow('Network error')
    })
  })

  describe('getEpisodes', () => {
    it('returns episodes of a series when API call is successful', async () => {
      const mockResponse = [
        { seriesId: 1, seasonNumber: 1, episodeNumber: 1, hasFile: true },
        { seriesId: 1, seasonNumber: 1, episodeNumber: 2, hasFile: false }
      ]
      fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      })

      const result = await arrApi.getEpisodes(config, 1)

      expect(result).toEqual(mockResponse)
      expect(fetch).toHaveBeenCalledWith('http://mock-arr-url/api/v3/episode?seriesId=1', {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': 'mock-api-key'
        },
        method: 'GET'
      })
    })

    it('throws an error when API response is not ok', async () => {
      fetch.mockResolvedValue({
        ok: false,
        status: 500
      })

      await expect(arrApi.getEpisodes(config, 1)).rejects.toThrow('episode arr: 500')
    })

    it('throws an error when the API call fails', async () => {
      fetch.mockRejectedValue(new Error('Network error'))

      await expect(arrApi.getEpisodes(config, 1)).rejects.toThrow('Network error')
    })
  })

  describe('getMovieByTmdb', () => {
    it('returns the first movie matching the tmdb id', async () => {
      fetch.mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue([{ id: 7, tmdbId: 123 }]) })

      const result = await arrApi.getMovieByTmdb(config, '123')

      expect(result).toEqual({ id: 7, tmdbId: 123 })
      expect(fetch).toHaveBeenCalledWith('http://mock-arr-url/api/v3/movie?tmdbId=123', expect.any(Object))
    })

    it('returns null when not found', async () => {
      fetch.mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue([]) })

      expect(await arrApi.getMovieByTmdb(config, '123')).toBeNull()
    })

    it('throws an error when API response is not ok', async () => {
      fetch.mockResolvedValue({ ok: false, status: 500 })

      await expect(arrApi.getMovieByTmdb(config, '123')).rejects.toThrow('movie by tmdb arr: 500')
    })
  })

  describe('getMovieImportHistory', () => {
    it('requests import events for the movie', async () => {
      fetch.mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue([{ downloadId: 'ABC' }]) })

      const result = await arrApi.getMovieImportHistory(config, 7)

      expect(result).toEqual([{ downloadId: 'ABC' }])
      expect(fetch).toHaveBeenCalledWith(
        'http://mock-arr-url/api/v3/history/movie?movieId=7&eventType=downloadFolderImported',
        expect.any(Object)
      )
    })

    it('throws an error when API response is not ok', async () => {
      fetch.mockResolvedValue({ ok: false, status: 500 })

      await expect(arrApi.getMovieImportHistory(config, 7)).rejects.toThrow('movie history arr: 500')
    })
  })
})
