import fs from 'fs/promises'
import path from 'path'
import {exists} from '../utils/files.js'

class StorageService {
    async removeFileOrFolder(name, extension, rootFolder) {
        try {
            let isDeleted
            isDeleted = await this.removeFile(`${name}${extension}`, rootFolder)
            if (!isDeleted) {
               isDeleted = await this.removeFolder(name, rootFolder)
            }
            return isDeleted
        } catch (error) {
            throw new Error(`Error removing file or folder: ${error}`)
        }
    }

    async removeFolder(folderName, rootFolder) {
        try {
            let isDeleted = false
            const folderPath = path.join(rootFolder, folderName)

            const folderExists = await exists(folderPath)
            if (folderExists) {
                await fs.rmdir(folderPath, {recursive: true})
                isDeleted = true
            }

            return isDeleted
        } catch (error) {
            throw new Error(`Error removing folder: ${error}`)
        }
    }

    async removeFile(filename, rootFolder) {
        try {
            let isDeleted = false
            const filePath = path.join(rootFolder, filename)

            const fileExists = await exists(filePath)

            if (fileExists) {
                await fs.unlink(filePath)
                isDeleted = true
            }

            return isDeleted
        } catch (error) {
            throw new Error(`Error removing file: ${error}`)
        }
    }

    async getFilesWithoutHardlinks(rootFolder) {
        try {
            let filesWithoutHardlinks = []

            const readDirRecursive = async (dir) => {
                const files = await fs.readdir(dir)
                await Promise.all(files.map(async (file) => {
                    const filePath = path.join(dir, file)
                    const stats = await fs.stat(filePath)
                    if (stats.isDirectory()) {
                        await readDirRecursive(filePath)
                    } else if  (stats.nlink === 1) {
                        const relativeFilePath = path.relative(rootFolder, filePath)
                        filesWithoutHardlinks.push(relativeFilePath)
                    }
                }))
            }

            await readDirRecursive(rootFolder)
            return filesWithoutHardlinks
        } catch (error) {
            throw new Error(`Error getting files without hardlinks: ${error}`)
        }
    }
}

const storageService = new StorageService()
export default storageService
