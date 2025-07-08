import arrApi from '../api/arrApi.js'

class ArrNamingService {
  namingConfig = {}

  constructor(config) {
    this.config = config
  }

  async loadNamingConfig() {
    try {
      const namingConfig = await arrApi.getNamingConfig(this.config)
      if (namingConfig) {
        this.namingConfig.replaceIllegalCharacters = namingConfig.replaceIllegalCharacters
        this.namingConfig.colonReplacementFormat = namingConfig.colonReplacementFormat
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
    const badCharacters = ['\\', '/', '<', '>', '?', '*', '|', '"']
    const goodCharacters = ['+', '+', '', '', '!', '-', '', '']
    let result = input

    for (let i = 0; i < badCharacters.length; i++) {
      const badChar = badCharacters[i]
      const replacement = this.namingConfig.replaceIllegalCharacters ? goodCharacters[i] : ''
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
    if (this.namingConfig.replaceIllegalCharacters) {
      if (this.namingConfig.colonReplacementFormat.toLowerCase() === 'smart') {
        result = result.replace(/: /g, ' - ')
        result = result.replace(/:/g, '-')
      } else {
        let replacement = ''
        switch (this.namingConfig.colonReplacementFormat.toLowerCase()) {
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

export default ArrNamingService
