import { logJsonRoutes, logServerStart } from '../services/logger-service.js'
import { getConfig } from '../db/config-store.js'

const createServer = async (app) => {
    const port = getConfig('port')

    app.listen(port, () => {
        logServerStart()

        logJsonRoutes()
    })
}

export default createServer
