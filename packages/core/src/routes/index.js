import createRoute from './create-route.js'
import { addCollection } from '../db/in-memory.js'

const init = (app, jsonRoutes, configs) => {
    Object.keys(jsonRoutes).forEach(route => {
        addCollection(route, jsonRoutes[route])

        const router = createRoute(route, configs[route])

        app.use(`/${route}`, router)
    })
}

export default init
