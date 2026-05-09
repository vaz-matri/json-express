import { it } from 'vitest';
import { runAdapterComplianceTests } from '@json-express/core';
import type { ILogger } from '@json-express/core';
import { MemoryDatabaseAdapter } from '../src/index';

const silentLogger: ILogger = (() => {
    const noop = () => {};
    const l: ILogger = { info: noop, warn: noop, error: noop, debug: noop, child: () => l };
    return l;
})();

it('@json-express/adapter-memory passes the IDatabaseAdapter conformance suite', async () => {
    await runAdapterComplianceTests(
        () => new MemoryDatabaseAdapter({ logger: silentLogger })
    );
});
