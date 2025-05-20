import express from 'express'
import routes from './routes/index.js'
import jsonRoutes from './services/json-routes-service.js'

const port = 3000

const startServer = () => {
    const app = express()

    app.use(express.json())

    routes(app, jsonRoutes)

    app.listen(port, () => {
        console.log(`app listening on port ${port}`)
    })
}

export default startServer
