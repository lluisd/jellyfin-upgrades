import { jest } from '@jest/globals'
import { TorrentState } from '@ctrl/qbittorrent'

jest.unstable_mockModule('../config.js', () => ({
  config: {
    torrentClient: {
      client: 'qBittorrent',
      host: 'mock-host',
      port: 'mock-port',
      username: 'mock-username',
      password: 'mock-password',
      moviesCompleteFolder: 'mock-movies-complete-folder',
      seriesCompleteFolder: 'mock-series-complete-folder'
    }
  }
}))

const listTorrentsMock = jest.fn()
const removeTorrentMock = jest.fn()
jest.unstable_mockModule('@ctrl/qbittorrent', () => {
  return {
    QBittorrent: jest.fn().mockImplementation(() => ({
      listTorrents: listTorrentsMock,
      removeTorrent: removeTorrentMock
    })),
    TorrentState: {
      ForcedUP: 'forcedUP',
      Uploading: 'uploading',
      StalledUP: 'stalledUP',
      Error: 'error',
      MissingFiles: 'missingFiles'
    }
  }
})

const { QBittorrentApi } = await import('./qBittorrentApi.js')

describe('QBittorrentApi', () => {
  let qbApi

  beforeEach(() => {
    qbApi = new QBittorrentApi()
    listTorrentsMock.mockClear()
    removeTorrentMock.mockClear()
  })
  describe('getTorrent', () => {
    it.each([
      [TorrentState.ForcedUP, true, 1, true],
      [TorrentState.Uploading, true, 0.75, false],
      [TorrentState.StalledUP, true, 1, true],
      [TorrentState.Downloading, false, 0.5, false],
      [TorrentState.Error, false, 0, false]
    ])(
      'returns torrent details when a matching torrent is found with state %s',
      async (state, isSeeding, progress, isCompleted) => {
        listTorrentsMock.mockResolvedValue([
          {
            hash: 'mock-hash',
            name: 'mock-torrent.mp4',
            seeding_time: 3600,
            tracker: 'http://mock-tracker.com',
            state: state,
            progress: progress
          }
        ])

        const result = await qbApi.getTorrent('mock-torrent', '.mp4')
        expect(result).toEqual({
          id: 'mock-hash',
          name: 'mock-torrent.mp4',
          secondsSeeding: 3600,
          tracker: 'mock-tracker',
          isSeeding: isSeeding,
          isCompleted: isCompleted,
          canRestSeedingOnRestart: true
        })
        expect(listTorrentsMock).toHaveBeenCalledWith({ includeTrackers: true })
      }
    )

    it('returns torrent details when a matching torrent is found without matching extension', async () => {
      listTorrentsMock.mockResolvedValue([
        {
          name: 'mock-torrent'
        }
      ])

      const result = await qbApi.getTorrent('mock-torrent', '.mp4')
      expect(result).toBeDefined()
    })

    it('returns undefined when no matching torrent is found', async () => {
      listTorrentsMock.mockResolvedValue([
        {
          name: 'other-torrent.mp4'
        }
      ])

      const result = await qbApi.getTorrent('mock-torrent', '.mp4')
      expect(result).toBeUndefined()
    })

    it('When applyRenamingFn is passed, appies to all torrents to be compared on', async () => {
      listTorrentsMock.mockResolvedValue([
        {
          name: 'extra-mock-torrent.mp4'
        }
      ])

      const applyRenamingFn = (name) => name.replace(/^extra-/, '')
      const result = await qbApi.getTorrent('mock-torrent', '.mp4', applyRenamingFn)
      expect(result).toBeDefined()
    })

    it('throws an error when the API call fails', async () => {
      listTorrentsMock.mockRejectedValue(new Error('Mocked error'))

      await expect(qbApi.getTorrent('mock-torrent', '.mp4')).rejects.toThrow()
      expect(listTorrentsMock).toHaveBeenCalledWith({ includeTrackers: true })
    })
  })

  describe('getTorrentsWithErrors', () => {
    let qbApi

    beforeEach(() => {
      qbApi = new QBittorrentApi()
      listTorrentsMock.mockClear()
    })

    it('returns torrents with errors', async () => {
      listTorrentsMock.mockResolvedValue([
        {
          hash: 'mock-hash-1',
          name: 'mock-torrent-1.mp4',
          state: TorrentState.Error
        },
        {
          hash: 'mock-hash-2',
          name: 'mock-torrent-2.mp4',
          state: TorrentState.MissingFiles
        },
        {
          hash: 'mock-hash-3',
          name: 'mock-torrent-3.mp4',
          state: TorrentState.ForcedUP
        }
      ])

      const result = await qbApi.getTorrentsWithErrors()
      expect(result).toEqual([
        {
          id: 'mock-hash-1',
          name: 'mock-torrent-1.mp4',
          error: 2,
          errorString: TorrentState.Error
        },
        {
          id: 'mock-hash-2',
          name: 'mock-torrent-2.mp4',
          error: 1,
          errorString: TorrentState.MissingFiles
        }
      ])
      expect(listTorrentsMock).toHaveBeenCalledWith({ includeTrackers: true })
    })

    it('returns an empty array when no torrents have errors', async () => {
      listTorrentsMock.mockResolvedValue([
        {
          hash: 'mock-hash-1',
          name: 'mock-torrent-1.mp4',
          state: TorrentState.ForcedUP
        },
        {
          hash: 'mock-hash-2',
          name: 'mock-torrent-2.mp4',
          state: TorrentState.Uploading
        }
      ])

      const result = await qbApi.getTorrentsWithErrors()
      expect(result).toEqual([])
      expect(listTorrentsMock).toHaveBeenCalledWith({ includeTrackers: true })
    })

    it('throws an error when the API call fails', async () => {
      listTorrentsMock.mockRejectedValue(new Error('Mocked error'))

      await expect(qbApi.getTorrentsWithErrors()).rejects.toThrow()
      expect(listTorrentsMock).toHaveBeenCalledWith({ includeTrackers: true })
    })
  })

  describe('deleteTorrent', () => {
    it('successfully deletes a torrent', async () => {
      removeTorrentMock.mockResolvedValue(true)
      const result = await qbApi.deleteTorrent('mock-id')
      expect(result).toBe(true)
      expect(removeTorrentMock).toHaveBeenCalledWith('mock-id', true)
    })

    it('throws an error when delete fails', async () => {
      removeTorrentMock.mockRejectedValue(new Error('Mocked error'))
      await expect(qbApi.deleteTorrent('mock-id')).rejects.toThrow()
    })
  })
})
