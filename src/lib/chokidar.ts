import chokidar from 'chokidar'
import path from 'path'

const tmpFolder = path.resolve(__dirname, '../../tmp')
console.log(tmpFolder)
export const watcher = chokidar.watch(tmpFolder)
