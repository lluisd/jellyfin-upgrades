import { jest } from '@jest/globals'

const getNamingConfigMock = jest.fn()
jest.unstable_mockModule('../api/arrApi.js', () => ({
  default: { getNamingConfig: getNamingConfigMock }
}))

const { default: ArrNamingService } = await import('./arrNamingService.js')

describe('arrNamingService', () => {
  beforeEach(() => {
    getNamingConfigMock.mockClear()
  })

  describe('loadNamingConfig', () => {
    it('loads naming config from arrApi', async () => {
      getNamingConfigMock.mockResolvedValue({
        replaceIllegalCharacters: false,
        colonReplacementFormat: 'smart'
      })

      const config = {}
      const arrNamingService = new ArrNamingService(config)
      await arrNamingService.loadNamingConfig()

      expect(arrNamingService.namingConfig.replaceIllegalCharacters).toBe(false)
      expect(arrNamingService.namingConfig.colonReplacementFormat).toBe('smart')
    })

    it('throws an error if arrApi fails', async () => {
      getNamingConfigMock.mockRejectedValue(new Error('API error'))

      const config = {}
      const arrNamingService = new ArrNamingService(config)
      await expect(arrNamingService.loadNamingConfig()).rejects.toThrow('API error')
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

      const config = {}
      const arrNamingService = new ArrNamingService(config)
      await arrNamingService.loadNamingConfig()
      const result = arrNamingService.applyRenaming(input)

      expect(result).toBe(expected)
    })

    it('on not replacing illegal characters', async () => {
      const input = 'Test:File/Name?*|<>"'
      const expected = 'TestFileName'

      getNamingConfigMock.mockResolvedValue({
        replaceIllegalCharacters: false,
        colonReplacementFormat: 'dash'
      })

      const config = {}
      const arrNamingService = new ArrNamingService(config)
      await arrNamingService.loadNamingConfig()
      const result = arrNamingService.applyRenaming(input)

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

      const config = {}
      const arrNamingService = new ArrNamingService(config)
      await arrNamingService.loadNamingConfig()
      const result = arrNamingService.applyRenaming(input)

      expect(result).toBe(expected)
    })

    it('trims leading and trailing spaces', () => {
      const input = '   .Test File Name.   '
      const expected = 'Test File Name.'

      const config = {}
      const arrNamingService = new ArrNamingService(config)
      const result = arrNamingService.applyRenaming(input)

      expect(result).toBe(expected)
    })
  })
})
