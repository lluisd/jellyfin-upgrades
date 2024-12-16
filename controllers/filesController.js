import storageService from "../services/storageService.js"
import torrentService from "../services/torrentService.js"
import { getFilenameAndExtension } from '../utils/files.js'
import semaphore from '../semaphore.js'


class FilesController {
    async removeTorrents () {
        const [ value, release ] = await semaphore.acquire()
        try {
            console.log('removing orphan torrents')
            const files = storageService.getFilesWithoutHardlinks()
            for (const filename of files) {
                // const {name, extension} = getFilenameAndExtension(filename)
                // let { deleted, reason, torrentExists} = await  torrentService.deleteFromTorrentClient(name, extension)
                // if (!torrentExists) {
                //     deleted = storageService.removeFileOrFolder(name, extension)
                // }
            }
            return files
        } catch (error) {
            throw error
        } finally {
            release()
        }
    }
}

const filesController = new FilesController()
export default filesController
