import createRoute from './create-route.js'
import { addCollection } from '../db/in-memory.js'
import { getConfig } from '../db/config-store.js'

const init = (app, jsonRoutes) => {
    Object.keys(jsonRoutes).forEach(route => {
        addCollection(route, jsonRoutes[route])

        const routeConfig = getConfig(route)

        const router = createRoute(route, routeConfig)

        app.use(`/${route}`, router)
    })
}

export default init
