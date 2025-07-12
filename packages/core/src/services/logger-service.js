import { getConfig } from '../db/config-store.js'
import jsonRoutes from '../services/json-routes-service.js'

export const logJsonRoutes = () => {
    const port = getConfig('port')
    const protocol = getConfig('protocol')

    Object.keys(jsonRoutes).forEach(route => {
        console.log(`Get ${route}:     GET     ${protocol}://localhost:${port}/${route}`)
        console.log(`Get one ${route}: GET     ${protocol}://localhost:${port}/${route}/:id`)
        console.log(`Search ${route}:  POST    ${protocol}://localhost:${port}/${route}`)
        console.log(`Create ${route}:  POST    ${protocol}://localhost:${port}/${route}`) //:TODO think of how to show request body since it's dynamic, ie, suggested by user
        console.log(`Update ${route}:  PATCH   ${protocol}://localhost:${port}/${route}/:id`)
        console.log(`Delete ${route}:  DELETE  ${protocol}://localhost:${port}/${route}/:id`)

        console.log()
    })
}

export const logServerStart = () => {
    const port = getConfig('port')
    const protocol = getConfig('protocol')

    if (protocol === 'https') {
        console.log(`🚀 Secure server running on https://localhost:${port}`)
        console.log(`🔒 Using TRUSTED certificates (no browser warnings!)`)
        console.log(`📝 Test: https://localhost:${port}/api/trusted`)
        console.log(`💚 Health check: https://localhost:${port}/health`)

        console.log()
    } else {
        console.log(`🚀 Server running on http://localhost:${port}`)
        console.log(`💚 Health check: http://localhost:${port}/health`)

        console.log()
    }
}

export const logPortChangeMessage = (configPort) => {
    const port = getConfig('port')

    if (port !== configPort) console.log(`⚠️  Port ${configPort} was busy, using ${port} instead`)

    console.log()
}
