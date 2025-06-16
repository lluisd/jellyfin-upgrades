# jellyfin-upgrades

ellyfin-upgrades is a Node.js project to manage Jellyfin media upgrades. It overrides media with original release dates, removes torrents after meeting minimum seeding time, cleans up files without hardlinks, checks torrent errors, and sends Telegram alerts for undesired formats. It integrates with Transmission/qBittorrent and is configurable via environment variables.
## Environment Variables
To configure the project, set the following environment variables:

| Variable Name                          | Description                                      | Example Value                          |
|----------------------------------------|--------------------------------------------------|----------------------------------------|
| `MONGODB_URI`                          | MongoDB connection string.                      | `mongodb://username:password@host:port` |
| `JELLYFIN_URL`                         | URL of the Jellyfin server.                     | `http://jellyfin:8096`                 |
| `JELLYFIN_API_KEY`                     | API key for Jellyfin.                           | `xxxxxx`                               |
| `JELLYFIN_MOVIES_LIBRARY_ID`           | ID of the Jellyfin movies library.              | `5b0d238e2fxxxxxxxxxxxxxxxxe217`     |
| `JELLYFIN_SERIES_LIBRARY_ID`           | ID of the Jellyfin series library.              | `10359ee834xxxxxxxxxxxxxxxxx073`     |
| `TRACKERS`                             | JSON array mapping tracker sites to seeding days. | `[{"tracker1":3},{"tracker2":2}]`      |
| `TORRENT_CLIENT`                       | Torrent client to use (`transmission` or `qbittorrent`). | `transmission`                         |
| `TORRENT_CLIENT_HOST`                  | Hostname or IP address of the torrent client.   | `192.168.0.160`                        |
| `TORRENT_CLIENT_PORT`                  | Port number for the torrent client.             | `9091`                                 |
| `TORRENT_CLIENT_USERNAME`              | Username for torrent client authentication.     | `admin`                                |
| `TORRENT_CLIENT_PASSWORD`              | Password for torrent client authentication.     | `password`                             |
| `TORRENT_CLIENT_MOVIES_COMPLETE_FOLDER`| Path to the folder for completed movie torrents.| `/data1/torrents/complete/`            |
| `TORRENT_CLIENT_SERIES_COMPLETE_FOLDER`| Path to the folder for completed series torrents.| `/data2/torrents/complete/`            |
| `TELEGRAM_TOKEN`                       | Telegram bot token.                             | `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11` |
| `TELEGRAM_CHAT_ID`                     | Telegram chat ID for notifications.             | `33243324`                              |
| `RADARR_URL`                           | URL of the Radarr server.                       | `http://radarr:7878`                   |
| `RADARR_API_KEY`                       | API key for Radarr.                             | `xxxxxx`                               |
| `PORT`                                 | Port number for the application.                | `3000`                                 |


## Docker compose
To run the project using Docker Compose, use the following command:

```yaml
services:
  adguard-client-updater:
    image: lluisd/jellyfin-upgrades:latest
    container_name: jellyfin-upgrades
    user: 1032:100 
    environment:
      - JELLYFIN_API_KEY=xxxxxx
      - JELLYFIN_URL=http://jellyfin:8096
      - JELLYFIN_MOVIES_LIBRARY_ID=5b0d238e2fxxxxxxxxxxxxxxxxe217
      - JELLYFIN_SERIES_LIBRARY_ID=10359ee834xxxxxxxxxxxxxxxxx073
      - MONGODB_URI=mongodb://username:password@host:port
      - TRACKERS=[{"tracker1":3},{"tracker2":2},{"tracker3":5}]
      - TORRENT_CLIENT=transmission
      - TORRENT_CLIENT_HOST=192.168.0.160
      - TORRENT_CLIENT_PORT=9091
      - TORRENT_CLIENT_USERNAME=admin
      - TORRENT_CLIENT_PASSWORD=password
      - TELEGRAM_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
      - TELEGRAM_CHAT_ID=33243324
      - TRANSMISSION_MOVIES_COMPLETE_FOLDER=/data1/torrents/complete/
      - TRANSMISSION_SERIES_COMPLETE_FOLDER=/data2/torrents/complete/
      - PORT=3000
    volumes:
      - /volume2/media1:/data1
      - /volume3/media2:/data2
    ports:
      - 2003:3000
    restart: unless-stopped
````