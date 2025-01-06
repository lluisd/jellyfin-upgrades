import storageService from "../services/storageService.js"
import torrentService from "../services/torrentService.js"
import { getFilenameAndExtension } from '../utils/files.js'
import semaphore from '../semaphore.js'
import notificationService from "../services/notificationService.js"

class FilesController {
    async removeTorrents () {
        const [ value, release ] = await semaphore.acquire()
        try {
            console.log('removing orphan torrents')
            const files = await storageService.getFilesWithoutHardlinks()

            let intents = []
            for (const filename of files) {
                const {name, extension} = getFilenameAndExtension(filename)
                let { deleted, reason, torrentExists, tracker} = await  torrentService.deleteFromTorrentClient(name, extension)
                if (!torrentExists) {
                    deleted = storageService.removeFileOrFolder(name, extension)
                }
                intents.push({filename, deleted, reason, torrentExists, tracker})
            }
            console.log(intents.length + ' orphan torrents')
            await notificationService.notifyOrphanTorrents(intents)
            return files
        } catch (error) {
            throw error
        } finally {
            release()
        }
    }

    async notifyTorrentsWithErrors () {
        const [ value, release ] = await semaphore.acquire()
        try {
            console.log('checking torrents with errors')
            const torrents = await torrentService.getTorrentsWithErrors()

            console.log(torrents.length + ' torrents with errors')
            await notificationService.notifyTorrentsWithErrors(torrents)
            return torrents
        } catch (error) {
            throw error
        } finally {
            release()
        }
    }
}

const filesController = new FilesController()
export default filesController
