import createRoute from './create-route.js'

const routes = ['artists', 'albums']

const init = (app) => {
    routes.forEach(route => {
        const router = createRoute(route)

        app.use(`/${route}`, router)
    })
}

export default init
