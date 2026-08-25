import { jest } from '@jest/globals'

jest.unstable_mockModule('../config.js', () => ({
  config: {
    telegram: {
      token: 'mock-token',
      channelId: 'mock-channel-id'
    }
  }
}))

const sendMessageMock = jest.fn()

jest.unstable_mockModule('node-telegram-bot-api', () => ({
  Bot: jest.fn().mockImplementation(() => ({
    api: {
      sendMessage: sendMessageMock
    }
  }))
}))

const { default: telegramApi } = await import('./telegramApi.js')

describe('telegramApi', () => {
  beforeEach(() => {
    sendMessageMock.mockClear()
  })

  it('sends a message with correct arguments', async () => {
    await telegramApi.notify('Hello')
    expect(sendMessageMock).toHaveBeenCalledWith({
      chat_id: 'mock-channel-id',
      text: 'Hello',
      parse_mode: 'Markdown'
    })
  })

  it('does not send a message if it exceeds the maximum length', async () => {
    const longMessage = 'a'.repeat(4001) // 4001 characters
    await telegramApi.notify(longMessage)
    expect(sendMessageMock).not.toHaveBeenCalled()
  })

  it('throws an error when called with invalid input', async () => {
    await expect(telegramApi.notify(null)).rejects.toThrow()
  })
})
