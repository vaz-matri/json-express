import express from 'express'
import routes from './routes/index.js'
import jsonFiles from './services/json-routes-service.js'
import logJsonRoutes from './services/logger-service.js'

const startServer = () => {
    const app = express()

    app.use(express.json())

    const { config, ...jsonRoutes } = jsonFiles

    routes(app, jsonRoutes)

    app.listen(config.PORT, () => {
        console.log(`app listening on port ${config.PORT}`)
        console.log()

        logJsonRoutes(jsonRoutes)
    })
}

export default startServer
