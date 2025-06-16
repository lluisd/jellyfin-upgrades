import RadarrApi from '../api/radarrApi.js'

const badCharacters = ['\\', '/', '<', '>', '?', '*', '|', '"']
const goodCharacters = ['+', '+', '', '', '!', '-', '', '']

class RadarrNamingService {
  config = {}

  async loadNamingConfig() {
    try {
      const config = await RadarrApi.getNamingConfig()
      if (config) {
        this.config.replaceIllegalCharacters = config.replaceIllegalCharacters
        this.config.colonReplacementFormat = config.colonReplacementFormat
      }
    } catch (error) {
      throw error
    }
  }

  applyRenaming(input) {
    let result = input
    result = this._colonReplacement(result)
    result = this._replaceBadChars(result)
    result = result.replace(/^[ .]+/, '').replace(/ +$/, '')
    return result
  }

  _replaceBadChars(input) {
    let result = input

    for (let i = 0; i < badCharacters.length; i++) {
      const badChar = badCharacters[i]
      const replacement = this.config.replaceIllegalCharacters ? goodCharacters[i] : ''
      const regex = new RegExp(this._escapeRegExp(badChar), 'g')
      result = result.replace(regex, replacement)
    }

    return result
  }

  _escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  _colonReplacement(input) {
    let result = input
    if (this.config.replaceIllegalCharacters) {
      if (this.config.colonReplacementFormat.toLowerCase() === 'smart') {
        result = result.replace(/: /g, ' - ')
        result = result.replace(/:/g, '-')
      } else {
        let replacement = ''
        switch (this.config.colonReplacementFormat.toLowerCase()) {
          case 'dash':
            replacement = '-'
            break
          case 'spacedash':
            replacement = ' -'
            break
          case 'spacedashspace':
            replacement = ' - '
            break
        }
        result = result.replace(/:/g, replacement)
      }
    } else {
      result = result.replace(/:/g, '')
    }
    return result
  }
}

const radarrNamingService = new RadarrNamingService()
export default radarrNamingService
