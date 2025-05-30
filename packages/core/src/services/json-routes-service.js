import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'
import { updateCofigStore } from '../db/config-store.js'

const dirname = join(process.cwd())
const files = readdirSync(dirname)

const jsonFiles = {}

const prepare = async () => {
    for (const filename of files) {
        if (!filename.includes('.json') || filename.includes('package') || filename.includes('-lock')) return

        const filePath = join(dirname, filename)

        const fileContent = readFileSync(filePath, 'utf8')
        let file = JSON.parse(fileContent)
        const path = filename.replace('.json', '')

        jsonFiles[path] = file
    }
}

await prepare()

if (!Object.keys(jsonFiles).length) {
    console.log('No json files found to serve')
    process.exit(1)
}

const { config = {}, ...jsonRoutes } = jsonFiles

updateCofigStore(config)

export default jsonRoutes
