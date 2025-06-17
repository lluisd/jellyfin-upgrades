export const config = {
  database: process.env.MONGODB_URI,
  jellyfin: {
    url: process.env.JELLYFIN_URL,
    apiKey: process.env.JELLYFIN_API_KEY,
    moviesLibraryId: process.env.JELLYFIN_MOVIES_LIBRARY_ID,
    seriesLibraryId: process.env.JELLYFIN_SERIES_LIBRARY_ID
  },
  port: process.env.PORT,
  trackers: process.env.TRACKERS
    ? JSON.parse(process.env.TRACKERS).reduce((acc, obj) => {
        const key = Object.keys(obj)[0]
        acc[key] = obj[key]
        return acc
      }, {})
    : {},
  torrentClient: {
    client: process.env.TORRENT_CLIENT,
    host: process.env.TORRENT_CLIENT_HOST,
    port: process.env.TORRENT_CLIENT_PORT,
    username: process.env.TORRENT_CLIENT_USERNAME,
    password: process.env.TORRENT_CLIENT_PASSWORD,
    moviesCompleteFolder: process.env.TORRENT_CLIENT_MOVIES_COMPLETE_FOLDER,
    seriesCompleteFolder: process.env.TORRENT_CLIENT_SERIES_COMPLETE_FOLDER,
    notifyOnly: (process.env.TORRENT_CLIENT_NOTIFY_ONLY || '').toLowerCase() === 'true'
  },
  telegram: {
    token: process.env.TELEGRAM_TOKEN,
    channelId: process.env.TELEGRAM_CHAT_ID
  },
  radarr: {
    url: process.env.RADARR_URL,
    apiKey: process.env.RADARR_API_KEY
  }
}
