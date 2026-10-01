import { jest } from '@jest/globals'

const getMovieByTmdbMock = jest.fn()
const getMovieImportHistoryMock = jest.fn()
const getMoviesMock = jest.fn()

jest.unstable_mockModule('../config.js', () => ({
  config: { radarr: { url: 'http://radarr', apiKey: 'key' } }
}))

jest.unstable_mockModule('../api/arrApi.js', () => ({
  default: {
    getMovieByTmdb: getMovieByTmdbMock,
    getMovieImportHistory: getMovieImportHistoryMock,
    getMovies: getMoviesMock
  }
}))

const { default: radarrService } = await import('./radarrService.js')

const imported = (date, downloadId, importedPath = '/movies/Movie.mkv', fileId = '1') => ({
  date,
  downloadId,
  data: { importedPath, fileId }
})

describe('RadarrService.getPreviousDownloadHash', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getMovieByTmdbMock.mockResolvedValue({ id: 7, movieFile: { id: 1 } })
  })

  it('returns the lowercase hash of the import before the newest one, regardless of file names', async () => {
    getMovieImportHistoryMock.mockResolvedValue([
      imported('2024-01-01', 'OLDHASH', '/movies/Some.Torrent.Name.1080p.mkv'),
      imported('2025-01-01', 'NEWHASH', '/movies/Movie (2020) 2160p.mkv')
    ])

    const hash = await radarrService.getPreviousDownloadHash('123', null)

    expect(getMovieByTmdbMock).toHaveBeenCalledWith(expect.any(Object), '123')
    expect(getMovieImportHistoryMock).toHaveBeenCalledWith(expect.any(Object), 7)
    expect(hash).toBe('oldhash')
  })

  it('returns the most recent previous import when there are several older ones', async () => {
    getMovieImportHistoryMock.mockResolvedValue([
      imported('2023-01-01', 'OLDESTHASH'),
      imported('2025-01-01', 'NEWHASH'),
      imported('2024-01-01', 'OLDHASH')
    ])

    expect(await radarrService.getPreviousDownloadHash('123', null)).toBe('oldhash')
  })

  it('skips re-imports from the same download as the new file', async () => {
    getMovieImportHistoryMock.mockResolvedValue([
      imported('2025-01-02', 'NEWHASH'),
      imported('2025-01-01', 'newhash'),
      imported('2024-01-01', 'OLDHASH')
    ])

    expect(await radarrService.getPreviousDownloadHash('123', null)).toBe('oldhash')
  })

  it('returns null when there is only the new import', async () => {
    getMovieImportHistoryMock.mockResolvedValue([imported('2025-01-01', 'NEWHASH')])

    expect(await radarrService.getPreviousDownloadHash('123', null)).toBeNull()
  })

  it('returns null when the previous import has no download id (manual import)', async () => {
    getMovieImportHistoryMock.mockResolvedValue([
      imported('2025-01-01', 'NEWHASH'),
      imported('2024-06-01', null),
      imported('2024-01-01', 'OLDERHASH')
    ])

    expect(await radarrService.getPreviousDownloadHash('123', null)).toBeNull()
  })

  it('returns null when the movie is not in Radarr', async () => {
    getMovieByTmdbMock.mockResolvedValue(null)

    expect(await radarrService.getPreviousDownloadHash('123', null)).toBeNull()
    expect(getMovieImportHistoryMock).not.toHaveBeenCalled()
  })

  it('finds the movie by imdb when there is no tmdb id', async () => {
    getMoviesMock.mockResolvedValue([
      { id: 1, imdbId: 'tt1' },
      { id: 9, imdbId: 'tt9', movieFile: { id: 1 } }
    ])
    getMovieImportHistoryMock.mockResolvedValue([imported('2025-01-01', 'NEWHASH'), imported('2024-01-01', 'OLDHASH')])

    const hash = await radarrService.getPreviousDownloadHash(null, 'tt9')

    expect(getMovieByTmdbMock).not.toHaveBeenCalled()
    expect(getMovieImportHistoryMock).toHaveBeenCalledWith(expect.any(Object), 9)
    expect(hash).toBe('oldhash')
  })

  it('returns null when the newest import is not the current Radarr file', async () => {
    getMovieByTmdbMock.mockResolvedValue({ id: 7, movieFile: { id: 99 } })
    getMovieImportHistoryMock.mockResolvedValue([imported('2025-01-01', 'NEWHASH'), imported('2024-01-01', 'OLDHASH')])

    expect(await radarrService.getPreviousDownloadHash('123', null)).toBeNull()
  })

  it('returns null when the movie has no current file in Radarr', async () => {
    getMovieByTmdbMock.mockResolvedValue({ id: 7 })
    getMovieImportHistoryMock.mockResolvedValue([imported('2025-01-01', 'NEWHASH'), imported('2024-01-01', 'OLDHASH')])

    expect(await radarrService.getPreviousDownloadHash('123', null)).toBeNull()
  })

  it('returns null when the import history has no file id (older Radarr)', async () => {
    getMovieImportHistoryMock.mockResolvedValue([
      { date: '2025-01-01', downloadId: 'NEWHASH', data: {} },
      imported('2024-01-01', 'OLDHASH')
    ])

    expect(await radarrService.getPreviousDownloadHash('123', null)).toBeNull()
  })
})
