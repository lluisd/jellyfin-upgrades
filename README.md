# jellyfin-upgrades

This app is a remediation to the lack of preserve Date Added on Upgraded items in Jellyfin. There are some feature requestes here:
https://features.jellyfin.org/posts/2329/improve-recently-added-to-not-show-upgraded-items and https://features.jellyfin.org/posts/81/preserve-date-added-on-rename

It maintains a local database (sqlite or mongodb) with all the movies (not tv shows) to keep track of the Date Added to use it when a movie is upgraded.

## Updgrade Features

- **Preserve Date Added**: Keeps the original date added for upgraded movies in Jellyfin.
- **Telegram Notifications**: Sends notifications to a Telegram chat when a movie is added or upgraded.
- **Torrent Client Integration**: Supports Transmission and qBittorrent to remove the previous movie torrent on upgrade if the minimum seeding days are met.

## Extra Features
- **Purges Movies/Episodes without a hardlink**: If some movies are not in the Jellyfin library, they will be removed from torrent client.
- **Notifies on torrent errors**: If a torrent has some error, it will notify you via Telegram.
- **AVC Movies with 10 bits**: If a movie/episode is AVC with 10 bits, it will be notified via Telegram.

## Usage on docker
To run this project, you can use Docker. The application is designed to run in a Docker container, which simplifies deployment and management.

## Prerequisites
- Docker installed on your machine.
- Docker Compose (optional, for easier management of multi-container applications).
- MongoDB or SQLite for the database (MongoDB is recommended for production use).
- Jellyfin server running and accessible.
- A torrent client (Transmission or qBittorrent) configured and running.
- Telegram bot set up for notifications.
- Radarr server running and accessible (optional, for movie management).

## Environment variables

To configure the project, set the following environment variables grouped by their functionality

### Database Configuration:

By default, the application uses SQLite for the database. If you want to use MongoDB, you need to set the `DATABASE_TYPE` environment variable to `mongodb` and provide the `MONGODB_URI` and `MONGODB_NAME`.

| Variable Name       | Required | Default Value        | Description                                                      |
|---------------------|----------|----------------------|------------------------------------------------------------------|
| `DATABASE_TYPE`     | No       | `sqlite`             | Set the database type (`sqlite`, `mongodb`).                     |
| `DATABASE_FILE`     | No       | `jellyfin-upgrades`  | Sqlite database name                                             |
| `MONGODB_NAME`      | No       | `jellyfin-ugprades`  | The mongo database name                                          |
| `MONGODB_URI`       | No       | —                    | Must be a valid URI like `mongodb://username:password@host:port` |


### Jellyfin Configuration:

Configure the Jellyfin server to connect and manage the media libraries. You need to set the Jellyfin URL and API key.

| Variable Name                | Required | Default Value           | Description                                                           |
|------------------------------|----------|-------------------------|-----------------------------------------------------------------------|
| `JELLYFIN_URL`               | Yes      | —                       | URL of the Jellyfin server.                                           |
| `JELLYFIN_API_KEY`           | Yes      | —                       | API key for Jellyfin.                                                 |
| `JELLYFIN_MOVIES_LIBRARY_ID` | Yes      | —                       | ID of the Jellyfin movies library (can be obtained from startup logs) |
| `JELLYFIN_SERIES_LIBRARY_ID` | Yes      | —                       | ID of the Jellyfin series library (can be obtained from startup logs) |


### Telegram Configuration:

Configure the Telegram bot to send notifications. You need to create a bot using BotFather on Telegram and get the token and chat ID.

| Variable Name        | Required | Default Value           | Description                                                        |
|----------------------|----------|-------------------------|--------------------------------------------------------------------|
| `TELEGRAM_TOKEN`     | Yes      | —                       | Telegram bot token for sending notifications.                      |
| `TELEGRAM_CHAT_ID`   | Yes      | —                       | Telegram chat ID where notifications will be sent.                 |  


### Torrent Client Configuration:

Configure the torrent client to manage movie and series torrents. You can use either Transmission or qBittorrent.

| Variable Name                           | Required | Default Value | Description                                                         |
|-----------------------------------------|----------|---------------|---------------------------------------------------------------------|
| `TORRENT_CLIENT`                        | Yes      | —             | Torrent client to use (`transmission` or `qbittorrent`).            |
| `TORRENT_CLIENT_HOST`                   | Yes      | —             | Hostname or IP address of the torrent client.                       |
| `TORRENT_CLIENT_PORT`                   | Yes      | —             | Port number for the torrent client.                                 |
| `TORRENT_CLIENT_USERNAME`               | Yes      | —             | Username for torrent client authentication.                         |
| `TORRENT_CLIENT_PASSWORD`               | Yes      | —             | Password for torrent client authentication.                         |
| `TORRENT_CLIENT_MOVIES_COMPLETE_FOLDER` | Yes      | —             | Path to the folder for completed movie torrents.                    |
| `TORRENT_CLIENT_SERIES_COMPLETE_FOLDER` | Yes      | —             | Path to the folder for completed series torrents.                   |
| `TORRENT_CLIENT_NOTIFY_ONLY`            | No       | `true`        | If `true`, only sends notifications without removing torrents.      |


### Trackers Configuration (optional):

Configure the trackers minimum seeding days to prevent the deletion of torrents until the specified number of days has passed.

| Variable Name | Required | Default Value  | Description                                                                                  |
|----------------|----------|----------------|----------------------------------------------------------------------------------------------|
| `TRACKERS`      | Yes     | —              | JSON array mapping tracker sites to seeding days. Example: `[{"tracker1":3},{"tracker2":2}]` |


###  Radarr Configuration (optional):

Configure Radarr url and API key if you want to apply the same renaming rules as Radarr does. This is useful on deleting the previous movie torrent on upgrade.

| Variable Name        | Required | Default Value           | Description                                                        |
|----------------------|----------|-------------------------|--------------------------------------------------------------------|
| `RADARR_URL`         | No       | —                       | URL of the Radarr server.                                          |
| `RADARR_API_KEY`     | No       | —                       | API key for Radarr.                                                |


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
      - DATABASE_TYPE=mongodb
      - MONGODB_NAME=jellyfin
      - MONGODB_URI=mongodb://username:password@host:port
      - TRACKERS=[{"tracker1":3},{"tracker2":2},{"tracker3":5}]
      - TORRENT_CLIENT=transmission
      - TORRENT_CLIENT_HOST=192.168.0.100
      - TORRENT_CLIENT_PORT=9091
      - TORRENT_CLIENT_USERNAME=admin
      - TORRENT_CLIENT_PASSWORD=password
      - TELEGRAM_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
      - TELEGRAM_CHAT_ID=33243324
      - TRANSMISSION_MOVIES_COMPLETE_FOLDER=/data1/torrents/complete/
      - TRANSMISSION_SERIES_COMPLETE_FOLDER=/data2/torrents/complete/
      - TORRENT_CLIENT_NOTIFY_ONLY=true      
      - RADARR_URL=http://radarr:7878
      - RADARR_API_KEY=ccaa83838abcd822aaaccccc831
    volumes:
      - /volume2/media1:/data1
      - /volume3/media2:/data2
    ports:
      - 2003:3000
    restart: unless-stopped
````