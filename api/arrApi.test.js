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
  radarr: {
    url: 'http://mock-arr-url',
    apiKey: 'mock-api-key'
  }
}

describe('arrApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getNamingConfig', () => {
    it('returns naming configuration when API call is successful', async () => {
      const mockResponse = { renameMovies: true, replaceIllegalCharacters: true }
      fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      })

      const result = await arrApi.getNamingConfig(config)

      expect(result).toEqual(mockResponse)
      expect(fetch).toHaveBeenCalledWith('http://mock-arr-url/api/v3/config/naming', {
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

      await expect(arrApi.getNamingConfig(config)).rejects.toThrow('config arr naming: 500')
    })

    it('throws an error when the API call fails', async () => {
      fetch.mockRejectedValue(new Error('Network error'))

      await expect(arrApi.getNamingConfig(config)).rejects.toThrow('Network error')
    })
  })
})
