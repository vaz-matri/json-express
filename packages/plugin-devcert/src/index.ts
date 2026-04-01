import devcert from 'devcert';
import type { IPlugin, IConfigProvider } from '@json-express/core';

export class DevcertPlugin implements IPlugin {
    public readonly name = 'devcert';

    public async onBoot(kernel: any, configProvider: IConfigProvider): Promise<void> {
        // 1. Production Defense in Depth! Never request sudo/keychain access in Prod.
        if (process.env.NODE_ENV === 'production') {
            console.log('🛡️  [DevcertPlugin] Production environment detected. Aborting local SSL generation safely.');
            return;
        }

        // 2. Check if the user really wants HTTPS enabled locally
        const isHttpsEnabled = configProvider.get<boolean>('https', false);

        if (!isHttpsEnabled) {
            return; // Stay perfectly silent if not explicitly requested
        }

        console.log('🔒 [DevcertPlugin] HTTPS requested. Checking local DevCert SSL certificates...');

        try {
            // 3. Request or Generate local machine certificates
            const ssl = await devcert.certificateFor('localhost', { installCertutil: true });
            
            // 4. Inject credentials back into the Configuration State safely!
            if (typeof configProvider.set === 'function') {
                configProvider.set('express.ssl', ssl);
                console.log('✅ [DevcertPlugin] Successfully bound trusted SSL certificates to the Express Transport.');
            } else {
                console.warn('⚠️  [DevcertPlugin] Could not inject SSL certs. ConfigProvider does not support dynamic .set() method.');
            }

        } catch (error: any) {
            console.error('❌ [DevcertPlugin] Failed to generate local SSL certificates. Falling back to HTTP.', error.message);
        }
    }
}
