import { jest } from '@jest/globals'

const getNamingConfigMock = jest.fn()
jest.unstable_mockModule('../api/radarrApi.js', () => ({
  default: { getNamingConfig: getNamingConfigMock }
}))

const { default: radarrNamingService } = await import('./radarrNamingService.js')

describe('RadarrNamingService', () => {
  beforeEach(() => {
    getNamingConfigMock.mockClear()
  })

  describe('loadNamingConfig', () => {
    it('loads naming config from RadarrApi', async () => {
      getNamingConfigMock.mockResolvedValue({
        replaceIllegalCharacters: false,
        colonReplacementFormat: 'smart'
      })

      await radarrNamingService.loadNamingConfig()

      expect(radarrNamingService.config.replaceIllegalCharacters).toBe(false)
      expect(radarrNamingService.config.colonReplacementFormat).toBe('smart')
    })

    it('throws an error if RadarrApi fails', async () => {
      getNamingConfigMock.mockRejectedValue(new Error('API error'))

      await expect(radarrNamingService.loadNamingConfig()).rejects.toThrow('API error')
    })
  })

  describe('applyRenaming', () => {
    it('applies renaming rules correctly', async () => {
      const input = 'Test:File/Name?*|<>"'
      const expected = 'Test-File+Name!-'

      getNamingConfigMock.mockResolvedValue({
        replaceIllegalCharacters: true,
        colonReplacementFormat: 'dash'
      })
      await radarrNamingService.loadNamingConfig()
      const result = radarrNamingService.applyRenaming(input)

      expect(result).toBe(expected)
    })

    it('on not replacing illegal characters', async () => {
      const input = 'Test:File/Name?*|<>"'
      const expected = 'TestFileName'

      getNamingConfigMock.mockResolvedValue({
        replaceIllegalCharacters: false,
        colonReplacementFormat: 'dash'
      })
      await radarrNamingService.loadNamingConfig()
      const result = radarrNamingService.applyRenaming(input)

      expect(result).toBe(expected)
    })

    it.each([
      ['smart', 'Test-File - a'],
      ['dash', 'Test-File- a'],
      ['spacedash', 'Test -File - a'],
      ['spacedashspace', 'Test - File -  a'],
      ['', 'TestFile a']
    ])('on colonReplacementFormat as %s', async (format, expected) => {
      const input = 'Test:File: a'
      getNamingConfigMock.mockResolvedValue({
        replaceIllegalCharacters: true,
        colonReplacementFormat: format
      })
      await radarrNamingService.loadNamingConfig()
      const result = radarrNamingService.applyRenaming(input)

      expect(result).toBe(expected)
    })

    it('trims leading and trailing spaces', () => {
      const input = '   .Test File Name.   '
      const expected = 'Test File Name.'

      const result = radarrNamingService.applyRenaming(input)

      expect(result).toBe(expected)
    })
  })
})
