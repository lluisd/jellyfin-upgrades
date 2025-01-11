export const config = {
    database: process.env.MONGODB_URI,
    jellyfin: {
        url: process.env.JELLYFIN_URL,
        apiKey: process.env.JELLYFIN_API_KEY,
        moviesLibraryId: process.env.JELLYFIN_MOVIES_LIBRARY_ID,
        seriesLibraryId: process.env.JELLYFIN_SERIES_LIBRARY_ID,
    },
    port: process.env.PORT,
    trackers: JSON.parse(process.env.TRACKERS).reduce((acc, obj) => {
        const key = Object.keys(obj)[0];
        acc[key] = obj[key];
        return acc;
    }, {}),
    transmission: {
        host: process.env.TRANSMISSION_HOST,
        port: process.env.TRANSMISSION_PORT,
        username: process.env.TRANSMISSION_USERNAME,
        password: process.env.TRANSMISSION_PASSWORD,
        completeFolder: process.env.TRANSMISSION_COMPLETE_FOLDER
    },
    telegram: {
        token: process.env.TELEGRAM_TOKEN,
        channelId: process.env.TELEGRAM_CHAT_ID
    }
}
