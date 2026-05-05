import { it } from 'vitest';
import { runTransportComplianceTests } from '@json-express/core';
import { ExpressTransport } from '../src/index';

it('@json-express/transport-express passes the ITransport conformance suite', async () => {
    await runTransportComplianceTests(
        '@json-express/transport-express',
        (args) => new ExpressTransport(args)
    );
});
