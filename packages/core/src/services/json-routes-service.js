import { readdirSync, readFileSync } from 'fs'
import { extname, join } from 'path'
import { updateConfigStore } from '../db/config-store.js'
import defaultData from '../db/data/default-data.json' with { type: 'json' }

const dirname = join(process.cwd())
const files = readdirSync(dirname, { withFileTypes: true })
    .filter(dirent => dirent.isFile() && extname(dirent.name).toLowerCase() === '.json')
    .map(dirent => dirent.name)

let jsonFiles = {}

const prepareDefaultJson = async () => {
    jsonFiles = defaultData
}


const prepare = async () => {
    for (const filename of files) {
        if (!filename.includes('.json') || filename.includes('package') || filename.includes('-lock')) {
            continue
        }

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

let { config = {}, ...jsonRoutes } = jsonFiles

updateConfigStore(config)

if (!Object.keys(jsonRoutes).length) {
    await prepareDefaultJson();
    // DefaultData has a nested default payload usually, merging it safely
    jsonRoutes = jsonFiles;
}

export default jsonRoutes
