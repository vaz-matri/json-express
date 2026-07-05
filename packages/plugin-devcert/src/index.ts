import * as devcert from 'devcert';
import type { IPlugin, IConfigProvider, ILogger } from '@json-express/core';

export class DevcertPlugin implements IPlugin {
    public readonly name = 'devcert';

    public async onBoot(kernel: any, configProvider: IConfigProvider): Promise<void> {
        const logger: ILogger = kernel.container.resolve('logger').child({ component: 'Devcert' });

        // 1. Production Defense in Depth! Never request sudo/keychain access in Prod.
        if (process.env.NODE_ENV === 'production') {
            logger.info('Production environment detected. Aborting local SSL generation safely.');
            return;
        }

        // 2. Installing the plugin opts you in to HTTPS by default.
        //    Users disable it explicitly with `jex.https=false`.
        const isHttpsEnabled = configProvider.get<boolean>('https', true);

        if (!isHttpsEnabled) {
            return; // Explicitly opted out via jex.https=false
        }

        logger.info('HTTPS requested. Checking local DevCert SSL certificates...');

        try {
            // 3. Request or Generate local machine certificates
            const ssl = await devcert.certificateFor('localhost', { skipCertutilInstall: false });
            
            // 4. Inject credentials back into the Configuration State safely!
            //    Both transports read different keys — feed both so devcert works
            //    regardless of which transport is active.
            if (typeof configProvider.set === 'function') {
                configProvider.set('express.ssl', ssl);
                configProvider.set('transport.fastify.ssl.key', ssl.key.toString());
                configProvider.set('transport.fastify.ssl.cert', ssl.cert.toString());
                logger.info('Successfully bound trusted SSL certificates to the active transport.');
            } else {
                logger.warn('Could not inject SSL certs. ConfigProvider does not support dynamic .set() method.');
            }

        } catch (error: any) {
            logger.error('Failed to generate local SSL certificates. Falling back to HTTP.', { error: error.message });
        }
    }
}

export default DevcertPlugin;
