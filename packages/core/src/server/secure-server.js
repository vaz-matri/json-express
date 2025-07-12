import devcert from 'devcert'
import https from 'https'
import { logJsonRoutes, logServerStart } from '../services/logger-service.js'
import { getConfig } from '../db/config-store.js'

const createSecureServer = async (app) => {
    const port = getConfig('port')
    try {
        const ssl = await devcert.certificateFor('localhost')

        console.log('✅ Trusted SSL certificate generated')
        console.log()

        const httpsServer = https.createServer(ssl, app)

        httpsServer.listen(port, () => {
            logServerStart()

            logJsonRoutes()
        })
    } catch (error) {
        console.error('❌ Failed to set up SSL certificates:', error.message)
        console.log('💡 Try running as administrator/sudo for first-time setup')
        process.exit(1)
    }
}

export default createSecureServer
