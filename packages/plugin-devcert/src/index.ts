import devcert from 'devcert';
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

        // 2. Check if the user really wants HTTPS enabled locally
        const isHttpsEnabled = configProvider.get<boolean>('https', false);

        if (!isHttpsEnabled) {
            return; // Stay perfectly silent if not explicitly requested
        }

        logger.info('HTTPS requested. Checking local DevCert SSL certificates...');

        try {
            // 3. Request or Generate local machine certificates
            const ssl = await devcert.certificateFor('localhost', { skipCertutilInstall: false });
            
            // 4. Inject credentials back into the Configuration State safely!
            if (typeof configProvider.set === 'function') {
                configProvider.set('express.ssl', ssl);
                logger.info('Successfully bound trusted SSL certificates to the Express Transport.');
            } else {
                logger.warn('Could not inject SSL certs. ConfigProvider does not support dynamic .set() method.');
            }

        } catch (error: any) {
            logger.error('Failed to generate local SSL certificates. Falling back to HTTP.', { error: error.message });
        }
    }
}
