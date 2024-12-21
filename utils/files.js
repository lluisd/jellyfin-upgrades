import path from 'path'
import fs from "fs/promises";

export function getFilenameAndExtension (completePath) {
    const fileNameWithExt = path.basename(completePath)
    const fileNameWithoutExt = path.parse(fileNameWithExt).name
    const fileExtension = path.extname(completePath)

    return {
        name: fileNameWithoutExt,
        extension: fileExtension
    }
}

export function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}


export async function exists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}
