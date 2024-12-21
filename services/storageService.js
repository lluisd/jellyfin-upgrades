import fs from 'fs/promises'
import {config } from '../config.js'
import path from 'path'
import {exists} from '../utils/files.js'


class StorageService {
    async removeFileOrFolder(name, extension) {
        try {
            let isDeleted = false
            const filePath = `${config.transmission.completeFolder}${name}${extension}`
            const folderPath = `${config.transmission.completeFolder}${name}`

            const fileExists = await exists(filePath)

            if (fileExists) {
                await fs.unlink(filePath)
                isDeleted = true
            } else {
                const folderExists = await exists(folderPath)
                if (folderExists) {
                    await fs.rmdir(filePath, {recursive: true})
                    isDeleted = true
                }
            }

            return isDeleted
        } catch (error) {
            throw new Error(`Error removing file or folder: ${error}`)
        }
    }

    async getFilesWithoutHardlinks() {
        try {
            const filesWithoutHardlinks = [];
            const files = await fs.readdir(config.transmission.completeFolder)

            await Promise.all(files.map(async (file) => {
                const filePath = path.join(config.transmission.completeFolder, file)
                const stats = await fs.stat(filePath)

                if (stats.nlink === 1) {
                    filesWithoutHardlinks.push(file)
                }
            }));

            return filesWithoutHardlinks
        } catch (error) {
            throw new Error(`Error getting files without hardlinks: ${error}`)
        }
    }
}

const storageService = new StorageService()
export default storageService
