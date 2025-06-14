import {config } from '../config.js'
import Transmission from 'transmission-promise'
import RadarrNamingService from "../services/radarrNamingService.js"

const transmission = new Transmission({
    host: config.transmission.host,
    port: config.transmission.port,
    username: config.transmission.username,
    password: config.transmission.password
})

async function getTorrent(name, extension, applyRenamingFn = null) {
    try {
        const apiResponse = await transmission.get(false, ['id', 'name', 'secondsSeeding', 'trackers',
            'activityDate', 'startDate', 'addedDate', 'doneDate', 'doneCompleted', 'status', 'seedIdleLimit',
            'idleSecs', 'percentComplete'])

        return apiResponse.torrents.find(torrent =>  {
            let torrentName = torrent.name
            if (applyRenamingFn) {
                torrentName = applyRenamingFn(torrent.name)
            }
            return torrentName === `${name}${extension}` || torrentName === name
        })
    } catch (error) {
        throw new Error(`Error getting torrent ${name}${extension}: ${error}`)
    }
}

async function getTorrents() {
    try {
        return transmission.get(false, ['id', 'name', 'trackers', 'status', 'error', 'errorString']);
    } catch (error) {
        throw new Error(`Error getting torrents: ${error}`)
    }
}

async function deleteTorrent(id) {
    try {
        return await transmission.remove(id, true)
    } catch (error) {
        throw new Error(`Error deleting torrent ${id}: ${error}`)
    }
}

export default  {
    getTorrent,
    deleteTorrent,
    getTorrents
}
