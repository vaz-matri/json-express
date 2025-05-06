import createRoute from './create-route.js'
import { addCollection } from '../db/in-memory.js'

const routes = ['artists', 'albums']

const init = (app) => {
    routes.forEach(route => {
        addCollection(route)

        const router = createRoute(route)

        app.use(`/${route}`, router)
    })
}

export default init
