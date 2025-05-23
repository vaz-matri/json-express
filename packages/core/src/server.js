import express from 'express'
import routes from './routes/index.js'
import jsonRoutes from './services/json-routes-service.js'
import logJsonRoutes from './services/logger-service.js'

const port = 3000

const startServer = () => {
    const app = express()

    app.use(express.json())

    routes(app, jsonRoutes)

    app.listen(port, () => {
        console.log(`app listening on port ${port}`)
        console.log()

        logJsonRoutes(jsonRoutes)
    })
}

export default startServer
