import path from 'path'

export function getFilenameAndExtension (movie) {
    const fileNameWithExt = path.basename(movie.path)
    const fileNameWithoutExt = path.parse(fileNameWithExt).name
    const fileExtension = path.extname(movie.path)

    return {
        name: fileNameWithoutExt,
        extension: fileExtension
    }
}
