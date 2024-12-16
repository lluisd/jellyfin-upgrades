import fs from "fs"
import {config } from '../config.js'
import path from 'path'

class StorageService {
    removeFileOrFolder(name, extension) {
        try {
            let isDeleted = false
            const filePath = `${config.transmission.completeFolder}${name}${extension}`
            const folderPath = `${config.transmission.completeFolder}${name}`
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath)
                isDeleted = true
            } else if (fs.existsSync(folderPath)) {
                fs.rmdirSync(filePath, { recursive: true })
                isDeleted = true
            }
            return isDeleted
        } catch (error) {
            throw new Error(`Error removing file or folder: ${error}`)
        }
    }

    getFilesWithoutHardlinks() {
        try {
            const filesWithoutHardlinks = [];
            const files = fs.readdirSync(config.transmission.completeFolder)

            files.forEach(file => {
                const filePath = path.join(config.transmission.completeFolder, file)
                const stats = fs.statSync(filePath)

                if (stats.nlink === 1) {
                    filesWithoutHardlinks.push(file)
                }
            });

            return filesWithoutHardlinks
        } catch (error) {
            throw new Error(`Error getting files without hardlinks: ${error}`)
        }
    }
}

const storageService = new StorageService()
export default storageService
