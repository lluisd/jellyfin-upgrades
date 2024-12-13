import fs from "fs"
import {config } from '../config.js'

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
            console.error(`Error removing file or folder: ${error}`)
        }
    }
}

const storageService = new StorageService()
export default storageService
