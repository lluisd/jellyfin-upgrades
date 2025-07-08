import { jest } from '@jest/globals'

jest.unstable_mockModule('../config.js', () => ({
  config: {
    torrentClient: {
      client: 'qBittorrent',
      host: 'mock-host',
      port: 'mock-port',
      username: 'mock-username',
      password: 'mock-password',
      moviesFolder: 'mock-movies-folder',
      seriesFolder: 'mock-series-folder'
    }
  }
}))

const getTorrentsMock = jest.fn()
const removeTorrentMock = jest.fn()
jest.unstable_mockModule('transmission-promise', () => ({
  default: jest.fn().mockImplementation(() => ({
    get: getTorrentsMock,
    remove: removeTorrentMock
  }))
}))

const { TransmissionApi } = await import('./transmissionApi.js')

describe('TransmissionApi', () => {
  let trApi

  beforeEach(() => {
    trApi = new TransmissionApi()
    getTorrentsMock.mockClear()
    removeTorrentMock.mockClear()
  })

  describe('getTorrent', () => {
    it.each([
      [6, true, 1, true],
      [1, false, 0.75, false],
      [2, false, 1, true],
      [4, false, 0.5, false],
      [5, false, 0, false]
    ])(
      'returns torrent details when a matching torrent is found with state %s',
      async (state, isSeeding, progress, isCompleted) => {
        getTorrentsMock.mockResolvedValue({
          torrents: [
            {
              id: 1,
              hashString: 'abc123',
              name: 'testfile.mkv',
              secondsSeeding: 100,
              trackers: [{ sitename: 'tracker1' }],
              startDate: 12345,
              doneDate: 23456,
              status: state,
              percentComplete: progress
            }
          ]
        })

        const result = await trApi.getTorrent('testfile', '.mkv')
        expect(result).toEqual({
          id: 'abc123',
          name: 'testfile.mkv',
          secondsSeeding: 100,
          tracker: 'tracker1',
          startDate: 12345,
          dateCompleted: 23456,
          isSeeding: isSeeding,
          isCompleted: isCompleted,
          canRestSeedingOnRestart: true
        })
      }
    )

    it('returns torrent details when a matching torrent is found without matching extension', async () => {
      getTorrentsMock.mockResolvedValue({
        torrents: [
          {
            name: 'mock-torrent'
          }
        ]
      })

      const result = await trApi.getTorrent('mock-torrent', '.mp4')
      expect(result).toBeDefined()
    })

    it('returns undefined when no matching torrent is found', async () => {
      getTorrentsMock.mockResolvedValue({
        torrents: [
          {
            name: 'other-torrent.mp4'
          }
        ]
      })

      const result = await trApi.getTorrent('mock-torrent', '.mp4')
      expect(result).toBeUndefined()
    })

    it('When applyRenamingFn is passed, appies to all torrents to be compared on', async () => {
      getTorrentsMock.mockResolvedValue({
        torrents: [
          {
            name: 'extra-mock-torrent.mp4'
          }
        ]
      })

      const applyRenamingFn = (name) => name.replace(/^extra-/, '')
      const result = await trApi.getTorrent('mock-torrent', '.mp4', applyRenamingFn)
      expect(result).toBeDefined()
    })

    it('throws an error when the API call fails', async () => {
      getTorrentsMock.mockRejectedValue(new Error('Mocked error'))

      await expect(trApi.getTorrent('mock-torrent', '.mp4')).rejects.toThrow()
    })
  })

  describe('TransmissionApi - getTorrentsWithErrors', () => {
    it('returns torrents with errors', async () => {
      getTorrentsMock.mockResolvedValue({
        torrents: [
          { hashString: 'abc', name: 'file1', error: 1, errorString: 'fail', status: 0, trackers: [] },
          { hashString: 'def', name: 'file2', error: 0, errorString: '', status: 0, trackers: [] }
        ]
      })

      const result = await trApi.getTorrentsWithErrors()
      expect(result).toEqual([{ id: 'abc', name: 'file1', error: 1, errorString: 'fail' }])
    })

    it('returns an empty array when no torrents have errors', async () => {
      getTorrentsMock.mockResolvedValue({
        torrents: [
          { hashString: 'abc', name: 'file1', error: 0, errorString: '', status: 2, trackers: [] },
          { hashString: 'def', name: 'file2', error: 0, errorString: '', status: 3, trackers: [] }
        ]
      })

      const result = await trApi.getTorrentsWithErrors()
      expect(result).toEqual([])
    })

    it('throws an error when the API call fails', async () => {
      getTorrentsMock.mockRejectedValue(new Error('Mocked error'))

      await expect(trApi.getTorrentsWithErrors()).rejects.toThrow()
    })
  })

  describe('deleteTorrent', () => {
    it('successfully deletes a torrent', async () => {
      removeTorrentMock.mockResolvedValue(true)
      const result = await trApi.deleteTorrent('mock-id')
      expect(result).toBe(true)
      expect(removeTorrentMock).toHaveBeenCalledWith('mock-id', true)
    })

    it('throws an error when delete fails', async () => {
      removeTorrentMock.mockRejectedValue(new Error('Mocked error'))
      await expect(trApi.deleteTorrent('mock-id')).rejects.toThrow()
    })
  })
})
