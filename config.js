export const config = {
  port: process.env.PORT || 3000,
  database: {
    type: process.env.DATABASE_TYPE || 'sqlite',
    sqlite: {
      dbName: process.env.SQLITE_DB_NAME || 'jellyfin-upgrades',
      dbDir: process.env.DB_DIR || './data'
    },
    mongo: {
      dbName: process.env.MONGODB_NAME,
      uri: process.env.MONGODB_URI
    }
  },
  jellyfin: {
    url: process.env.JELLYFIN_URL,
    apiKey: process.env.JELLYFIN_API_KEY,
    moviesLibraryId: process.env.JELLYFIN_MOVIES_LIBRARY_ID,
    seriesLibraryId: process.env.JELLYFIN_SERIES_LIBRARY_ID
  },
  trackers: process.env.TRACKERS
    ? JSON.parse(process.env.TRACKERS).reduce((acc, obj) => {
        const key = Object.keys(obj)[0]
        acc[key] = obj[key]
        return acc
      }, {})
    : {},
  torrentClient: {
    notifyOnly: (process.env.TORRENT_CLIENT_NOTIFY_ONLY || 'true').toLowerCase() === 'true',
    client: process.env.TORRENT_CLIENT,
    host: process.env.TORRENT_CLIENT_HOST,
    port: process.env.TORRENT_CLIENT_PORT,
    username: process.env.TORRENT_CLIENT_USERNAME,
    password: process.env.TORRENT_CLIENT_PASSWORD,
    moviesFolder: process.env.TORRENT_CLIENT_MOVIES_FOLDER,
    seriesFolder: process.env.TORRENT_CLIENT_SERIES_FOLDER
  },
  telegram: {
    token: process.env.TELEGRAM_TOKEN,
    channelId: process.env.TELEGRAM_CHAT_ID
  },
  radarr: {
    url: process.env.RADARR_URL,
    apiKey: process.env.RADARR_API_KEY
  },
  sonarr: {
    url: process.env.SONARR_URL,
    apiKey: process.env.SONARR_API_KEY
  },
  debug: (process.env.DEBUG || '').toLowerCase() === 'true'
}
