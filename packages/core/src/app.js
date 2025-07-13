import express from 'express'
import cors from 'cors'
import routes from './routes/index.js'
import jsonRoutes from './services/json-routes-service.js'
import serverRoute from './routes/server-route.js'
import { preparePortNumber } from './services/port-service.js'
import createServer from './server/index.js'
import setupAuth from './auth/index.js'

const startServer = async () => {
    const app = express()

    await preparePortNumber()

    app.use(express.json())
    app.use(cors())

    app.use(serverRoute)
    routes(app, jsonRoutes)

    setupAuth(app)

    const server = createServer()
    await server(app)

}

export default startServer
