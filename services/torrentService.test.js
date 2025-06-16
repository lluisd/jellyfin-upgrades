import { jest } from '@jest/globals'
import moment from 'moment'
const getTorrentMock = jest.fn()
const getTorrentsWithErrorsMock = jest.fn()
const deleteTorrentMock = jest.fn()

jest.unstable_mockModule('../config.js', () => ({
  config: {
    torrentClient: { client: 'transmission' },
    trackers: { example: 7 }
  }
}))

jest.unstable_mockModule('../api/transmissionApi.js', () => ({
  TransmissionApi: jest.fn().mockImplementation(() => ({
    getTorrent: getTorrentMock,
    getTorrentsWithErrors: getTorrentsWithErrorsMock,
    deleteTorrent: deleteTorrentMock
  }))
}))

jest.unstable_mockModule('../api/qBittorrentApi.js', () => ({
  QBittorrentApi: jest.fn().mockImplementation(() => ({
    getTorrent: getTorrentMock,
    getTorrentsWithErrors: getTorrentsWithErrorsMock,
    deleteTorrent: deleteTorrentMock
  }))
}))

const { default: torrentService, MovieStatus } = await import('./torrentService.js')

describe('TorrentService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getTorrentsWithErrors', () => {
    it('returns torrents with errors', async () => {
      getTorrentsWithErrorsMock.mockResolvedValue([{ id: '1', error: 'Error' }])

      const result = await torrentService.getTorrentsWithErrors()

      expect(result).toEqual([{ id: '1', error: 'Error' }])
      expect(getTorrentsWithErrorsMock).toHaveBeenCalledTimes(1)
    })

    it('throws an error if API fails', async () => {
      getTorrentsWithErrorsMock.mockRejectedValue(new Error('API error'))

      await expect(torrentService.getTorrentsWithErrors()).rejects.toThrow('Error getting torrents: Error: API error')
    })
  })

  describe('canDeleteFromTorrentClient', () => {
    it('returns deletion status and reason', async () => {
      getTorrentMock.mockResolvedValue({
        isCompleted: true,
        isSeeding: true,
        secondsSeeding: 604800,
        tracker: 'example'
      })

      const result = await torrentService.canDeleteFromTorrentClient('movie', '.mkv')

      expect(result).toEqual({
        canDelete: true,
        reason: MovieStatus.NO_EXISTS,
        tracker: 'example',
        torrentExists: true,
        torrent: expect.any(Object)
      })
    })

    it.each([
      [432000, true, MovieStatus.NO_EXISTS],
      [431999, false, MovieStatus.INCOMPLETE_SEED_TIME]
    ])(
      'checks default min seeding time of 5 days when tracker is unknown',
      async (secondsSeeding, canDelete, reason) => {
        getTorrentMock.mockResolvedValue({
          isCompleted: true,
          isSeeding: true,
          secondsSeeding: secondsSeeding,
          tracker: 'another-example'
        })

        const result = await torrentService.canDeleteFromTorrentClient('movie', '.mkv')

        expect(result.canDelete).toBe(canDelete)
        expect(result.reason).toBe(reason)
      }
    )

    it.each([
      [false, false, 504800, false, MovieStatus.INCOMPLETE_SEED_TIME],
      [true, false, 504800, false, MovieStatus.INCOMPLETE_SEED_TIME],
      [true, true, 504800, false, MovieStatus.INCOMPLETE_SEED_TIME],
      [false, true, 604800, false, MovieStatus.DOWNLOAD_NOT_COMPLETED],
      [true, false, 604800, false, MovieStatus.NO_SEEDING],
      [false, false, 604800, false, MovieStatus.NO_SEEDING]
    ])(
      'returns false when isCompleted=%s, isSeeding=%s and secondsSeeding=%d ',
      async (isCompleted, isSeeding, secondsSeeding, canDelete, reason) => {
        getTorrentMock.mockResolvedValue({
          isCompleted: isCompleted,
          isSeeding: isSeeding,
          secondsSeeding: secondsSeeding,
          tracker: 'example',
          canRestSeedingOnRestart: false
        })

        const result = await torrentService.canDeleteFromTorrentClient('movie', '.mkv')

        expect(result.canDelete).toBe(canDelete)
        expect(result.reason).toBe(reason)
      }
    )

    it.each([
      [0, 0, false, MovieStatus.INCOMPLETE_SEED_TIME],
      [2, 3, false, MovieStatus.INCOMPLETE_SEED_TIME],
      [8, 2, true, MovieStatus.NO_EXISTS],
      [8, 0, true, MovieStatus.NO_EXISTS],
      [2, 8, true, MovieStatus.NO_EXISTS],
      [0, 8, true, MovieStatus.NO_EXISTS],
      [8, 8, true, MovieStatus.NO_EXISTS]
    ])(
      'on seeding can be restarted returns false if torrent if has incomplete seeding time but completed %i days ago and started %i days ago',
      async (daysCompleted, daysStarted, canDelete, reason) => {
        getTorrentMock.mockResolvedValue({
          isCompleted: true,
          isSeeding: true,
          secondsSeeding: 20000,
          tracker: 'example',
          canRestSeedingOnRestart: true,
          dateCompleted: daysCompleted === 0 ? 0 : moment().subtract(daysCompleted, 'days').unix(),
          startDate: daysStarted === 0 ? 0 : moment().subtract(daysStarted, 'days').unix()
        })

        const result = await torrentService.canDeleteFromTorrentClient('movie', '.mkv')

        expect(result.canDelete).toBe(canDelete)
        expect(result.reason).toBe(reason)
      }
    )

    it('throws an error if API fails', async () => {
      getTorrentMock.mockRejectedValue(new Error('API error'))

      await expect(torrentService.canDeleteFromTorrentClient('movie', '.mkv')).rejects.toThrow()
    })
  })

  describe('deleteFromTorrentClient', () => {
    it('deletes torrent if conditions are met', async () => {
      getTorrentMock.mockResolvedValue({
        isCompleted: true,
        isSeeding: true,
        secondsSeeding: 604800,
        tracker: 'example'
      })
      deleteTorrentMock.mockResolvedValue()

      const result = await torrentService.deleteFromTorrentClient('movie', '.mkv')

      expect(result).toEqual({
        tracker: 'example',
        torrentExists: true,
        deleted: true,
        reason: MovieStatus.DELETED
      })
      expect(deleteTorrentMock).toHaveBeenCalledTimes(1)
    })

    it('does not delete torrent if conditions are not met', async () => {
      getTorrentMock.mockResolvedValue({
        isCompleted: false,
        isSeeding: true,
        secondsSeeding: 200000,
        tracker: ''
      })

      const result = await torrentService.deleteFromTorrentClient('movie', '.mkv')

      expect(result.deleted).toBe(false)
      expect(result.reason).toBe(MovieStatus.INCOMPLETE_SEED_TIME)
      expect(deleteTorrentMock).not.toHaveBeenCalled()
    })

    it('throws an error if API fails', async () => {
      getTorrentMock.mockRejectedValue(new Error('API error'))

      await expect(torrentService.deleteFromTorrentClient('movie', '.mkv')).rejects.toThrow()
    })
  })
})
