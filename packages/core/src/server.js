import express from 'express'
import getPort from 'get-port'
import routes from './routes/index.js'
import jsonFiles from './services/json-routes-service.js'
import logJsonRoutes from './services/logger-service.js'

const startServer = async () => {
    const app = express()

    app.use(express.json())

    const { config, ...jsonRoutes } = jsonFiles

    routes(app, jsonRoutes)

    const portSequence = Array.from({ length: 100 }, (_, i) => config.PORT + i)
    const PORT = await getPort({ port: portSequence })

    app.listen(PORT, () => {
        console.log()
        if (PORT !== config.PORT) {
            console.log(`⚠️  Port ${config.PORT} was busy, using ${PORT} instead`)
        }
        console.log(`🚀 Server running on port ${PORT}`)
        console.log()

        logJsonRoutes(jsonRoutes, PORT)
    })
}

export default startServer
