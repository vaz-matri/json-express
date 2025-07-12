import getPort from 'get-port'
import { getConfig, upsertConfig } from '../db/config-store.js'
import { logPortChangeMessage } from './logger-service.js'

export const preparePortNumber = async () => {
    const configPort = getConfig('port')
    const portSequence = Array.from({ length: 100 }, (_, i) => configPort + i)

    const port = await getPort({ port: portSequence })

    upsertConfig('port', port)

    logPortChangeMessage(configPort)
}
