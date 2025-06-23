import express from 'express'
import cors from 'cors'
import getPort from 'get-port'
import routes from './routes/index.js'
import jsonRoutes from './services/json-routes-service.js'
import logJsonRoutes from './services/logger-service.js'
import { getConfig } from './db/config-store.js'

const startServer = async () => {
    const app = express()

    app.use(express.json())
    app.use(cors())

    routes(app, jsonRoutes)

    let configPort = getConfig('port')
    const portSequence = Array.from({ length: 100 }, (_, i) => configPort + i)
    const port = await getPort({ port: portSequence })

    app.listen(port, () => {
        console.log()
        if (port !== configPort) {
            console.log(`⚠️  Port ${configPort} was busy, using ${port} instead`)
        }
        console.log(`🚀 Server running on port ${port}`)
        console.log()

        logJsonRoutes(jsonRoutes, port)
    })
}

export default startServer
