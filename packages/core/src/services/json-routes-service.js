import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'
import { updateConfigStore } from '../db/config-store.js'
import {  faker } from '@faker-js/faker'

const dirname = join(process.cwd())
const files = readdirSync(dirname)

const jsonFiles = {}

const prepareDefaultJson = () => {
    function createRandomUser() {
        return {
            userId: faker.string.uuid(),
            username: faker.internet.username(),
            email: faker.internet.email(),
            avatar: faker.image.avatar(),
            password: faker.internet.password(),
            birthdate: faker.date.birthdate(),
            registeredAt: faker.date.past(),
        }
    }

    function createMusic() {
        return {
            album: faker.music.album(),
            artist: faker.music.artist(),
            genre: faker.music.genre(),
            songName: faker.music.songName(),
        }
    }

    function createBook() {
        return {
            title: faker.book.title(),
            author: faker.book.author(),
            genre: faker.book.genre(),
            series: faker.book.series(),
            publisher: faker.book.publisher(),
            format: faker.book.format(),
            isbn: faker.commerce.isbn()
        }
    }

    jsonFiles.users = faker.helpers.multiple(createRandomUser, { count: 10 })
    jsonFiles.music = faker.helpers.multiple(createMusic, { count: 100 })
    jsonFiles.book = faker.helpers.multiple(createBook, { count: 100 })
}

const prepare = async () => {
    for (const filename of files) {
        if (!filename.includes('.json') || filename.includes('package') || filename.includes('-lock')) {
            prepareDefaultJson()

            return
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

const { config = {}, ...jsonRoutes } = jsonFiles

updateConfigStore(config)

export default jsonRoutes
