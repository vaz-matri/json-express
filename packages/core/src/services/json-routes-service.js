import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'

const dirname = join(process.cwd())
const files = readdirSync(dirname)

const defaultConfig = {
    PORT: 3000
}

const jsonRoutes = {
    config: defaultConfig
}

const prepare = async () => {
    for (const filename of files) {
        if (!filename.includes('.json') || filename.includes('package') || filename.includes('-lock')) return

        const filePath = join(dirname, filename)

        const fileContent = readFileSync(filePath, 'utf8')
        let file = JSON.parse(fileContent)
        const path = filename.replace('.json', '')

        if (path === 'config') {
            file = { ...defaultConfig, ...file }
        }

        jsonRoutes[path] = file
    }
}

await prepare()

if (!Object.keys(jsonRoutes).length) {
    console.log('No json files found to serve')
    process.exit(1)
}

export default jsonRoutes
