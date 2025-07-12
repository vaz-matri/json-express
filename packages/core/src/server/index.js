import { getConfig } from '../db/config-store.js'
import server from './server.js'
import secureServer from './secure-server.js'

const createServer = () => {
    const protocol = getConfig('protocol')

    if (protocol === 'https') {
        return secureServer
    } else {
        return server
    }
}

export default createServer
