import createRoute from './create-route.js'
import { addCollection } from '../db/in-memory.js'

const routes = {
    artists: [
        { name: 'Eminem', dob: '17-10-1972' }
    ],
    albums: [
        { name: 'Encore', releaseDate: '12-11-2004' }
    ]
}

const init = (app) => {
    Object.keys(routes).forEach(route => {
        addCollection(route, routes[route])

        const router = createRoute(route)

        app.use(`/${route}`, router)
    })
}

export default init
