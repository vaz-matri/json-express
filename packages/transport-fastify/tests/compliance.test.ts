import { it } from 'vitest';
import { runTransportComplianceTests } from '@json-express/core';
import { FastifyTransport } from '../src/index';

it('@json-express/transport-fastify passes the ITransport conformance suite', async () => {
    await runTransportComplianceTests(
        '@json-express/transport-fastify',
        (args) => new FastifyTransport(args)
    );
});
