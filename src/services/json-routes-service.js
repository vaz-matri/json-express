import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'

const dirname = join(process.cwd())
const files = readdirSync(dirname)

const jsonRoutes = {}

const prepare = async () => {
    for (const filename of files) {
        if (!filename.includes('.json')) return

        const filePath = join(dirname, filename)

        const fileContent = readFileSync(filePath, 'utf8')
        const file = JSON.parse(fileContent)
        const path = filename.replace('.json', '')

        jsonRoutes[path] = file
    }
}

await prepare()

export default jsonRoutes
